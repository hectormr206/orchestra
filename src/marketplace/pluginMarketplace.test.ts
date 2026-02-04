/**
 * Tests for PluginMarketplace
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginMarketplace } from './PluginMarketplace.js';
import type { PluginInstallOptions } from './types.js';

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
}));

describe('PluginMarketplace', () => {
  let marketplace: PluginMarketplace;

  beforeEach(() => {
    marketplace = new PluginMarketplace();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create marketplace with default options', () => {
      const defaultMarketplace = new PluginMarketplace();
      expect(defaultMarketplace).toBeDefined();
    });

    it('should create marketplace with custom options', () => {
      const customMarketplace = new PluginMarketplace({
        cacheDir: '.cache',
        cacheTTL: 7200000,
        verifyManifest: false,
      });
      expect(customMarketplace).toBeDefined();
    });
  });

  describe('search', () => {
    it('should return all plugins when no query provided', async () => {
      const result = await marketplace.search();
      expect(result.plugins.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should search by name', async () => {
      const result = await marketplace.search('express');
      expect(result.plugins.length).toBeGreaterThan(0);
      expect(result.plugins[0].id).toBe('express-js');
    });

    it('should search by description', async () => {
      const result = await marketplace.search('FastAPI');
      expect(result.plugins.length).toBeGreaterThan(0);
      expect(result.plugins[0].id).toBe('fast-api');
    });

    it('should search by tag', async () => {
      const result = await marketplace.search('python');
      expect(result.plugins.length).toBeGreaterThan(0);
      expect(result.plugins[0].tags).toContain('python');
    });

    it('should filter by category', async () => {
      const result = await marketplace.search('', 'Backend Frameworks');
      expect(result.plugins.length).toBe(2);
    });

    it('should return empty result for non-matching query', async () => {
      const result = await marketplace.search('nonexistent-plugin');
      expect(result.plugins).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('list', () => {
    it('should list all plugins', async () => {
      const result = await marketplace.list();
      expect(result.plugins.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  describe('info', () => {
    it('should get plugin details by id', async () => {
      const plugin = await marketplace.info('express-js');
      expect(plugin).not.toBeNull();
      expect(plugin?.id).toBe('express-js');
      expect(plugin?.name).toBe('Express.js Plugin');
    });

    it('should return null for non-existent plugin', async () => {
      const plugin = await marketplace.info('nonexistent');
      expect(plugin).toBeNull();
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const categories = await marketplace.getCategories();
      expect(categories).toContain('Backend Frameworks');
    });
  });

  describe('getTags', () => {
    it('should return list of all tags', async () => {
      const tags = await marketplace.getTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('express');
      expect(tags).toContain('python');
    });
  });

  describe('install', () => {
    it('should install plugin successfully', async () => {
      const { existsSync, mkdirSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await marketplace.install('express-js');
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('express-js');
      expect(result.message).toContain('installed successfully');
    });

    it('should fail when plugin not found', async () => {
      const result = await marketplace.install('nonexistent-plugin');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should force reinstall when option provided', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(true);

      const options: PluginInstallOptions = { force: true };
      const result = await marketplace.install('express-js', options);
      expect(result.success).toBe(true);
    });
  });

  describe('uninstall', () => {
    it('should fail to uninstall official plugin', async () => {
      const result = await marketplace.uninstall('express-js');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot uninstall official plugin');
    });

    it('should fail when plugin not installed', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await marketplace.uninstall('express-js');
      expect(result.success).toBe(false);
      expect(result.message).toContain('is not installed');
    });
  });

  describe('listInstalled', () => {
    it('should return empty array when no plugins directory', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const installed = await marketplace.listInstalled();
      expect(installed).toEqual([]);
    });
  });

  describe('getInstalledManifest', () => {
    it('should return null when plugin not installed', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(false);

      const manifest = marketplace.getInstalledManifest('express-js');
      expect(manifest).toBeNull();
    });
  });

  describe('validateManifest', () => {
    it('should validate correct manifest', () => {
      const manifest = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test Author',
        license: 'MIT',
        main: 'index.js',
        orchestraVersion: '>=0.1.0',
        hooks: { 'before-plan': 'testHook' },
      };

      const result = marketplace.validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest with missing fields', () => {
      const manifest = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      const result = marketplace.validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object manifest', () => {
      const result = marketplace.validateManifest('not-an-object');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must be an object');
    });

    it('should validate hook types', () => {
      const manifest = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test Author',
        license: 'MIT',
        main: 'index.js',
        orchestraVersion: '>=0.1.0',
        hooks: 'not-an-object',
      };

      const result = marketplace.validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('hooks must be an object');
    });
  });

  describe('isCompatible', () => {
    it('should check compatibility with >= version', () => {
      const manifest = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        orchestraVersion: '>=0.1.0',
        hooks: {},
      };

      const result = marketplace.isCompatible(manifest);
      expect(result).toBe(true);
    });

    it('should be compatible with any version format', () => {
      const manifest = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        main: 'index.js',
        orchestraVersion: '0.1.0',
        hooks: {},
      };

      const result = marketplace.isCompatible(manifest);
      expect(result).toBe(true);
    });
  });
});
