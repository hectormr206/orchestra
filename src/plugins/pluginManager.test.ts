/**
 * Tests for Plugin Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginManager, type PluginManifest } from './PluginManager';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager('/tmp/test-plugins');
  });

  describe('validateManifest', () => {
    it('should validate correct manifest', () => {
      const manifest: PluginManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js',
        hooks: {
          'before-execute': 'beforeExecute',
        },
      };

      // Access private method through the instance
      const validation = manager['validateManifest'](manifest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject manifest without name', () => {
      const manifest: PluginManifest = {
        name: '',
        version: '1.0.0',
        description: 'Test',
        main: 'index.js',
        hooks: {},
      };

      const validation = manager['validateManifest'](manifest);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('name is required');
    });

    it('should reject manifest without hooks', () => {
      const manifest: PluginManifest = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        main: 'index.js',
        hooks: {},
      };

      const validation = manager['validateManifest'](manifest);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('at least one hook is required');
    });
  });

  describe('checkDependencies', () => {
    it('should detect missing dependencies', () => {
      const dependencies = ['plugin-a', 'plugin-b'];

      const result = manager['checkDependencies'](dependencies);

      expect(result.satisfied).toBe(false);
      expect(result.missing).toContain('plugin-a');
      expect(result.missing).toContain('plugin-b');
    });

    it('should pass when all dependencies loaded', () => {
      // Mock plugins map
      manager['plugins'].set('plugin-a', {
        manifest: {} as PluginManifest,
        module: {},
        enabled: true,
        loaded: true,
      });
      manager['plugins'].set('plugin-b', {
        manifest: {} as PluginManifest,
        module: {},
        enabled: true,
        loaded: true,
      });

      const dependencies = ['plugin-a', 'plugin-b'];
      const result = manager['checkDependencies'](dependencies);

      expect(result.satisfied).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('hook execution', () => {
    it('should execute hooks in order', async () => {
      const executionOrder: string[] = [];

      manager.registerHook('before-execute', async () => {
        executionOrder.push('first');
        return { success: true };
      });

      manager.registerHook('before-execute', async () => {
        executionOrder.push('second');
        return { success: true };
      });

      const context = {
        sessionId: 'test',
        task: 'Test',
        phase: 'test',
        config: {},
        metadata: {},
      };

      await manager.executeHook('before-execute', context);

      expect(executionOrder).toEqual(['first', 'second']);
    });

    it('should stop propagation when requested', async () => {
      manager.registerHook('before-execute', async () => {
        return { success: true, stopPropagation: true };
      });

      manager.registerHook('before-execute', async () => {
        return { success: true };
      });

      const context = {
        sessionId: 'test',
        task: 'Test',
        phase: 'test',
        config: {},
        metadata: {},
      };

      const results = await manager.executeHook('before-execute', context);

      expect(results).toHaveLength(1); // Only first hook executed
    });

    it('should handle hook errors gracefully', async () => {
      manager.registerHook('before-execute', async () => {
        throw new Error('Hook failed');
      });

      const context = {
        sessionId: 'test',
        task: 'Test',
        phase: 'test',
        config: {},
        metadata: {},
      };

      const results = await manager.executeHook('before-execute', context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Hook failed');
    });
  });

  describe('plugin statistics', () => {
    it('should return correct statistics', () => {
      // Add mock plugin
      manager['plugins'].set('test-plugin', {
        manifest: {} as PluginManifest,
        module: {},
        enabled: true,
        loaded: true,
      });

      // Add mock hook
      manager.registerHook('before-test', async () => ({ success: true }));

      const stats = manager.getStats();

      expect(stats.total).toBe(1);
      expect(stats.enabled).toBe(1);
      expect(stats.loaded).toBe(1);
      expect(stats.hooks).toBe(1);
    });

    it('should count only enabled plugins', () => {
      manager['plugins'].set('plugin-1', {
        manifest: {} as PluginManifest,
        module: {},
        enabled: true,
        loaded: true,
      });

      manager['plugins'].set('plugin-2', {
        manifest: {} as PluginManifest,
        module: {},
        enabled: false,
        loaded: true,
      });

      const stats = manager.getStats();

      expect(stats.total).toBe(2);
      expect(stats.enabled).toBe(1);
    });
  });
});
