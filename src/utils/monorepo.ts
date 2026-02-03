/**
 * Monorepo Support - Detect and handle monorepo configurations
 *
 * Supports:
 * - npm/yarn workspaces
 * - pnpm workspaces
 * - Turbo (Turborepo)
 * - Nx (Lerna/Nx)
 * - Multi-package repositories
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export type MonorepoType = 'npm' | 'yarn' | 'pnpm' | 'turborepo' | 'nx' | 'lerna' | 'unknown';

export interface MonorepoConfig {
  type: MonorepoType;
  root: string;
  packages: string[];
  packagesDir?: string;
  workspaceConfig: string;
  toolConfig?: string;
}

export interface PackageInfo {
  name: string;
  path: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

export interface MonorepoDetectionResult {
  isMonorepo: boolean;
  config?: MonorepoConfig;
  packages?: PackageInfo[];
  errors: string[];
}

/**
 * Monorepo Detector
 */
export class MonorepoDetector {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Detect monorepo configuration
   */
  detect(): MonorepoDetectionResult {
    const result: MonorepoDetectionResult = {
      isMonorepo: false,
      errors: [],
    };

    // Check for npm/yarn workspaces
    const npmWorkspaces = this.detectNpmWorkspaces();
    if (npmWorkspaces) {
      result.isMonorepo = true;
      result.config = npmWorkspaces;
      result.packages = this.discoverPackages(npmWorkspaces);
      return result;
    }

    // Check for pnpm workspaces
    const pnpmWorkspaces = this.detectPnpmWorkspaces();
    if (pnpmWorkspaces) {
      result.isMonorepo = true;
      result.config = pnpmWorkspaces;
      result.packages = this.discoverPackages(pnpmWorkspaces);
      return result;
    }

    // Check for Turborepo
    const turbo = this.detectTurborepo();
    if (turbo) {
      result.isMonorepo = true;
      result.config = turbo;
      result.packages = this.discoverPackages(turbo);
      return result;
    }

    // Check for Nx
    const nx = this.detectNx();
    if (nx) {
      result.isMonorepo = true;
      result.config = nx;
      result.packages = this.discoverPackages(nx);
      return result;
    }

    // Check for Lerna
    const lerna = this.detectLerna();
    if (lerna) {
      result.isMonorepo = true;
      result.config = lerna;
      result.packages = this.discoverPackages(lerna);
      return result;
    }

    return result;
  }

