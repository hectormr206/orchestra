/**
 * Tests for metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector } from './metrics.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector('test-session-id', 'Test task');
  });

  describe('constructor', () => {
    it('should initialize with sessionId and task', () => {
      const metrics = collector.getMetrics();

      expect(metrics.sessionId).toBe('test-session-id');
      expect(metrics.task).toBe('Test task');
      expect(metrics.startTime).toBeInstanceOf(Date);
      expect(metrics.iterations).toBe(0);
      expect(metrics.finalStatus).toBe('cancelled');
    });

    it('should initialize agent metrics', () => {
      const metrics = collector.getMetrics();

      expect(metrics.agents).toHaveProperty('architect');
      expect(metrics.agents).toHaveProperty('executor');
      expect(metrics.agents).toHaveProperty('auditor');
      expect(metrics.agents).toHaveProperty('consultant');

      for (const agent of Object.values(metrics.agents)) {
        expect(agent.invocations).toBe(0);
        expect(agent.successes).toBe(0);
        expect(agent.failures).toBe(0);
        expect(agent.fallbacks).toBe(0);
      }
    });
  });

  describe('startAgent/endAgent', () => {
    it('should record agent execution time', () => {
      collector.startAgent('architect');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      collector.endAgent('architect', true);

      const metrics = collector.getMetrics();
      const architectMetrics = metrics.agents['architect'];

      expect(architectMetrics.invocations).toBe(1);
      expect(architectMetrics.successes).toBe(1);
      expect(architectMetrics.failures).toBe(0);
      expect(architectMetrics.totalDuration).toBeGreaterThanOrEqual(10);
      expect(architectMetrics.avgDuration).toBeGreaterThanOrEqual(10);
      expect(architectMetrics.successRate).toBe(100);
    });

    it('should handle multiple agent invocations', () => {
      collector.startAgent('executor');
      collector.endAgent('executor', true);

      collector.startAgent('executor');
      collector.endAgent('executor', true);

      collector.startAgent('executor');
      collector.endAgent('executor', false);

      const metrics = collector.getMetrics();
      const executorMetrics = metrics.agents['executor'];

      expect(executorMetrics.invocations).toBe(3);
      expect(executorMetrics.successes).toBe(2);
      expect(executorMetrics.failures).toBe(1);
      expect(executorMetrics.successRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate average duration correctly', () => {
      // First invocation
      collector.startAgent('auditor');
      collector.endAgent('auditor', true);

      // Second invocation
      collector.startAgent('auditor');
      collector.endAgent('auditor', true);

      const metrics = collector.getMetrics();
      const auditorMetrics = metrics.agents['auditor'];

      expect(auditorMetrics.invocations).toBe(2);
      expect(auditorMetrics.avgDuration).toBe(
        auditorMetrics.totalDuration / auditorMetrics.invocations
      );
    });
  });

  describe('recordFallback', () => {
    it('should record fallback count', () => {
      collector.recordFallback('architect');
      collector.recordFallback('architect');

      const metrics = collector.getMetrics();

      expect(metrics.agents['architect'].fallbacks).toBe(2);
    });

    it('should not throw for unknown agents', () => {
      expect(() => collector.recordFallback('unknown-agent')).not.toThrow();
    });
  });

  describe('recordFile', () => {
    it('should record file metrics', () => {
      collector.recordFile({
        path: '/test/file.ts',
        language: 'typescript',
        processTime: 1500,
        auditTime: 800,
        fixAttempts: 2,
        syntaxErrors: 1,
        approved: true,
      });

      const metrics = collector.getMetrics();

      expect(metrics.files).toHaveLength(1);
      expect(metrics.files[0].path).toBe('/test/file.ts');
      expect(metrics.files[0].language).toBe('typescript');
      expect(metrics.files[0].processTime).toBe(1500);
      expect(metrics.files[0].approved).toBe(true);
    });

    it('should update existing file metrics', () => {
      collector.recordFile({
        path: '/test/file.ts',
        processTime: 1000,
      });

      collector.recordFile({
        path: '/test/file.ts',
        auditTime: 500,
        approved: true,
      });

      const metrics = collector.getMetrics();

      expect(metrics.files).toHaveLength(1);
      expect(metrics.files[0].processTime).toBe(1000);
      expect(metrics.files[0].auditTime).toBe(500);
      expect(metrics.files[0].approved).toBe(true);
    });

    it('should handle multiple files', () => {
      collector.recordFile({ path: '/test/file1.ts' });
      collector.recordFile({ path: '/test/file2.ts' });
      collector.recordFile({ path: '/test/file3.ts' });

      const metrics = collector.getMetrics();

      expect(metrics.files).toHaveLength(3);
    });
  });

  describe('recordIteration', () => {
    it('should increment iteration count', () => {
      collector.recordIteration();
      collector.recordIteration();
      collector.recordIteration();

      const metrics = collector.getMetrics();

      expect(metrics.iterations).toBe(3);
    });
  });

  describe('recordTests', () => {
    it('should record test results', () => {
      collector.recordTests(15, 2);

      const metrics = collector.getMetrics();

      expect(metrics.testsRun).toBe(true);
      expect(metrics.testsPassed).toBe(15);
      expect(metrics.testsFailed).toBe(2);
    });
  });

  describe('recordCommit', () => {
    it('should record commit information', () => {
      collector.recordCommit('abc123def456');

      const metrics = collector.getMetrics();

      expect(metrics.committed).toBe(true);
      expect(metrics.commitHash).toBe('abc123def456');
    });
  });

  describe('finish', () => {
    it('should finalize metrics with completed status', () => {
      const finalMetrics = collector.finish('completed');

      expect(finalMetrics.finalStatus).toBe('completed');
      expect(finalMetrics.endTime).toBeInstanceOf(Date);
      expect(finalMetrics.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total duration correctly', () => {
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Wait 50ms
      }

      const finalMetrics = collector.finish('completed');

      expect(finalMetrics.totalDuration).toBeGreaterThanOrEqual(50);
    });

    it('should support different status values', () => {
      const collector1 = new MetricsCollector('s1', 'task1');
      const metrics1 = collector1.finish('completed');
      expect(metrics1.finalStatus).toBe('completed');

      const collector2 = new MetricsCollector('s2', 'task2');
      const metrics2 = collector2.finish('failed');
      expect(metrics2.finalStatus).toBe('failed');

      const collector3 = new MetricsCollector('s3', 'task3');
      const metrics3 = collector3.finish('cancelled');
      expect(metrics3.finalStatus).toBe('cancelled');
    });
  });

  describe('getMetrics', () => {
    it('should return a copy of metrics', () => {
      collector.recordIteration();

      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();

      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2); // Different objects
    });
  });

  describe('integration', () => {
    it('should track a complete orchestration session', () => {
      // Start architect
      collector.startAgent('architect');
      collector.endAgent('architect', true);

      // Record iteration
      collector.recordIteration();

      // Start executor
      collector.startAgent('executor');
      collector.recordFile({
        path: '/src/file1.ts',
        language: 'typescript',
        processTime: 2000,
      });
      collector.endAgent('executor', true);

      // Start auditor
      collector.startAgent('auditor');
      collector.recordFile({
        path: '/src/file1.ts',
        auditTime: 1000,
        fixAttempts: 1,
        approved: true,
      });
      collector.endAgent('auditor', true);

      // Record tests
      collector.recordTests(10, 0);

      // Record commit
      collector.recordCommit('abc123');

      // Finish
      const finalMetrics = collector.finish('completed');

      // Verify
      expect(finalMetrics.iterations).toBe(1);
      expect(finalMetrics.agents['architect'].invocations).toBe(1);
      expect(finalMetrics.agents['executor'].invocations).toBe(1);
      expect(finalMetrics.agents['auditor'].invocations).toBe(1);
      expect(finalMetrics.files).toHaveLength(1);
      expect(finalMetrics.files[0].approved).toBe(true);
      expect(finalMetrics.testsRun).toBe(true);
      expect(finalMetrics.committed).toBe(true);
      expect(finalMetrics.finalStatus).toBe('completed');
    });
  });
});
