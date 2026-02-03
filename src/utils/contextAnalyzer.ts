/**
 * Context Analyzer - Multi-file context understanding
 *
 * Analyzes project structure to provide intelligent context for AI agents:
 * - File dependency analysis (imports/exports)
 * - Related file discovery
 * - Context building for better AI decisions
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface FileContext {
  path: string;
  imports: string[];
  exports: string[];
  dependencies: string[]; // Files this file imports
  dependents: string[]; // Files that import this file
  language: string;
}

export interface ProjectContext {
  files: Map<string, FileContext>;
  dependencyGraph: Map<string, Set<string>>;
  entryPoints: string[];
}

export interface ContextOptions {
  maxDepth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFiles?: number;
}

/**
 * Analyze project structure to build context
 */
export class ContextAnalyzer {
  private projectRoot: string;
  private context: ProjectContext;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.context = {
      files: new Map(),
      dependencyGraph: new Map(),
      entryPoints: [],
    };
  }

  /**
   * Build complete project context
   */
  async buildContext(options: ContextOptions = {}): Promise<ProjectContext> {
    const {
      maxDepth = 2,
      includePatterns = ['**/*.{ts,js,tsx,jsx,py,go,rs}'],
      excludePatterns = ['**/node_modules/**', '**/dist/**', '**/.orchestra/**', '**/*.test.ts', '**/*.test.js'],
    } = options;

    // Find all source files
    const files = await this.findSourceFiles(includePatterns, excludePatterns);

    // Analyze each file
    for (const file of files) {
      await this.analyzeFile(file);
    }

    // Build dependency graph
    this.buildDependencyGraph();

    // Find entry points (files with no dependents)
    this.findEntryPoints();

    return this.context;
  }

  /**
   * Get context for a specific file
   */
  async getFileContext(filePath: string, options: ContextOptions = {}): Promise<{
    file: FileContext;
    relatedFiles: FileContext[];
    dependencies: FileContext[];
    dependents: FileContext[];
  }> {
    const { maxDepth = 2 } = options;
    const normalizedPath = this.normalizePath(filePath);

    const file = this.context.files.get(normalizedPath);
    if (!file) {
      await this.analyzeFile(normalizedPath);
    }

    const fileContext = this.context.files.get(normalizedPath);
    if (!fileContext) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get related files based on depth
    const dependencies = this.getDependencies(normalizedPath, maxDepth);
    const dependents = this.getDependents(normalizedPath, maxDepth);
    const relatedFiles = [...dependencies, ...dependents];

    return {
      file: fileContext,
      relatedFiles,
      dependencies,
      dependents,
    };
  }

  /**
   * Get context for multiple files
   */
  async getMultiFileContext(filePaths: string[], options: ContextOptions = {}): Promise<{
    files: FileContext[];
    sharedDependencies: FileContext[];
    dependencyChain: string[][];
  }> {
    const contexts = await Promise.all(
      filePaths.map(p => this.getFileContext(p, options))
    );

    const files = contexts.map(c => c.file);
    const allDependencies = contexts.flatMap(c => c.dependencies);

    // Find shared dependencies
    const depCount = new Map<string, number>();
    for (const dep of allDependencies) {
      depCount.set(dep.path, (depCount.get(dep.path) || 0) + 1);
    }

    const sharedDependencies = Array.from(depCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([path, _]) => this.context.files.get(path)!)
      .filter(Boolean);

    // Build dependency chains between files
    const dependencyChain: string[][] = [];
    for (let i = 0; i < filePaths.length; i++) {
      for (let j = i + 1; j < filePaths.length; j++) {
        const chain = this.findDependencyChain(filePaths[i], filePaths[j]);
        if (chain.length > 0) {
          dependencyChain.push(chain);
        }
      }
    }

    return {
      files,
      sharedDependencies,
      dependencyChain,
    };
  }

  /**
   * Find files related to a task
   */
  async findRelevantFiles(task: string, options: ContextOptions = {}): Promise<string[]> {
    const { maxFiles = 10 } = options;

    // Extract keywords from task
    const keywords = this.extractKeywords(task);

    // Score files based on keyword matches
    const scoredFiles: Array<{ path: string; score: number }> = [];

    for (const [filePath, fileContext] of this.context.files) {
      let score = 0;

      // Check filename
      for (const keyword of keywords) {
        if (filePath.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Check imports/exports
      for (const imp of fileContext.imports) {
        for (const keyword of keywords) {
          if (imp.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }

      for (const exp of fileContext.exports) {
        for (const keyword of keywords) {
          if (exp.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }

      if (score > 0) {
        scoredFiles.push({ path: filePath, score });
      }
    }

    // Sort by score and return top N
    scoredFiles.sort((a, b) => b.score - a.score);
    return scoredFiles.slice(0, maxFiles).map(f => f.path);
  }

  /**
   * Generate context string for AI prompt
   */
  async generateContextString(filePath: string, options: ContextOptions = {}): Promise<string> {
    const context = await this.getFileContext(filePath, options);
    const lines: string[] = [];

    lines.push(`## Archivo Principal`);
    lines.push(`\`${context.file.path}\``);
    lines.push(`Lenguaje: ${context.file.language}`);
    lines.push('');

    if (context.dependencies.length > 0) {
      lines.push(`## Dependencias (${context.dependencies.length})`);
      for (const dep of context.dependencies.slice(0, 5)) {
        lines.push(`- \`${dep.path}\`: ${dep.exports.length} exports`);
      }
      lines.push('');
    }

    if (context.dependents.length > 0) {
      lines.push(`## Archivos que dependen de este (${context.dependents.length})`);
      for (const dep of context.dependents.slice(0, 5)) {
        lines.push(`- \`${dep.path}\``);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Find all source files in project
   */
  private async findSourceFiles(
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of includePatterns) {
      const matches = await glob(pattern, {
        cwd: this.projectRoot,
        absolute: false,
        ignore: excludePatterns,
      });
      files.push(...matches);
    }

    return [...new Set(files)].map(f => this.normalizePath(f));
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    const fullPath = path.join(this.projectRoot, normalizedPath);

    if (!existsSync(fullPath)) {
      return;
    }

    const content = readFileSync(fullPath, 'utf-8');
    const language = this.detectLanguage(normalizedPath);

    const context: FileContext = {
      path: normalizedPath,
      imports: this.extractImports(content, language),
      exports: this.extractExports(content, language),
      dependencies: [],
      dependents: [],
      language,
    };

    this.context.files.set(normalizedPath, context);
  }

  /**
   * Build dependency graph from file contexts
   */
  private buildDependencyGraph(): void {
    for (const [filePath, fileContext] of this.context.files) {
      const deps = new Set<string>();

      for (const imp of fileContext.imports) {
        // Find imported file
        const resolvedPath = this.resolveImportPath(filePath, imp);
        if (resolvedPath && this.context.files.has(resolvedPath)) {
          deps.add(resolvedPath);
          fileContext.dependencies.push(resolvedPath);
        }
      }

      this.context.dependencyGraph.set(filePath, deps);
    }

    // Build reverse dependencies (dependents)
    for (const [filePath, deps] of this.context.dependencyGraph) {
      for (const dep of deps) {
        const depContext = this.context.files.get(dep);
        if (depContext) {
          depContext.dependents.push(filePath);
        }
      }
    }
  }

  /**
   * Find entry points (files with no dependents)
   */
  private findEntryPoints(): void {
    for (const [filePath, fileContext] of this.context.files) {
      if (fileContext.dependents.length === 0) {
        this.context.entryPoints.push(filePath);
      }
    }
  }

  /**
   * Get transitive dependencies
   */
  private getDependencies(filePath: string, maxDepth: number): FileContext[] {
    const visited = new Set<string>();
    const result: FileContext[] = [];

    const traverse = (currentPath: string, depth: number) => {
      if (depth > maxDepth || visited.has(currentPath)) {
        return;
      }

      visited.add(currentPath);
      const context = this.context.files.get(currentPath);
      if (context) {
        result.push(context);
        for (const dep of context.dependencies) {
          traverse(dep, depth + 1);
        }
      }
    };

    traverse(filePath, 0);
    return result;
  }

  /**
   * Get transitive dependents
   */
  private getDependents(filePath: string, maxDepth: number): FileContext[] {
    const visited = new Set<string>();
    const result: FileContext[] = [];

    const traverse = (currentPath: string, depth: number) => {
      if (depth > maxDepth || visited.has(currentPath)) {
        return;
      }

      visited.add(currentPath);
      const context = this.context.files.get(currentPath);
      if (context) {
        result.push(context);
        for (const dep of context.dependents) {
          traverse(dep, depth + 1);
        }
      }
    };

    traverse(filePath, 0);
    return result;
  }

  /**
   * Find dependency chain between two files
   */
  private findDependencyChain(from: string, to: string): string[] {
    const queue: Array<{ path: string; chain: string[] }> = [
      { path: from, chain: [from] },
    ];
    const visited = new Set<string>([from]);

    while (queue.length > 0) {
      const { path: current, chain } = queue.shift()!;

      if (current === to) {
        return chain;
      }

      const context = this.context.files.get(current);
      if (context) {
        for (const dep of context.dependencies) {
          if (!visited.has(dep)) {
            visited.add(dep);
            queue.push({ path: dep, chain: [...chain, dep] });
          }
        }
      }
    }

    return [];
  }

  /**
   * Extract keywords from task
   */
  private extractKeywords(task: string): string[] {
    // Extract technical terms (camelCase, PascalCase, snake_case)
    const patterns = [
      /([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*)/g, // PascalCase/camelCase
      /([a-z][a-z0-9_]*[a-z0-9])/g, // snake_case
    ];

    const keywords = new Set<string>();
    for (const pattern of patterns) {
      const matches = task.match(pattern);
      if (matches) {
        matches.forEach(m => keywords.add(m));
      }
    }

    return Array.from(keywords);
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
    };
    return langMap[ext] || 'unknown';
  }

  /**
   * Extract imports from file content
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Match: import ... from '...' or require('...')
      const patterns = [
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
        /import\(['"]([^'"]+)['"]\)/g,
        /require\(['"]([^'"]+)['"]\)/g,
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          imports.push(match[1]);
        }
      }
    } else if (language === 'python') {
      // Match: from ... import ... or import ...
      const patterns = [
        /from\s+(\S+)\s+import/g,
        /import\s+(\S+)/g,
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          imports.push(match[1]);
        }
      }
    }

    return imports;
  }

  /**
   * Extract exports from file content
   */
  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Match: export ... or export default
      const patterns = [
        /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
        /export\s*\{([^}]+)\}/g,
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1]) {
            match[1].split(',').forEach(e => exports.push(e.trim()));
          }
        }
      }
    } else if (language === 'python') {
      // Match: functions and classes
      const patterns = [
        /^def\s+(\w+)/gm,
        /^class\s+(\w+)/gm,
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          exports.push(match[1]);
        }
      }
    }

    return exports;
  }

  /**
   * Resolve import path to file path
   */
  private resolveImportPath(fromFile: string, importPath: string): string | null {
    // Skip node_modules and built-in modules
    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      const resolved = path.resolve(path.dirname(fromFile), importPath);
      const exts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', ''];

      for (const ext of exts) {
        const withExt = resolved + ext;
        const normalized = this.normalizePath(withExt);
        if (this.context.files.has(normalized)) {
          return normalized;
        }
      }
    }

    return null;
  }

  /**
   * Normalize file path
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  }
}

/**
 * Build context for AI prompt
 */
export async function buildContextForPrompt(
  filePaths: string[],
  projectRoot: string = process.cwd(),
  options: ContextOptions = {}
): Promise<string> {
  const analyzer = new ContextAnalyzer(projectRoot);
  await analyzer.buildContext(options);

  const lines: string[] = ['## Contexto del Proyecto', ''];

  if (filePaths.length === 1) {
    const context = await analyzer.getFileContext(filePaths[0], options);
    lines.push(`### Archivo: ${context.file.path}`);
    lines.push(`Dependencias: ${context.dependencies.length}`);
    lines.push(`Dependientes: ${context.dependents.length}`);
    lines.push('');
  } else {
    const multiContext = await analyzer.getMultiFileContext(filePaths, options);
    lines.push(`### ${multiContext.files.length} Archivos Relacionados`);

    if (multiContext.sharedDependencies.length > 0) {
      lines.push(`Dependencias compartidas: ${multiContext.sharedDependencies.length}`);
    }

    if (multiContext.dependencyChain.length > 0) {
      lines.push(`Cadenas de dependencia encontradas: ${multiContext.dependencyChain.length}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
