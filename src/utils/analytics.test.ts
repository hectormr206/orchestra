/**
 * Tests for Analytics Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from './analytics.js';
import type { SessionData } from './sessionExport.js';

describe('AnalyticsEngine', () => {
  let mockSessions: SessionData[];

  beforeEach(() => {
    // Create mock sessions for testing
    mockSessions = [
      {
        id: 'sess_1',
        task: 'Task 1',
        startTime: '2026-01-01T10:00:00Z',
        endTime: '2026-01-01T10:05:00Z',
        status: 'completed',
        plan: 'Plan 1',
        files: [
          { path: 'file1.ts', description: 'Test', status: 'created' },
          { path: 'file2.ts', description: 'Test', status: 'created' }
        ],
        iterations: [
          {
            number: 1,
            agent: 'architect',
            adapter: 'kimi',
            startTime: '2026-01-01T10:00:00Z',
            endTime: '2026-01-01T10:02:00Z',
            success: true
          },
          {
            number: 2,
            agent: 'executor',
            adapter: 'glm',
            startTime: '2026-01-01T10:02:00Z',
            endTime: '2026-01-01T10:05:00Z',
            success: true
          }
        ],
        metrics: {
          totalDuration: 300000, // 5 min
          architectDuration: 120000,
          executorDuration: 180000,
          auditorDuration: 0,
          filesCreated: 2,
          filesFailed: 0,
          iterations: 2,
          fallbacks: 0
        }
      },
      {
        id: 'sess_2',
        task: 'Task 2',
        startTime: '2026-01-08T14:00:00Z',
        endTime: '2026-01-08T14:10:00Z',
        status: 'failed',
        plan: 'Plan 2',
        files: [
          { path: 'file3.ts', description: 'Test', status: 'failed' }
        ],
        iterations: [
          {
            number: 1,
            agent: 'architect',
            adapter: 'kimi',
            startTime: '2026-01-08T14:00:00Z',
            endTime: '2026-01-08T14:05:00Z',
            success: true
          },
          {
            number: 2,
            agent: 'executor',
            adapter: 'glm',
            startTime: '2026-01-08T14:05:00Z',
            endTime: '2026-01-08T14:10:00Z',
            success: false,
            error: 'Compilation error: missing semicolon'
          }
        ],
        metrics: {
          totalDuration: 600000, // 10 min
          architectDuration: 300000,
          executorDuration: 300000,
          auditorDuration: 0,
          filesCreated: 0,
          filesFailed: 1,
          iterations: 2,
          fallbacks: 0
        }
      },
      {
        id: 'sess_3',
        task: 'Task 3',
        startTime: '2026-01-15T09:00:00Z',
        endTime: '2026-01-15T09:03:00Z',
        status: 'completed',
        plan: 'Plan 3',
        files: [
          { path: 'file4.ts', description: 'Test', status: 'created' }
        ],
        iterations: [
          {
            number: 1,
            agent: 'architect',
            adapter: 'kimi',
            startTime: '2026-01-15T09:00:00Z',
            endTime: '2026-01-15T09:01:00Z',
            success: true
          },
          {
            number: 2,
            agent: 'executor',
            adapter: 'glm',
            startTime: '2026-01-15T09:01:00Z',
            endTime: '2026-01-15T09:03:00Z',
            success: true
          }
        ],
        metrics: {
          totalDuration: 180000, // 3 min
          architectDuration: 60000,
          executorDuration: 120000,
          auditorDuration: 0,
          filesCreated: 1,
          filesFailed: 0,
          iterations: 2,
          fallbacks: 0
        }
      }
    ];
  });

  describe('calculateTrends', () => {
    it('should calculate daily trends correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('day');

      expect(trends).toHaveLength(3);
      expect(trends[0].period).toBe('2026-01-01');
      expect(trends[0].total).toBe(1);
      expect(trends[0].completed).toBe(1);
      expect(trends[0].failed).toBe(0);
      expect(trends[0].successRate).toBe(1.0);
    });

    it('should calculate weekly trends correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('week');

      expect(trends).toHaveLength(2);
      expect(trends[0].period).toBe('2026-W01');
      expect(trends[0].total).toBe(1);
      expect(trends[1].period).toBe('2026-W02');
      expect(trends[1].total).toBe(1);
      expect(trends[2].period).toBe('2026-W03');
      expect(trends[2].total).toBe(1);
    });

    it('should calculate monthly trends correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('month');

      expect(trends).toHaveLength(1);
      expect(trends[0].period).toBe('2026-01');
      expect(trends[0].total).toBe(3);
      expect(trends[0].completed).toBe(2);
      expect(trends[0].failed).toBe(1);
    });

    it('should calculate success rate correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('month');

      expect(trends[0].successRate).toBeCloseTo(2 / 3);
    });

    it('should calculate average duration correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('month');

      const expectedAvg = (300000 + 600000 + 180000) / 3;
      expect(trends[0].avgDuration).toBeCloseTo(expectedAvg);
    });

    it('should handle empty sessions array', () => {
      const engine = new AnalyticsEngine([]);
      const trends = engine.calculateTrends('day');

      expect(trends).toHaveLength(0);
    });

    it('should sort trends chronologically', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const trends = engine.calculateTrends('day');

      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].period >= trends[i - 1].period).toBe(true);
      }
    });
  });

  describe('getAgentPerformance', () => {
    it('should calculate agent statistics correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const stats = engine.getAgentPerformance();

      expect(stats.length).toBeGreaterThan(0);

      const architectStats = stats.find(s => s.agentRole === 'architect');
      expect(architectStats).toBeDefined();
      expect(architectStats!.totalAttempts).toBe(3);
      expect(architectStats!.successfulAttempts).toBe(3);
    });

    it('should calculate success rate correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const stats = engine.getAgentPerformance();

      const executorStats = stats.find(s => s.agentRole === 'executor');
      expect(executorStats).toBeDefined();
      expect(executorStats!.totalAttempts).toBe(3);
      expect(executorStats!.successfulAttempts).toBe(2);
      expect(executorStats!.failedAttempts).toBe(1);
      expect(executorStats!.successRate).toBeCloseTo(2 / 3);
    });

    it('should calculate average latency correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const stats = engine.getAgentPerformance();

      const architectStats = stats.find(s => s.agentRole === 'architect');
      expect(architectStats).toBeDefined();
      expect(architectStats!.avgLatencyMs).toBeGreaterThan(0);
    });

    it('should handle sessions without iterations', () => {
      const sessionsWithoutIterations: SessionData[] = [
        {
          id: 'sess_empty',
          task: 'Empty',
          startTime: '2026-01-01T10:00:00Z',
          status: 'completed',
          files: [],
          iterations: [],
          plan: ''
        }
      ];

      const engine = new AnalyticsEngine(sessionsWithoutIterations);
      const stats = engine.getAgentPerformance();

      expect(stats).toHaveLength(0);
    });

    it('should aggregate stats across multiple sessions', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const stats = engine.getAgentPerformance();

      const totalAttempts = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
      expect(totalAttempts).toBe(6); // 3 sessions * 2 iterations each
    });
  });

  describe('getTopErrors', () => {
    it('should extract and group errors correctly', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const errors = engine.getTopErrors(10);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].errorMessage).toContain('Compilation error');
      expect(errors[0].count).toBe(1);
    });

    it('should limit results to specified count', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const errors = engine.getTopErrors(1);

      expect(errors).toHaveLength(1);
    });

    it('should sort errors by frequency', () => {
      const sessionsWithErrors: SessionData[] = [
        ...mockSessions,
        {
          id: 'sess_4',
          task: 'Task 4',
          startTime: '2026-01-20T10:00:00Z',
          status: 'failed',
          files: [],
          iterations: [
            {
              number: 1,
              agent: 'executor',
              adapter: 'glm',
              startTime: '2026-01-20T10:00:00Z',
              endTime: '2026-01-20T10:05:00Z',
              success: false,
              error: 'Compilation error: missing semicolon'
            }
          ],
          plan: ''
        }
      ];

      const engine = new AnalyticsEngine(sessionsWithErrors);
      const errors = engine.getTopErrors(10);

      // El error más frecuente debe estar primero
      for (let i = 1; i < errors.length; i++) {
        expect(errors[i].count <= errors[i - 1].count).toBe(true);
      }
    });

    it('should track affected sessions', () => {
      const engine = new AnalyticsEngine(mockSessions);
      const errors = engine.getTopErrors(10);

      if (errors.length > 0) {
        expect(errors[0].affectedSessions).toContain('sess_2');
        expect(errors[0].affectedSessions).toHaveLength(1);
      }
    });

    it('should handle sessions without errors', () => {
      const successfulSessions = mockSessions.filter(s => s.status === 'completed');
      const engine = new AnalyticsEngine(successfulSessions);
      const errors = engine.getTopErrors(10);

      expect(errors).toHaveLength(0);
    });

    it('should truncate long error messages', () => {
      const longErrorSession: SessionData = {
        id: 'sess_long',
        task: 'Long error',
        startTime: '2026-01-01T10:00:00Z',
        status: 'failed',
        files: [],
        iterations: [
          {
            number: 1,
            agent: 'executor',
            adapter: 'glm',
            startTime: '2026-01-01T10:00:00Z',
            endTime: '2026-01-01T10:05:00Z',
            success: false,
            error: 'A'.repeat(200) // Error de 200 caracteres
          }
        ],
        plan: ''
      };

      const engine = new AnalyticsEngine([longErrorSession]);
      const errors = engine.getTopErrors(10);

      expect(errors[0].errorMessage.length).toBeLessThanOrEqual(100);
    });
  });
});
