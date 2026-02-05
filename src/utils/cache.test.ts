/**
 * Tests for ResultCache
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResultCache } from './cache.js';
import { existsSync } from 'fs';
import { rm, writeFile, mkdir } from 'fs/promises';
import path from 'path';

describe('ResultCache', () => {
  let cache: ResultCache;
  const testDir = '.orchestra-test-cache';
  const testPlansDir = '.orchestra-test-plans';

  beforeEach(async () => {
    cache = new ResultCache({ directory: testDir });
    await cache.init();

    // Create test plans directory
    if (!existsSync(testPlansDir)) {
      await mkdir(testPlansDir, { recursive: true });
    }
  });

  afterEach(async () => {
    await cache.clear();
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    if (existsSync(testPlansDir)) {
      await rm(testPlansDir, { recursive: true });
    }
  });

  describe('initialization', () => {
    it('should initialize cache directory', async () => {
      expect(existsSync(testDir)).toBe(true);
    });

    it('should initialize with disabled cache', async () => {
      const disabledCache = new ResultCache({ enabled: false });
      await disabledCache.init();

      // Should not create directory when disabled
      const entry = await disabledCache.get('test task');
      expect(entry).toBeNull();
    });
  });

  describe('set and get', () => {
    it('should store and retrieve cache entries', async () => {
      const task = 'Create a login component';
      const planFile = path.join(testPlansDir, 'plan1.json');

      // Create plan file
      await writeFile(planFile, JSON.stringify({ task }), 'utf-8');

      const entry = {
        task,
        planFile,
        generatedFiles: ['login.tsx', 'auth.ts'],
        timestamp: new Date().toISOString(),
        duration: 5000,
        success: true,
      };

      await cache.set(task, entry);
      const retrieved = await cache.get(task);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.task).toBe(task);
      expect(retrieved?.success).toBe(true);
      expect(retrieved?.generatedFiles).toHaveLength(2);
    });

    it('should return null for non-existent task', async () => {
      const retrieved = await cache.get('non-existent task');
      expect(retrieved).toBeNull();
    });

    it('should handle case-insensitive task matching', async () => {
      const task = 'Create Login Component';
      const planFile = path.join(testPlansDir, 'plan2.json');

      // Create plan file
      await writeFile(planFile, JSON.stringify({ task }), 'utf-8');

      const entry = {
        task,
        planFile,
        generatedFiles: ['login.tsx'],
        timestamp: new Date().toISOString(),
        duration: 3000,
        success: true,
      };

      await cache.set(task, entry);

      // Should match with different case
      const retrieved = await cache.get('create login component');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.task).toBe(task);
    });

    it('should handle TTL expiration', async () => {
      const shortCache = new ResultCache({
        directory: testDir + '-ttl',
        maxAge: 100 // 100ms TTL
      });
      await shortCache.init();

      const task = 'temp task';
      const planFile = path.join(testPlansDir, 'plan-ttl.json');

      // Create plan file
      await writeFile(planFile, JSON.stringify({ task }), 'utf-8');

      const entry = {
        task,
        planFile,
        generatedFiles: ['temp.ts'],
        timestamp: new Date(Date.now() - 200).toISOString(), // Already expired
        duration: 1000,
        success: true,
      };

      await shortCache.set(task, entry);

      // Should be expired immediately
      const retrieved = await shortCache.get(task);
      expect(retrieved).toBeNull();

      await shortCache.clear();
      if (existsSync(testDir + '-ttl')) {
        await rm(testDir + '-ttl', { recursive: true });
      }
    });
  });

  describe('hashTask', () => {
    it('should generate consistent hashes', () => {
      const task = 'Create a button component';
      const hash1 = cache.hashTask(task);
      const hash2 = cache.hashTask(task);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hashes for different tasks', () => {
      const hash1 = cache.hashTask('Task 1');
      const hash2 = cache.hashTask('Task 2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('list', () => {
    it('should list all cache entries', async () => {
      const tasks = ['Task 1', 'Task 2', 'Task 3'];

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const planFile = path.join(testPlansDir, `plan-list-${i}.json`);
        await writeFile(planFile, JSON.stringify({ task }), 'utf-8');

        await cache.set(task, {
          task,
          planFile,
          generatedFiles: [`${task}.ts`],
          timestamp: new Date().toISOString(),
          duration: 1000,
          success: true,
        });
      }

      const entries = cache.list();
      expect(entries).toHaveLength(3);
      expect(entries[0].task).toBeDefined();
    });

    it('should return entries sorted by timestamp', async () => {
      const now = Date.now();

      const planFile1 = path.join(testPlansDir, 'plan-old.json');
      const planFile2 = path.join(testPlansDir, 'plan-new.json');

      await writeFile(planFile1, JSON.stringify({ task: 'Old Task' }), 'utf-8');
      await writeFile(planFile2, JSON.stringify({ task: 'New Task' }), 'utf-8');

      await cache.set('Old Task', {
        task: 'Old Task',
        planFile: planFile1,
        generatedFiles: [],
        timestamp: new Date(now - 10000).toISOString(),
        duration: 1000,
        success: true,
      });

      await cache.set('New Task', {
        task: 'New Task',
        planFile: planFile2,
        generatedFiles: [],
        timestamp: new Date(now).toISOString(),
        duration: 1000,
        success: true,
      });

      const entries = cache.list();
      expect(entries[0].task).toBe('New Task');
      expect(entries[1].task).toBe('Old Task');
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      const planFile = path.join(testPlansDir, 'plan-clear.json');
      await writeFile(planFile, JSON.stringify({ task: 'Task 1' }), 'utf-8');

      await cache.set('Task 1', {
        task: 'Task 1',
        planFile,
        generatedFiles: [],
        timestamp: new Date().toISOString(),
        duration: 1000,
        success: true,
      });

      await cache.clear();

      const entries = cache.list();
      expect(entries).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const planFile = path.join(testPlansDir, 'plan-stats.json');
      await writeFile(planFile, JSON.stringify({ task: 'Task 1' }), 'utf-8');

      await cache.set('Task 1', {
        task: 'Task 1',
        planFile,
        generatedFiles: [],
        timestamp: new Date().toISOString(),
        duration: 1000,
        success: true,
      });

      const stats = cache.getStats();

      expect(stats.entries).toBe(1);
      expect(stats.newestEntry).toBeDefined();
      expect(stats.oldestEntry).toBeDefined();
    });

    it('should return null timestamps for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.newestEntry).toBeNull();
      expect(stats.oldestEntry).toBeNull();
    });
  });
});
