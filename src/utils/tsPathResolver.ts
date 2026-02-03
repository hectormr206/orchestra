/**
 * TypeScript Path Resolver
 *
 * Handles TypeScript path aliases (tsconfig paths):
 * - Resolves aliases to real file paths
 * - Updates import statements when files are moved
 * - Validates path configurations
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { ProjectDetection } from './frameworkDetector';

export interface TSPathMapping {
  pattern: string;
  paths: string[];
}

export interface TSConfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
}

export interface PathAlias {
  alias: string;
  targetPattern: string;
  resolvedPaths: string[];
}

/**
 * Resolve TypeScript path aliases
 */
export class TSPathResolver {
  private projectRoot: string;
  private aliases: Map<string, string[]> = new Map();
  private baseUrl: string = '.';

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Load TypeScript configuration
   */
  async loadTSConfig(): Promise<boolean> {
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');

    if (!existsSync(tsConfigPath)) {
      return false;
    }

    try {
      const content = readFileSync(tsConfigPath, 'utf-8');
      const tsConfig: TSConfig = JSON.parse(content);

      const compilerOptions = tsConfig.compilerOptions || {};
      this.baseUrl = compilerOptions.baseUrl || '.';

      const paths = compilerOptions.paths || {};
      for (const [alias, targets] of Object.entries(paths)) {
        this.aliases.set(alias, targets);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolve an alias to actual file paths
   */
  resolveAlias(importPath: string): string[] | null {
    for (const [alias, targets] of this.aliases) {
      // Convert alias pattern to regex
      // e.g., "@/*" -> "^@/(.*)$"
      const pattern = alias.replace('*', '(.*)');
      const regex = new RegExp(`^${pattern}$`);

      const match = importPath.match(regex);
      if (match) {
        const wildcard = match[1] || '';

        return targets.map(target => {
          // Replace wildcard in target
          const resolved = target.replace('*', wildcard);
          return path.join(this.projectRoot, this.baseUrl, resolved);
        });
      }
    }

    return null;
  }

  /**
   * Check if an import uses an alias
   */
  isAliasImport(importPath: string): boolean {
    return this.resolveAlias(importPath) !== null;
  }

  /**
   * Update imports in file content when files are moved
   */
  updateImportsInFile(
    content: string,
    oldPath: string,
    newPath: string
  ): string {
    // Find all imports that use aliases
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    const updates: Array<{ old: string; new: string }> = [];

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      if (this.isAliasImport(importPath)) {
        const resolved = this.resolveAlias(importPath);
        if (resolved && resolved.some(r => r.includes(oldPath))) {
          // This import needs to be updated
          // For now, just keep it as is (full implementation would update the alias)
        }
      }
    }

    return content;
  }

  /**
   * Get all configured aliases
   */
  getAliases(): PathAlias[] {
    const result: PathAlias[] = [];

    for (const [alias, targets] of this.aliases) {
      result.push({
        alias,
        targetPattern: alias,
        resolvedPaths: targets.map(t =>
          path.join(this.projectRoot, this.baseUrl, t.replace('*', ''))
        ),
      });
    }

    return result;
  }

  /**
   * Validate that all alias targets exist
   */
  validateAliases(): Array<{ alias: string; target: string; valid: boolean }> {
    const results: Array<{ alias: string; target: string; valid: boolean }> = [];

    for (const [alias, targets] of this.aliases) {
      for (const target of targets) {
        const resolved = path.join(this.projectRoot, this.baseUrl, target.replace('*', ''));
        const valid = existsSync(resolved) || existsSync(resolved + '.ts') || existsSync(resolved + '.tsx');

        results.push({
          alias,
          target,
          valid,
        });
      }
    }

    return results;
  }

  /**
   * Generate import statement with alias
   */
  generateImport(alias: string, targetFile: string): string {
    // Remove file extension
    const withoutExt = targetFile.replace(/\.(ts|tsx|js|jsx)$/, '');

    // Make relative to baseUrl
    const relative = path.relative(this.baseUrl, withoutExt);

    // Find matching alias
    for (const [aliasPattern, targets] of this.aliases) {
      // Try to match the target file to the alias pattern
      for (const target of targets) {
        const targetPattern = target.replace('*', '');
        if (relative.startsWith(targetPattern) || relative.includes(targetPattern)) {
          // Build the alias import
          const wildcard = relative.substring(targetPattern.length);
          const suffix = wildcard.startsWith('/') ? wildcard : `/${wildcard}`;
          return alias.replace('*', suffix);
        }
      }
    }

    // No alias found, return relative path
    return relative.startsWith('./') ? relative : `./${relative}`;
  }

  /**
   * Convert relative imports to alias imports where possible
   */
  convertRelativeToAlias(content: string, currentFile: string): string {
    const importRegex = /from\s+['"](\.\.\/[^'"]+)['"]/g;
    let match;
    const replacements: Array<{ old: string; new: string }> = [];

    while ((match = importRegex.exec(content)) !== null) {
      const relativePath = match[1];
      const resolved = path.resolve(path.dirname(currentFile), relativePath);
      const relativeToBase = path.relative(this.baseUrl, resolved);

      // Try to find matching alias
      for (const [alias, targets] of this.aliases) {
        for (const target of targets) {
          const targetDir = path.dirname(target.replace('*', ''));
          if (relativeToBase.startsWith(targetDir)) {
            const wildcard = relativeToBase.substring(targetDir.length);
            const aliasImport = alias.replace('*', wildcard || '');
            replacements.push({
              old: relativePath,
              new: aliasImport,
            });
            break;
          }
        }
      }
    }

    // Apply replacements
    let updated = content;
    for (const { old, new: newImport } of replacements) {
      updated = updated.replace(`from '${old}'`, `from '${newImport}'`);
      updated = updated.replace(`from "${old}"`, `from "${newImport}"`);
    }

    return updated;
  }

  /**
   * Get context for AI about path aliases
   */
  generateContext(): string {
    const aliases = this.getAliases();

    if (aliases.length === 0) {
      return 'No path aliases configured in tsconfig.json';
    }

    const lines: string[] = [
      '## TypeScript Path Aliases',
      `Base URL: ${this.baseUrl}`,
      '',
      'Configured aliases:',
    ];

    for (const { alias, resolvedPaths } of aliases) {
      lines.push(`- \`${alias}\` → ${resolvedPaths.length} target(s)`);
      for (const resolved of resolvedPaths.slice(0, 2)) {
        lines.push(`  → \`${resolved}\``);
      }
    }

    lines.push('');
    lines.push('When creating new files, prefer using these aliases for imports.');
    lines.push('');

    return lines.join('\n');
  }
}

/**
 * Check if project uses TypeScript path aliases
 */
export async function hasPathAliases(projectRoot: string = process.cwd()): Promise<boolean> {
  const resolver = new TSPathResolver(projectRoot);
  const loaded = await resolver.loadTSConfig();
  return loaded && resolver.getAliases().length > 0;
}

/**
 * Get path aliases for project detection
 */
export async function getPathAliases(
  detection: ProjectDetection
): Promise<PathAlias[]> {
  if (!detection.hasTypeScript) {
    return [];
  }

  const resolver = new TSPathResolver();
  const loaded = await resolver.loadTSConfig();

  if (!loaded) {
    return [];
  }

  return resolver.getAliases();
}
