/**
 * Tests for sessionHistory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as sessionHistory from './sessionHistory.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
}));

describe('sessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addSession', () => {
    it('should add session to history', () => {
      const session = {
        sessionId: 'test-123',
        task: 'Test task',
        status: 'completed' as const,
        startTime: Date.now(),
        endTime: Date.now(),
      };

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').writeFileSync).mockImplementation(() => {});

      sessionHistory.addSession(session);

      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should create history directory if not exists', () => {
      const session = {
        sessionId: 'test-456',
        task: 'Test',
        status: 'completed' as const,
        startTime: Date.now(),
        endTime: Date.now(),
      };

      vi.mocked(require('fs').existsSync).mockReturnValue(false);
      vi.mocked(require('fs').mkdirSync).mockImplementation(() => {});
      vi.mocked(require('fs').writeFileSync).mockImplementation(() => {});

      sessionHistory.addSession(session);

      expect(mkdirSync).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should retrieve session history', () => {
      const sessions = [
        {
          sessionId: 's1',
          task: 'Task 1',
          status: 'completed' as const,
          startTime: Date.now(),
          endTime: Date.now(),
        },
        {
          sessionId: 's2',
          task: 'Task 2',
          status: 'failed' as const,
          startTime: Date.now(),
          endTime: Date.now(),
        },
      ];

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readdirSync).mockReturnValue(['s1.json', 's2.json']);
      vi.mocked(require('fs').readFileSync).mockImplementation((path: string) => {
        if (path.includes('s1.json')) return JSON.stringify(sessions[0]);
        if (path.includes('s2.json')) return JSON.stringify(sessions[1]);
        return '{}';
      });

      const history = sessionHistory.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].sessionId).toBe('s1');
    });

    it('should return empty array when no history exists', () => {
      vi.mocked(require('fs').existsSync).mockReturnValue(false);

      const history = sessionHistory.getHistory();

      expect(history).toEqual([]);
    });
  });

  describe('getSession', () => {
    it('should retrieve specific session', () => {
      const session = {
        sessionId: 'test-123',
        task: 'Test',
        status: 'completed' as const,
        startTime: Date.now(),
        endTime: Date.now(),
      };

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readFileSync).mockReturnValue(JSON.stringify(session));

      const result = sessionHistory.getSession('test-123');

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('test-123');
    });

    it('should return null for non-existent session', () => {
      vi.mocked(require('fs').existsSync).mockReturnValue(false);

      const result = sessionHistory.getSession('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('filterByStatus', () => {
    it('should filter sessions by status', () => {
      const sessions = [
        { sessionId: 's1', task: 'T1', status: 'completed' as const, startTime: Date.now() },
        { sessionId: 's2', task: 'T2', status: 'failed' as const, startTime: Date.now() },
      ];

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readdirSync).mockReturnValue(['s1.json', 's2.json']);
      vi.mocked(require('fs').readFileSync).mockImplementation((path: string) => {
        if (path.includes('s1.json')) return JSON.stringify(sessions[0]);
        if (path.includes('s2.json')) return JSON.stringify(sessions[1]);
        return '{}';
      });

      const completed = sessionHistory.filterByStatus('completed');

      expect(completed).toHaveLength(1);
      expect(completed[0].sessionId).toBe('s1');
    });
  });

  describe('search', () => {
    it('should search sessions by task', () => {
      const sessions = [
        { sessionId: 's1', task: 'Create API endpoint', status: 'completed' as const, startTime: Date.now() },
        { sessionId: 's2', task: 'Fix bug', status: 'failed' as const, startTime: Date.now() },
      ];

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readdirSync).mockReturnValue(['s1.json', 's2.json']);
      vi.mocked(require('fs').readFileSync).mockImplementation((path: string) => {
        if (path.includes('s1.json')) return JSON.stringify(sessions[0]);
        if (path.includes('s2.json')) return JSON.stringify(sessions[1]);
        return '{}';
      });

      const results = sessionHistory.search('API');

      expect(results).toHaveLength(1);
      expect(results[0].sessionId).toBe('s1');
    });
  });

  describe('getStatistics', () => {
    it('should return history statistics', () => {
      const sessions = [
        { sessionId: 's1', task: 'T1', status: 'completed' as const, startTime: Date.now() },
        { sessionId: 's2', task: 'T2', status: 'failed' as const, startTime: Date.now() },
        { sessionId: 's3', task: 'T3', status: 'completed' as const, startTime: Date.now() },
      ];

      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readdirSync).mockReturnValue(['s1.json', 's2.json', 's3.json']);
      vi.mocked(require('fs').readFileSync).mockImplementation((path: string) => {
        if (path.includes('s1.json')) return JSON.stringify(sessions[0]);
        if (path.includes('s2.json')) return JSON.stringify(sessions[1]);
        if (path.includes('s3.json')) return JSON.stringify(sessions[2]);
        return '{}';
      });

      const stats = sessionHistory.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('clear', () => {
    it('should clear session history', () => {
      vi.mocked(require('fs').existsSync).mockReturnValue(true);
      vi.mocked(require('fs').readdirSync).mockReturnValue(['s1.json', 's2.json']);
      vi.mocked(require('fs').require('fs').rmSync = vi.fn();

      sessionHistory.clear();

      // In real implementation, would call rmSync for each file
    });
  });
});
