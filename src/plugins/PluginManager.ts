/**
 * Plugin System - Extensible architecture for Orchestra
 *
 * Provides:
 * - Plugin lifecycle management
 * - Hook system for extending functionality
 * - Plugin configuration
 * - Hot-reload support
 * - Plugin dependency resolution
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

export type PluginHook =
  | 'before-init'
  | 'after-init'
  | 'before-plan'
  | 'after-plan'
  | 'before-execute'
  | 'after-execute'
  | 'before-audit'
  | 'after-audit'
  | 'before-recovery'
  | 'after-recovery'
  | 'before-test'
  | 'after-test'
  | 'before-commit'
  | 'after-commit'
  | 'on-complete'
  | 'on-error'
  | 'on-file-change';

export interface PluginContext {
  sessionId: string;
  task: string;
  phase: string;
  config: any;
  metadata: Record<string, any>;
}

export interface HookResult {
  success: boolean;
  data?: any;
  error?: string;
  stopPropagation?: boolean; // If true, don't call subsequent plugins
}

export type HookFunction = (context: PluginContext) => HookResult | Promise<HookResult>;

export interface PluginHooks {
  [key: string]: HookFunction[];
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  main: string;
  hooks: Record<string, string>; // hook name -> function name in main
  dependencies?: string[];
  orchestraVersion?: string; // Minimum version required
  config?: any;
}

export interface Plugin {
  manifest: PluginManifest;
  module: any;
  enabled: boolean;
  loaded: boolean;
  loadTime?: number;
}

/**
 * Plugin Manager
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: PluginHooks = {};
  private pluginDir: string;
  private hooksCache: Map<string, string[]> = new Map(); // hook -> plugin names

  constructor(pluginDir: string = '.orchestra/plugins') {
    this.pluginDir = pluginDir;
  }

  /**
   * Load plugin from directory
   */
  async loadPlugin(pluginPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const manifestPath = path.join(pluginPath, 'orchestra.json');
      const pluginId = path.basename(pluginPath);

      // Check if already loaded
      if (this.plugins.has(pluginId)) {
        return {
          success: false,
          error: `Plugin ${pluginId} is already loaded`,
        };
      }

      // Read manifest
      if (!existsSync(manifestPath)) {
        return {
          success: false,
          error: 'Plugin manifest (orchestra.json) not found',
        };
      }

      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Validate manifest
      const validation = this.validateManifest(manifest);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid manifest: ${validation.errors.join(', ')}`,
        };
      }

      // Check dependencies
      if (manifest.dependencies) {
        const depCheck = this.checkDependencies(manifest.dependencies);
        if (!depCheck.satisfied) {
          return {
            success: false,
            error: `Missing dependencies: ${depCheck.missing.join(', ')}`,
          };
        }
      }

      // Load plugin module
      const mainPath = path.join(pluginPath, manifest.main);
      const pluginModule = await import(mainPath);

      // Register hooks
      for (const [hookName, funcName] of Object.entries(manifest.hooks)) {
        if (typeof pluginModule[funcName] === 'function') {
          this.registerHook(hookName as PluginHook, pluginModule[funcName].bind(pluginModule));

          // Cache hook -> plugin mapping
          if (!this.hooksCache.has(hookName)) {
            this.hooksCache.set(hookName, []);
          }
          this.hooksCache.get(hookName)!.push(pluginId);
        }
      }

      // Store plugin
      this.plugins.set(pluginId, {
        manifest,
        module: pluginModule,
        enabled: true,
        loaded: true,
        loadTime: Date.now(),
      });

      // Call plugin's init if exists
      if (typeof pluginModule.init === 'function') {
        await pluginModule.init();
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Unload plugin
   */
  async unloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return {
        success: false,
        error: `Plugin ${pluginId} not found`,
      };
    }

    // Call plugin's destroy if exists
    if (typeof plugin.module.destroy === 'function') {
      try {
        await plugin.module.destroy();
      } catch (error) {
        // Continue with unload even if destroy fails
      }
    }

    // Unregister hooks
    for (const [hookName, funcName] of Object.entries(plugin.manifest.hooks)) {
      this.unregisterHook(hookName as PluginHook, plugin.module[funcName].bind(plugin.module));

      // Remove from cache
      const cached = this.hooksCache.get(hookName);
      if (cached) {
        const index = cached.indexOf(pluginId);
        if (index >= 0) {
          cached.splice(index, 1);
        }
      }
    }

    // Remove plugin
    this.plugins.delete(pluginId);

    return { success: true };
  }

  /**
   * Enable/disable plugin
   */
  setPluginEnabled(pluginId: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return false;
    }

    plugin.enabled = enabled;
    return true;
  }

  /**
   * Register hook
   */
  registerHook(hookName: PluginHook, func: HookFunction): void {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    this.hooks[hookName].push(func);
  }

  /**
   * Unregister hook
   */
  unregisterHook(hookName: PluginHook, func: HookFunction): void {
    if (!this.hooks[hookName]) {
      return;
    }

    const index = this.hooks[hookName].indexOf(func);
    if (index >= 0) {
      this.hooks[hookName].splice(index, 1);
    }
  }

  /**
   * Execute hook
   */
  async executeHook(hookName: PluginHook, context: PluginContext): Promise<HookResult[]> {
    const hooks = this.hooks[hookName];
    if (!hooks || hooks.length === 0) {
      return [];
    }

    const results: HookResult[] = [];

    for (const hook of hooks) {
      try {
        const result = await hook(context);
        results.push(result);

        // Check if plugin wants to stop propagation
        if (result.stopPropagation) {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Get all plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get plugins that registered a specific hook
   */
  getPluginsForHook(hookName: PluginHook): string[] {
    return this.hooksCache.get(hookName) || [];
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name) {
      errors.push('name is required');
    }

    if (!manifest.version) {
      errors.push('version is required');
    }

    if (!manifest.description) {
      errors.push('description is required');
    }

    if (!manifest.main) {
      errors.push('main is required');
    }

    if (!manifest.hooks || Object.keys(manifest.hooks).length === 0) {
      errors.push('at least one hook is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check plugin dependencies
   */
  private checkDependencies(dependencies: string[]): {
    satisfied: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        missing.push(dep);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Reload all plugins
   */
  async reloadAll(): Promise<{ loaded: number; failed: number }> {
    const pluginIds = Array.from(this.plugins.keys());

    // Unload all
    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId);
    }

    // Clear state
    this.plugins.clear();
    this.hooks = {};
    this.hooksCache.clear();

    // Load again (would need to scan plugin directory)
    return { loaded: 0, failed: 0 };
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    loaded: number;
    hooks: number;
  } {
    const plugins = Array.from(this.plugins.values());

    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.enabled).length,
      loaded: plugins.filter(p => p.loaded).length,
      hooks: Object.keys(this.hooks).length,
    };
  }
}

/**
 * Create plugin manager
 */
let pluginManagerInstance: PluginManager | null = null;

export function getPluginManager(pluginDir?: string): PluginManager {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new PluginManager(pluginDir);
  }
  return pluginManagerInstance;
}

/**
 * Create a plugin manifest
 */
export function createPluginManifest(manifest: PluginManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Example plugin template
 */
export const PLUGIN_TEMPLATE: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My awesome Orchestra plugin',
  author: 'Your Name',
  license: 'MIT',
  main: 'index.js',
  orchestraVersion: '>=0.1.0',
  hooks: {
    'before-execute': 'beforeExecute',
    'after-execute': 'afterExecute',
  },
  config: {
    // Plugin-specific configuration
  },
};

/**
 * Example plugin module template
 */
export const PLUGIN_MODULE_TEMPLATE = `
/**
 * My Orchestra Plugin
 */

// Export hooks
export async function beforeExecute(context) {
  console.log('Before execute:', context.task);

  // Return result
  return {
    success: true,
    data: { /* optional data */ },
  };
}

export async function afterExecute(context) {
  console.log('After execute:', context.task);

  return {
    success: true,
  };
}

// Optional lifecycle hooks
export async function init() {
  console.log('Plugin initialized');
}

export async function destroy() {
  console.log('Plugin destroyed');
}
`;
