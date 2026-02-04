/**
 * Tests for StateManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from './StateManager.js';
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import path from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  rmSync: vi.fn(),
}));

describe('StateManager', () => {
  let manager: StateManager;
  const mockSessionDir = '.orchestra';

  beforeEach(() => {
    manager = new StateManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('saveSession', () => {
    it('should save session state to file', () => {
      const sessionState = {
        sessionId: 'test-123',
        task: 'Test task',
        status: 'running' as const,
        startTime: Date.now(),
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(writeFileSync).mockImplementation(() => {});

      manager.saveSession(sessionState);

      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should create directory if not exists', () => {
      const sessionState = {
        sessionId: 'test-456',
        task: 'Another task',
        status: 'running' as const,
        startTime: Date.now(),
      };

      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(mkdirSync).mockImplementation(() => {});
      vi.mocked(writeFileSync).mockImplementation(() => {});

      manager.saveSession(sessionState);

      expect(mkdirSync).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should handle file system errors gracefully', () => {
      const sessionState = {
        sessionId: 'test-789',
        task: 'Error test',
        status: 'running' as const,
        startTime: Date.now(),
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      // Should not throw
      expect(() => manager.saveSession(sessionState)).not.toThrow();
    });
  });

  describe('loadSession', () => {
    it('should load session state from file', () => {
      const sessionState = {
        sessionId: 'test-123',
        task: 'Test task',
        status: 'running' as const,
        startTime: Date.now(),
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(sessionState));

      const loaded = manager.loadSession('test-123');

      expect(loaded).toBeDefined();
      expect(loaded.sessionId).toBe('test-123');
    });

    it('should return null if session file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const loaded = manager.loadSession('nonexistent');

      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('invalid json{');

      const loaded = manager.loadSession('test-123');

      expect(loaded).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session file', () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(rmSync).mockImplementation(() => {});

      manager.deleteSession('test-123');

      expect(rmSync).toHaveBeenCalled();
    });

    it('should not error if session does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => manager.deleteSession('nonexistent')).not.toThrow();
    });
  });

  describe('listSessions', () => {
    it('should return list of session IDs', () => {
      // Mock would go here
      const sessions = manager.listSessions();

      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe('sessionExists', () => {
    it('should check if session exists', () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const exists = manager.sessionExists('test-123');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const exists = manager.sessionExists('nonexistent');

      expect(exists).toBe(false);
    });
  });
});
