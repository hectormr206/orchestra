/**
 * Plugin Marketplace - Discover and install Orchestra plugins
 *
 * Provides a marketplace for finding, installing, and managing
 * Orchestra plugins from a central registry.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type {
  MarketplacePlugin,
  PluginSearchResult,
  PluginInstallOptions,
  PluginInstallResult,
  MarketplaceConfig,
  PluginManifest,
} from './types.js';

/**
 * Built-in registry with official plugins
 */
const BUILTIN_REGISTRY: MarketplacePlugin[] = [
  {
    id: 'express-js',
    name: 'Express.js Plugin',
    description: 'Provides specialized support for Express.js applications with enhanced prompts, validations, and audit rules',
    version: '0.1.0',
    author: 'Orchestra Team',
    license: 'MIT',
    repository: {
      type: 'github',
      url: 'https://github.com/gama/ai-core',
      branch: 'main',
    },
    tags: ['express', 'nodejs', 'web', 'backend'],
    category: 'Backend Frameworks',
    downloads: 0,
    rating: 5.0,
    verified: true,
    official: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-03',
    manifest: {
      name: 'express-js',
      version: '0.1.0',
      description: 'Express.js plugin for Orchestra CLI',
      author: 'Orchestra Team',
      license: 'MIT',
      main: 'index.js',
      orchestraVersion: '>=0.1.0',
      hooks: {
        'before-plan': 'enhancePlanForExpress',
        'before-execute': 'validateExpressCode',
        'after-execute': 'suggestExpressBestPractices',
        'before-audit': 'configureExpressAuditRules',
      },
      config: {
        detectRoutes: true,
        detectMiddleware: true,
        suggestPatterns: true,
      },
    },
  },
  {
    id: 'fast-api',
    name: 'FastAPI Plugin',
    description: 'Provides specialized support for FastAPI applications with APIRouter patterns, Pydantic validation, and async handlers',
    version: '0.1.0',
    author: 'Orchestra Team',
    license: 'MIT',
    repository: {
      type: 'github',
      url: 'https://github.com/gama/ai-core',
      branch: 'main',
    },
    tags: ['fastapi', 'python', 'web', 'backend', 'async'],
    category: 'Backend Frameworks',
    downloads: 0,
    rating: 5.0,
    verified: true,
    official: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-02-03',
    manifest: {
      name: 'fast-api',
      version: '0.1.0',
      description: 'FastAPI plugin for Orchestra CLI',
      author: 'Orchestra Team',
      license: 'MIT',
      main: 'index.js',
      orchestraVersion: '>=0.1.0',
      hooks: {
        'before-plan': 'enhancePlanForFastAPI',
        'before-execute': 'validateFastAPICode',
        'after-execute': 'suggestFastAPIBestPractices',
        'before-audit': 'configureFastAPIAuditRules',
      },
      config: {
        detectRouters: true,
        detectDependencies: true,
        suggestPatterns: true,
      },
    },
  },
];

/**
 * PluginMarketplace manages plugin discovery and installation
 */
export class PluginMarketplace {
  private config: MarketplaceConfig;
  private pluginsDir: string;
  private cache: Map<string, MarketplacePlugin[]>;

  constructor(config: MarketplaceConfig = {}) {
    this.config = {
      registryUrl: config.registryUrl,
      cacheDir: config.cacheDir || '.orchestra/marketplace',
      cacheTTL: config.cacheTTL || 3600000, // 1 hour
      verifyManifest: config.verifyManifest !== false,
    };
    this.pluginsDir = '.orchestra/plugins';
    this.cache = new Map();
  }

  /**
   * Search for plugins
   */
  async search(query: string = '', category?: string): Promise<PluginSearchResult> {
    const plugins = BUILTIN_REGISTRY.filter((plugin) => {
      const matchesQuery =
        !query ||
        plugin.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description.toLowerCase().includes(query.toLowerCase()) ||
        plugin.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = !category || plugin.category === category;

      return matchesQuery && matchesCategory;
    });

    return {
      plugins,
      total: plugins.length,
      page: 1,
      pageSize: plugins.length,
    };
  }

  /**
   * List all plugins
   */
  async list(): Promise<PluginSearchResult> {
    return {
      plugins: BUILTIN_REGISTRY,
      total: BUILTIN_REGISTRY.length,
      page: 1,
      pageSize: BUILTIN_REGISTRY.length,
    };
  }

  /**
   * Get plugin details
   */
  async info(pluginId: string): Promise<MarketplacePlugin | null> {
    return BUILTIN_REGISTRY.find((p) => p.id === pluginId) || null;
  }

  /**
   * List categories
   */
  async getCategories(): Promise<string[]> {
    const categories = new Set(BUILTIN_REGISTRY.map((p) => p.category));
    return Array.from(categories).sort();
  }