  /**
   * Detect npm/yarn workspaces
   */
  private detectNpmWorkspaces(): MonorepoConfig | null {
    const packageJsonPath = path.join(this.cwd, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      if (!packageJson.workspaces) {
        return null;
      }

      const workspaces = Array.isArray(packageJson.workspaces)
        ? packageJson.workspaces
        : packageJson.workspaces.packages || [];

      if (workspaces.length === 0) {
        return null;
      }

      const hasYarnLock = existsSync(path.join(this.cwd, 'yarn.lock'));
      const type: MonorepoType = hasYarnLock ? 'yarn' : 'npm';

      return {
        type,
        root: this.cwd,
        packages: workspaces,
        workspaceConfig: 'package.json',
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect pnpm workspaces
   */
  private detectPnpmWorkspaces(): MonorepoConfig | null {
    const pnpmWorkspacePath = path.join(this.cwd, 'pnpm-workspace.yaml');

    if (!existsSync(pnpmWorkspacePath)) {
      return null;
    }

    try {
      const content = readFileSync(pnpmWorkspacePath, 'utf-8');

      // Parse YAML (simple parsing for workspaces)
      const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n)+)/);
      if (!packagesMatch) {
        return null;
      }

      const packages = packagesMatch[1]
        .split('\n')
        .map(line => line.replace(/-\s*['"]?([^'"]+)['"]?/, '$1').trim())
        .filter(p => p.length > 0);

      return {
        type: 'pnpm',
        root: this.cwd,
        packages,
        workspaceConfig: 'pnpm-workspace.yaml',
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect Turborepo
   */
  private detectTurborepo(): MonorepoConfig | null {
    const turboJsonPath = path.join(this.cwd, 'turbo.json');

    if (!existsSync(turboJsonPath)) {
      return null;
    }

    try {
      const turboJson = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));

      // Turborepo often uses npm workspaces too
      const npmWorkspaces = this.detectNpmWorkspaces();

      return {
        type: 'turborepo',
        root: this.cwd,
        packages: npmWorkspaces?.packages || ['**/*'],
        workspaceConfig: npmWorkspaces?.workspaceConfig || 'package.json',
        toolConfig: 'turbo.json',
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect Nx
   */
  private detectNx(): MonorepoConfig | null {
    const nxJsonPath = path.join(this.cwd, 'nx.json');

    if (!existsSync(nxJsonPath)) {
      return null;
    }

    try {
      const nxJson = JSON.parse(readFileSync(nxJsonPath, 'utf-8'));

      // Get projects from nx.json
      const projects = nxJson.projects || {};
      const projectNames = Object.keys(projects);

      return {
        type: 'nx',
        root: this.cwd,
        packages: projectNames,
        workspaceConfig: 'nx.json',
        toolConfig: 'nx.json',
      };
    } catch {
      return null;
    }
  }

  /**
   * Detect Lerna
   */
  private detectLerna(): MonorepoConfig | null {
    const lernaJsonPath = path.join(this.cwd, 'lerna.json');

    if (!existsSync(lernaJsonPath)) {
      return null;
    }

    try {
      const lernaJson = JSON.parse(readFileSync(lernaJsonPath, 'utf-8'));

      const packages = lernaJson.packages || [];

      return {
        type: 'lerna',
        root: this.cwd,
        packages,
        workspaceConfig: 'lerna.json',
        toolConfig: 'lerna.json',
      };
    } catch {
      return null;
    }
  }

  /**
   * Discover packages in monorepo
   */
  private discoverPackages(config: MonorepoConfig): PackageInfo[] {
    const packages: PackageInfo[] = [];

    for (const pattern of config.packages) {
      // Expand glob patterns
      const fullPattern = path.join(config.root, pattern, 'package.json');
      const packageFiles = glob.sync(fullPattern, {
        cwd: config.root,
        absolute: false,
      });

      for (const pkgFile of packageFiles) {
        const pkgDir = path.dirname(pkgFile);
        const pkgPath = path.join(config.root, pkgDir);

        try {
          const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));

          packages.push({
            name: pkgJson.name,
            path: pkgPath,
            version: pkgJson.version,
            private: pkgJson.private || false,
            scripts: pkgJson.scripts,
            dependencies: pkgJson.dependencies,
          });
        } catch {
          // Skip invalid package.json files
        }
      }
    }

    return packages;
  }

  /**
   * Get affected packages based on changed files
   */
  getAffectedPackages(
    changedFiles: string[],
    config: MonorepoConfig
  ): PackageInfo[] {
    const packages = this.discoverPackages(config);
    const affected: Set<string> = new Set();

    for (const file of changedFiles) {
      // Find which package this file belongs to
      for (const pkg of packages) {
        const relativePath = path.relative(config.root, pkg.path);

        if (file.startsWith(relativePath)) {
          affected.add(pkg.name);
          break;
        }
      }
    }

    // Get dependencies of affected packages
    const dependencies = this.getPackageDependencies(Array.from(affected), packages);

    return packages.filter(p => affected.has(p.name) || dependencies.has(p.name));
  }

  /**
   * Get package dependencies
   */
  private getPackageDependencies(packageNames: string[], allPackages: PackageInfo[]): Set<string> {
    const deps = new Set<string>();
    const visited = new Set<string>();

    function collectDeps(name: string) {
      if (visited.has(name)) return;
      visited.add(name);

      const pkg = allPackages.find(p => p.name === name);
      if (!pkg) return;

      // Add internal dependencies
      if (pkg.dependencies) {
        for (const [depName, version] of Object.entries(pkg.dependencies)) {
          const isInternal = allPackages.some(p => p.name === depName);
          if (isInternal) {
            deps.add(depName);
            collectDeps(depName);
          }
        }
      }
    }

    for (const name of packageNames) {
      collectDeps(name);
    }

    return deps;
  }

  /**
   * Format detection result as text
   */
  formatDetection(result: MonorepoDetectionResult): string {
    const lines: string[] = [];

    lines.push('Monorepo Detection Results');
    lines.push('==========================');
    lines.push('');
    lines.push(`Is Monorepo: ${result.isMonorepo ? 'Yes' : 'No'}`);
    lines.push('');

    if (result.config) {
      lines.push(`Type: ${result.config.type}`);
      lines.push(`Root: ${result.config.root}`);
      lines.push(`Packages Pattern: ${result.config.packages.join(', ')}`);
      lines.push(`Workspace Config: ${result.config.workspaceConfig}`);
      if (result.config.toolConfig) {
        lines.push(`Tool Config: ${result.config.toolConfig}`);
      }
      lines.push('');

      if (result.packages && result.packages.length > 0) {
        lines.push(`Discovered Packages (${result.packages.length}):`);
        for (const pkg of result.packages) {
          lines.push(`  - ${pkg.name} @ ${pkg.version || 'undefined'}`);
          lines.push(`    Path: ${pkg.path}`);
          if (pkg.private) {
            lines.push(`    Private: Yes`);
          }
        }
      }
    }

    return lines.join('\n');
  }
}

/**
 * Detect monorepo in current directory
 */
export function detectMonorepo(cwd?: string): MonorepoDetectionResult {
  const detector = new MonorepoDetector(cwd);
  return detector.detect();
}

/**
 * Get affected packages in monorepo
 */
export function getAffectedPackages(
  changedFiles: string[],
  cwd?: string
): PackageInfo[] {
  const detector = new MonorepoDetector(cwd);
  const result = detector.detect();

  if (!result.isMonorepo || !result.config) {
    return [];
  }

  return detector.getAffectedPackages(changedFiles, result.config);
}
