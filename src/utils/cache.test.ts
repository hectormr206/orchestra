/**
 * Tests for cache
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResultCache } from './cache.js';

describe('ResultCache', () => {
  let cache: ResultCache;

  beforeEach(() => {
    cache = new ResultCache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { result: 'success' };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should handle TTL expiration', async () => {
      cache = new ResultCache(100); // 100ms TTL

      const key = 'temp-key';
      cache.set(key, { value: 'test' });

      // Should exist immediately
      expect(cache.get(key)).toBeDefined();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get(key)).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      const key = 'exists-key';
      cache.set(key, { data: 'test' });

      expect(cache.has(key)).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      const key = 'delete-key';
      cache.set(key, { value: 'test' });

      cache.delete(key);
      expect(cache.has(key)).toBe(false);
    });

    it('should handle deleting non-existent key', () => {
      expect(() => cache.delete('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', { value: '1' });
      cache.set('key2', { value: '2' });

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return cache size', () => {
      cache.set('key1', { value: '1' });
      cache.set('key2', { value: '2' });
      cache.set('key3', { value: '3' });

      expect(cache.size).toBe(3);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      cache.set('key1', { value: '1' });
      cache.set('key2', { value: '2' });

      const keys = cache.keys();

      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', { value: '1' });
      cache.get('key1'); // hit
      cache.get('non-existent'); // miss

      const stats = cache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });
});
