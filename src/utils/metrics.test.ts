/**
 * Tests for metrics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetricsCollector } from './metrics.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  afterEach(() => {
    collector.reset();
  });

  describe('recordOperation', () => {
    it('should record operation duration', () => {
      const duration = 1500;

      collector.recordOperation('test-operation', duration);

      const stats = collector.getOperationStats('test-operation');

      expect(stats.count).toBe(1);
      expect(stats.totalDuration).toBe(duration);
      expect(stats.averageDuration).toBe(duration);
    });

    it('should track multiple operations', () => {
      collector.recordOperation('op1', 1000);
      collector.recordOperation('op1', 2000);
      collector.recordOperation('op1', 3000);

      const stats = collector.getOperationStats('op1');

      expect(stats.count).toBe(3);
      expect(stats.averageDuration).toBe(2000);
      expect(stats.minDuration).toBe(1000);
      expect(stats.maxDuration).toBe(3000);
    });
  });

  describe('startOperation/endOperation', () => {
    it('should measure operation duration automatically', () => {
      collector.startOperation('timed-op');

      // Simulate operation
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }

      collector.endOperation('timed-op');

      const stats = collector.getOperationStats('timed-op');

      expect(stats.count).toBe(1);
      expect(stats.totalDuration).toBeGreaterThanOrEqual(50);
    });

    it('should handle end without start', () => {
      expect(() => collector.endOperation('non-existent')).not.toThrow();
    });
  });

  describe('recordError', () => {
    it('should record operation errors', () => {
      collector.recordError('failing-op', new Error('Test error'));

      const stats = collector.getOperationStats('failing-op');

      expect(stats.errorCount).toBe(1);
    });

    it('should track success rate', () => {
      collector.recordOperation('mixed-op', 1000);
      collector.recordOperation('mixed-op', 1500);
      collector.recordError('mixed-op', new Error('Error'));

      const stats = collector.getOperationStats('mixed-op');

      expect(stats.count).toBe(3);
      expect(stats.errorCount).toBe(1);
      expect(stats.successRate).toBeCloseTo(0.67, 2);
    });
  });

  describe('getAllStats', () => {
    it('should return statistics for all operations', () => {
      collector.recordOperation('op1', 1000);
      collector.recordOperation('op2', 2000);

      const allStats = collector.getAllStats();

      expect(allStats).toHaveProperty('op1');
      expect(allStats).toHaveProperty('op2');
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      collector.recordOperation('op1', 1000);

      collector.reset();

      const allStats = collector.getAllStats();

      expect(Object.keys(allStats)).toHaveLength(0);
    });
  });

  describe('getSummary', () => {
    it('should return summary of all metrics', () => {
      collector.recordOperation('op1', 1000);
      collector.recordOperation('op2', 2000);
      collector.recordError('op1', new Error('Error'));

      const summary = collector.getSummary();

      expect(summary.totalOperations).toBe(3);
      expect(summary.totalErrors).toBe(1);
      expect(summary.totalDuration).toBe(3000);
    });
  });

  describe('recordMemory', () => {
    it('should record memory usage', () => {
      collector.recordMemory({
        used: 1000000,
        total: 8000000000,
      });

      const memoryStats = collector.getMemoryStats();

      expect(memoryStats).toBeDefined();
      expect(memoryStats.length).toBeGreaterThan(0);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics as JSON', () => {
      collector.recordOperation('export-test', 500);

      const exported = collector.exportMetrics();

      expect(exported).toHaveProperty('operations');
      expect(exported.operations['export-test']).toBeDefined();
    });
  });
});