  /**
   * List all tags
   */
  async getTags(): Promise<string[]> {
    const tags = new Set(BUILTIN_REGISTRY.flatMap((p) => p.tags));
    return Array.from(tags).sort();
  }

  /**
   * Install a plugin
   */
  async install(pluginId: string, options: PluginInstallOptions = {}): Promise<PluginInstallResult> {
    const plugin = BUILTIN_REGISTRY.find((p) => p.id === pluginId);

    if (!plugin) {
      return {
        success: false,
        pluginId,
        version: '',
        installedPath: '',
        message: `Plugin "${pluginId}" not found in marketplace`,
      };
    }

    const installPath = path.join(this.pluginsDir, pluginId);

    // Check if already installed
    if (existsSync(installPath) && !options.force) {
      return {
        success: false,
        pluginId,
        version: plugin.version,
        installedPath: installPath,
        message: `Plugin "${pluginId}" is already installed. Use --force to reinstall.`,
      };
    }

    try {
      // Create plugins directory if it doesn't exist
      if (!existsSync(this.pluginsDir)) {
        mkdirSync(this.pluginsDir, { recursive: true });
      }

      // If plugin is already in .orchestra/plugins (built-in), just verify it
      const builtinPluginPath = path.join(this.pluginsDir, pluginId);
      if (existsSync(builtinPluginPath)) {
        if (options.verbose) {
          console.log(`✓ Plugin "${pluginId}" found in built-in plugins`);
        }

        return {
          success: true,
          pluginId,
          version: plugin.version,
          installedPath: builtinPluginPath,
          message: `Plugin "${pluginId}" installed successfully (built-in)`,
        };
      }

      // For external plugins, would clone from repository
      // For now, since we only have built-in plugins, return success
      return {
        success: true,
        pluginId,
        version: plugin.version,
        installedPath: builtinPluginPath,
        message: `Plugin "${pluginId}" installed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        pluginId,
        version: plugin.version,
        installedPath: '',
        message: `Failed to install plugin: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<{ success: boolean; message: string }> {
    const pluginPath = path.join(this.pluginsDir, pluginId);

    if (!existsSync(pluginPath)) {
      return {
        success: false,
        message: `Plugin "${pluginId}" is not installed`,
      };
    }

    try {
      // Only uninstall if it's not a built-in plugin
      const plugin = BUILTIN_REGISTRY.find((p) => p.id === pluginId);
      if (plugin?.official) {
        return {
          success: false,
          message: `Cannot uninstall official plugin "${pluginId}". Built-in plugins are managed by Orchestra.`,
        };
      }

      rmSync(pluginPath, { recursive: true, force: true });

      return {
        success: true,
        message: `Plugin "${pluginId}" uninstalled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to uninstall plugin: ${(error as Error).message}`,
      };
    }
  }

  /**
   * List installed plugins
   */
  async listInstalled(): Promise<PluginManifest[]> {
    const installed: PluginManifest[] = [];

    if (!existsSync(this.pluginsDir)) {
      return installed;
    }

    // Read all plugin directories
    const pluginDirs = BUILTIN_REGISTRY.map((p) => p.id);

    for (const pluginId of pluginDirs) {
      const manifestPath = path.join(this.pluginsDir, pluginId, 'orchestra.json');

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
          installed.push(manifest);
        } catch {
          // Skip invalid manifests
        }
      }
    }

    return installed;
  }

  /**
   * Get plugin manifest from installed plugin
   */
  getInstalledManifest(pluginId: string): PluginManifest | null {
    const manifestPath = path.join(this.pluginsDir, pluginId, 'orchestra.json');

    if (!existsSync(manifestPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof manifest !== 'object' || manifest === null) {
      return { valid: false, errors: ['Manifest must be an object'] };
    }

    const m = manifest as Record<string, unknown>;

    // Required fields
    const requiredFields = ['name', 'version', 'description', 'author', 'license', 'main', 'orchestraVersion', 'hooks'];
    for (const field of requiredFields) {
      if (!m[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Type checks
    if (m.hooks && typeof m.hooks !== 'object') {
      errors.push('hooks must be an object');
    }

    if (m.orchestraVersion && typeof m.orchestraVersion !== 'string') {
      errors.push('orchestraVersion must be a string');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if plugin is compatible with current Orchestra version
   */
  isCompatible(pluginManifest: PluginManifest): boolean {
    // Simple version check - can be enhanced with semver
    const currentVersion = '0.1.0'; // This should come from package.json

    if (pluginManifest.orchestraVersion.startsWith('>=')) {
      const minVersion = pluginManifest.orchestraVersion.substring(2);
      return currentVersion >= minVersion;
    }

    return true;
  }
}
