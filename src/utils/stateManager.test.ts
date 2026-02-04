/**
 * Tests for StateManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from './StateManager.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('StateManager', () => {
  let manager: StateManager;
  const mockSessionDir = '.orchestra-test';

  beforeEach(() => {
    manager = new StateManager(mockSessionDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('init', () => {
    it('should initialize a new session', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const state = await manager.init('Test task');

      expect(state.sessionId).toMatch(/^sess_\d+$/);
      expect(state.task).toBe('Test task');
      expect(state.phase).toBe('init');
      expect(state.iteration).toBe(0);
      expect(mkdir).toHaveBeenCalledTimes(2); // orchestraDir and checkpointsDir
      expect(writeFile).toHaveBeenCalled();
    });

    it('should create session with correct structure', async () => {
      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const state = await manager.init('Another task');

      expect(state).toHaveProperty('sessionId');
      expect(state).toHaveProperty('task', 'Another task');
      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('iteration');
      expect(state).toHaveProperty('startedAt');
      expect(state).toHaveProperty('lastActivity');
      expect(state).toHaveProperty('agents');
      expect(state).toHaveProperty('checkpoints');
      expect(state).toHaveProperty('canResume', true);
      expect(state).toHaveProperty('lastError', null);
    });
  });

  describe('load', () => {
    it('should load session state from file', async () => {
      const mockState = {
        sessionId: 'test-123',
        task: 'Test task',
        phase: 'execution' as const,
        iteration: 1,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        agents: {
          architect: { status: 'completed', duration: 1000 },
          executor: { status: 'running', duration: null },
          auditor: { status: 'pending', duration: null },
          consultant: { status: 'not_needed', duration: null },
        },
        checkpoints: [],
        canResume: true,
        lastError: null,
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockState));

      const loaded = await manager.load();

      expect(loaded).toBeDefined();
      expect(loaded?.sessionId).toBe('test-123');
      expect(loaded?.task).toBe('Test task');
    });

    it('should return null if session file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const loaded = await manager.load();

      expect(loaded).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue('invalid json{');

      const loaded = await manager.load();

      expect(loaded).toBeNull();
    });
  });

  describe('save', () => {
    it('should save session state to file', async () => {
      const mockState = {
        sessionId: 'test-456',
        task: 'Save test',
        phase: 'execution' as const,
        iteration: 1,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        agents: {
          architect: { status: 'completed', duration: 1000 },
          executor: { status: 'running', duration: null },
          auditor: { status: 'pending', duration: null },
          consultant: { status: 'not_needed', duration: null },
        },
        checkpoints: [],
        canResume: true,
        lastError: null,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);

      await manager.save(mockState);

      expect(writeFile).toHaveBeenCalled();
      const callArgs = vi.mocked(writeFile).mock.calls[0];
      expect(callArgs[0]).toContain('.orchestra-test/state.json');
      expect(callArgs[1]).toContain(JSON.stringify(mockState, null, 2));
    });

    it('should update lastActivity timestamp', async () => {
      const mockState = {
        sessionId: 'test-789',
        task: 'Timestamp test',
        phase: 'execution' as const,
        iteration: 0,
        startedAt: '2024-01-01T00:00:00.000Z',
        lastActivity: '2024-01-01T00:00:00.000Z',
        agents: {
          architect: { status: 'pending', duration: null },
          executor: { status: 'pending', duration: null },
          auditor: { status: 'pending', duration: null },
          consultant: { status: 'not_needed', duration: null },
        },
        checkpoints: [],
        canResume: true,
        lastError: null,
      };

      vi.mocked(writeFile).mockResolvedValue(undefined);

      await manager.save(mockState);

      const callArgs = vi.mocked(writeFile).mock.calls[0];
      const savedState = JSON.parse(callArgs[1] as string);
      expect(savedState.lastActivity).not.toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('setPhase', () => {
    it('should update the current phase', async () => {
      const mockState = {
        sessionId: 'test-phase',
        task: 'Phase test',
        phase: 'init' as const,
        iteration: 0,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        agents: {
          architect: { status: 'pending', duration: null },
          executor: { status: 'pending', duration: null },
          auditor: { status: 'pending', duration: null },
          consultant: { status: 'not_needed', duration: null },
        },
        checkpoints: [],
        canResume: true,
        lastError: null,
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockState));
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await manager.setPhase('execution');

      expect(readFile).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
    });
  });

  describe('setIteration', () => {
    it('should update the current iteration', async () => {
      const mockState = {
        sessionId: 'test-iteration',
        task: 'Iteration test',
        phase: 'execution' as const,
        iteration: 1,
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        agents: {
          architect: { status: 'completed', duration: 1000 },
          executor: { status: 'running', duration: null },
          auditor: { status: 'pending', duration: null },
          consultant: { status: 'not_needed', duration: null },
        },
        checkpoints: [],
        canResume: true,
        lastError: null,
      };

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockState));
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await manager.setIteration(2);

      expect(readFile).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
    });
  });
});
