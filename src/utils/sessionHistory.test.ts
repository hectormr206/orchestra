/**
 * Tests for SessionHistory
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionHistory } from './sessionHistory.js';
import { readFile, writeFile, readdir, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  unlink: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('SessionHistory', () => {
  let history: SessionHistory;

  beforeEach(() => {
    history = new SessionHistory({ directory: '.orchestra-test/sessions' });
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize session history', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await history.init();

      expect(mkdir).toHaveBeenCalled();
    });

    it('should load existing sessions from index', async () => {
      const existingSessions = [
        {
          id: 'sess-1',
          task: 'Test task 1',
          startTime: '2024-01-01T00:00:00.000Z',
          status: 'completed' as const,
          filesCreated: 5,
        },
        {
          id: 'sess-2',
          task: 'Test task 2',
          startTime: '2024-01-02T00:00:00.000Z',
          status: 'failed' as const,
          filesCreated: 2,
        },
      ];

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(existingSessions));
      vi.mocked(readdir).mockResolvedValue([]);
      vi.mocked(mkdir).mockResolvedValue(undefined);

      await history.init();

      expect(readFile).toHaveBeenCalled();
    });

    it('should handle corrupted index gracefully', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(true).mockReturnValueOnce(true); // directory exists, index exists
      vi.mocked(readFile).mockResolvedValue('invalid json{');
      vi.mocked(readdir).mockResolvedValue([]);

      // Should not throw
      await expect(history.init()).resolves.not.toThrow();

      // Sessions should be cleared
      const sessions = history.list();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('registerSession', () => {
    it('should add session to history', async () => {
      const sessionData = {
        id: 'test-123',
        task: 'Test task',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [],
        metrics: { totalDuration: 300000 },
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);

      await history.registerSession(sessionData as any);

      const session = history.getSession('test-123');
      expect(session).toBeDefined();
      expect(session?.task).toBe('Test task');
      expect(writeFile).toHaveBeenCalled();
    });

    it('should truncate long task names', async () => {
      const longTask = 'A'.repeat(200);
      const sessionData = {
        id: 'test-456',
        task: longTask,
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [],
        metrics: undefined,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);

      await history.registerSession(sessionData as any);

      const session = history.getSession('test-456');
      expect(session?.task).toHaveLength(103); // 100 + '...'
      expect(session?.task).toMatch(/\.\.\.$/);
    });
  });

  describe('getSession/get', () => {
    it('should retrieve specific session', async () => {
      const sessionData = {
        id: 'test-789',
        task: 'Retrieve test',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [],
        metrics: undefined,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);
      await history.registerSession(sessionData as any);

      const session = history.getSession('test-789');
      expect(session).toBeDefined();
      expect(session?.task).toBe('Retrieve test');
    });

    it('should return undefined for non-existent session', () => {
      const session = history.getSession('nonexistent');
      expect(session).toBeUndefined();
    });

    it('should work with get alias', async () => {
      const sessionData = {
        id: 'test-alias',
        task: 'Alias test',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [],
        metrics: undefined,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);
      await history.registerSession(sessionData as any);

      const session = history.get('test-alias');
      expect(session).toBeDefined();
    });
  });

  describe('loadFullSession', () => {
    it('should load full session data from file', async () => {
      const fullSession = {
        id: 'full-123',
        task: 'Full session test',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [{ path: 'test.ts', status: 'created' }],
        metrics: { totalDuration: 300000 },
        logs: [],
      };

      vi.mocked(readdir).mockResolvedValue(['full-123.json', 'history-index.json']);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(fullSession));

      const loaded = await history.loadFullSession('full-123');

      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe('full-123');
      expect(loaded?.files).toHaveLength(1);
    });

    it('should return null if session file not found', async () => {
      vi.mocked(readdir).mockResolvedValue(['other-123.json']);

      const loaded = await history.loadFullSession('nonexistent');

      expect(loaded).toBeNull();
    });

    it('should handle JSON errors gracefully', async () => {
      vi.mocked(readdir).mockResolvedValue(['bad-123.json']);
      vi.mocked(readFile).mockResolvedValue('invalid json{');

      const loaded = await history.loadFullSession('bad-123');

      expect(loaded).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Register some test sessions
      const sessions = [
        {
          id: 's1',
          task: 'Task 1',
          startTime: '2024-01-03T00:00:00.000Z',
          endTime: '2024-01-03T00:05:00.000Z',
          status: 'completed' as const,
          files: [{ path: 'f1.ts', status: 'created' as const }],
          metrics: undefined,
        },
        {
          id: 's2',
          task: 'Task 2',
          startTime: '2024-01-02T00:00:00.000Z',
          endTime: '2024-01-02T00:03:00.000Z',
          status: 'failed' as const,
          files: [{ path: 'f2.ts', status: 'created' as const }],
          metrics: undefined,
        },
        {
          id: 's3',
          task: 'Task 3',
          startTime: '2024-01-01T00:00:00.000Z',
          endTime: '2024-01-01T00:02:00.000Z',
          status: 'completed' as const,
          files: [{ path: 'f3.ts', status: 'created' as const }],
          metrics: undefined,
        },
      ];

      vi.mocked(writeFile).mockResolvedValue(undefined);
      for (const session of sessions) {
        await history.registerSession(session as any);
      }
    });

    it('should list all sessions sorted by date', () => {
      const list = history.list();

      expect(list).toHaveLength(3);
      expect(list[0].id).toBe('s1'); // Most recent
      expect(list[2].id).toBe('s3'); // Oldest
    });

    it('should filter by status', () => {
      const completed = history.list({ status: 'completed' });

      expect(completed).toHaveLength(2);
      expect(completed.every(s => s.status === 'completed')).toBe(true);
    });

    it('should search by task or id', () => {
      const results = history.list({ search: 'Task 1' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('s1');
    });

    it('should limit results', () => {
      const limited = history.list({ limit: 2 });

      expect(limited).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should calculate history statistics', async () => {
      const sessions = [
        {
          id: 'stat-1',
          task: 'Completed task',
          startTime: '2024-01-01T00:00:00.000Z',
          endTime: '2024-01-01T00:05:00.000Z',
          status: 'completed' as const,
          files: [{ path: 'f1.ts', status: 'created' as const }],
          metrics: { totalDuration: 300000 },
        },
        {
          id: 'stat-2',
          task: 'Failed task',
          startTime: '2024-01-02T00:00:00.000Z',
          endTime: '2024-01-02T00:02:00.000Z',
          status: 'failed' as const,
          files: [{ path: 'f2.ts', status: 'created' as const }],
          metrics: { totalDuration: 120000 },
        },
        {
          id: 'stat-3',
          task: 'Another completed',
          startTime: '2024-01-03T00:00:00.000Z',
          endTime: '2024-01-03T00:04:00.000Z',
          status: 'completed' as const,
          files: [
            { path: 'f3a.ts', status: 'created' as const },
            { path: 'f3b.ts', status: 'created' as const },
          ],
          metrics: { totalDuration: 240000 },
        },
      ];

      vi.mocked(writeFile).mockResolvedValue(undefined);
      for (const session of sessions) {
        await history.registerSession(session as any);
      }

      const stats = history.getStats();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.avgDuration).toBeCloseTo(220000, 0); // (300000 + 120000 + 240000) / 3
      expect(stats.avgFiles).toBeCloseTo(1.33, 1); // (1 + 1 + 2) / 3
    });
  });

  describe('updateSession', () => {
    it('should update existing session', async () => {
      const sessionData = {
        id: 'update-123',
        task: 'Original task',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'running' as const,
        files: [],
        metrics: undefined,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);
      await history.registerSession(sessionData as any);

      await history.updateSession('update-123', {
        status: 'completed',
        endTime: '2024-01-01T00:06:00.000Z',
      });

      const updated = history.getSession('update-123');
      expect(updated?.status).toBe('completed');
      expect(updated?.endTime).toBe('2024-01-01T00:06:00.000Z');
      expect(updated?.task).toBe('Original task'); // Unchanged
    });

    it('should not update non-existent session', async () => {
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await history.updateSession('nonexistent', { status: 'completed' as const });

      // Should not throw, just silently fail
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session from history', async () => {
      const sessionData = {
        id: 'delete-123',
        task: 'To be deleted',
        startTime: '2024-01-01T00:00:00.000Z',
        endTime: '2024-01-01T00:05:00.000Z',
        status: 'completed' as const,
        files: [],
        metrics: undefined,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);
      await history.registerSession(sessionData as any);

      vi.mocked(readdir).mockResolvedValue(['delete-123.json']);
      vi.mocked(unlink).mockResolvedValue(undefined);

      const deleted = await history.deleteSession('delete-123');

      expect(deleted).toBe(true);
      expect(history.getSession('delete-123')).toBeUndefined();
    });

    it('should return false for non-existent session', async () => {
      const deleted = await history.deleteSession('nonexistent');

      expect(deleted).toBe(false);
    });
  });

  describe('formatForConsole', () => {
    it('should format session for console display', () => {
      const session = {
        id: 'abc123def456',
        task: 'Test task',
        startTime: '2024-01-01T12:00:00.000Z',
        status: 'completed' as const,
        filesCreated: 5,
        duration: 125000, // 2m 5s
      };

      const formatted = SessionHistory.formatForConsole(session);

      expect(formatted).toContain('✅');
      expect(formatted).toContain('abc123de'); // First 8 chars of ID
      expect(formatted).toContain('2m 5s');
      expect(formatted).toContain('5 files');
      expect(formatted).toContain('Test task');
    });
  });
});
