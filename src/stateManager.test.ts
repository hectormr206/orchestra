/**
 * Tests for Orchestrator State Management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './utils/StateManager';
import type { SessionState } from './types';

describe('StateManager', () => {
  let manager: StateManager;
  const testDir = '.orchestra-test';

  beforeEach(async () => {
    manager = new StateManager(testDir);
    // Clean up from previous tests
    await manager.clear();
  });

  describe('initialization', () => {
    it('should initialize session', async () => {
      const state = await manager.init('Test task');

      expect(state).toBeDefined();
      expect(state.task).toBe('Test task');
      expect(state.phase).toBe('init');
      expect(state.sessionId).toBeDefined();
    });

    it('should create orchestra directory', async () => {
      await manager.init('Test task');

      const dir = manager.getOrchestraDir();
      expect(dir).toContain(testDir);
    });
  });

  describe('session state', () => {
    it('should save and load session state', async () => {
      await manager.init('Initial task');
      await manager.setPhase('executing');
      await manager.setIteration(2);
      await manager.setAgentStatus('executor', 'in_progress');

      const session = await manager.load();
      expect(session).toBeDefined();
      expect(session?.phase).toBe('executing');
      expect(session?.iteration).toBe(2);
      expect(session?.agents.executor?.status).toBe('in_progress');
    });

    it('should track agent status', async () => {
      await manager.init('Test task');

      await manager.setAgentStatus('architect', 'completed', 1000);
      await manager.setAgentStatus('executor', 'in_progress');
      await manager.setAgentStatus('auditor', 'pending');

      const session = await manager.load();
      expect(session?.agents.architect?.status).toBe('completed');
      expect(session?.agents.architect?.duration).toBe(1000);
      expect(session?.agents.executor?.status).toBe('in_progress');
      expect(session?.agents.auditor?.status).toBe('pending');
    });

    it('should update lastActivity timestamp on save', async () => {
      const state1 = await manager.init('Test task');
      const initialActivity = state1.lastActivity;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      await manager.setPhase('executing');

      const state2 = await manager.load();
      expect(state2?.lastActivity).not.toBe(initialActivity);
    });
  });

  describe('checkpoints', () => {
    it('should create checkpoints', async () => {
      await manager.init('Test task');
      await manager.setPhase('executing');

      await manager.createCheckpoint('exec-1');

      const session = await manager.load();
      expect(session?.checkpoints).toHaveLength(1);
      expect(session?.checkpoints[0].phase).toBe('exec-1');
    });

    it('should track checkpoint timestamps', async () => {
      await manager.init('Test task');

      await manager.createCheckpoint('checkpoint-1');

      const session = await manager.load();
      expect(session?.checkpoints[0].timestamp).toBeDefined();
      expect(session?.checkpoints[0].id).toBeDefined();
    });

    it('should create multiple checkpoints', async () => {
      await manager.init('Test task');

      await manager.createCheckpoint('phase-1');
      await manager.createCheckpoint('phase-2');
      await manager.createCheckpoint('phase-3');

      const session = await manager.load();
      expect(session?.checkpoints).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should save error state', async () => {
      await manager.init('Test task');

      const errorMessage = 'Test error occurred';
      await manager.setError(errorMessage);

      const session = await manager.load();
      expect(session?.lastError).toBe(errorMessage);
    });

    it('should allow resume after error', async () => {
      await manager.init('Test task');

      await manager.setError('Test error');

      const canResume = await manager.canResume();
      expect(canResume).toBe(true);
    });

    it('should overwrite previous error', async () => {
      await manager.init('Test task');

      await manager.setError('First error');
      await manager.setError('Second error');

      const session = await manager.load();
      expect(session?.lastError).toBe('Second error');
    });
  });

  describe('cleanup', () => {
    it('should clear all session data', async () => {
      await manager.init('Test task');
      await manager.setPhase('executing');

      await manager.clear();

      const session = await manager.load();
      expect(session).toBeNull();
    });
  });

  describe('resume capability', () => {
    it('should detect if session can be resumed', async () => {
      await manager.init('Test task');

      const canResume = await manager.canResume();
      expect(canResume).toBe(true);
    });

    it('should not resume if session is completed', async () => {
      await manager.init('Test task');
      await manager.setPhase('completed');

      const canResume = await manager.canResume();
      expect(canResume).toBe(false);
    });

    it('should not resume if no session exists', async () => {
      const canResume = await manager.canResume();
      expect(canResume).toBe(false);
    });

    it('should allow resume with error', async () => {
      await manager.init('Test task');
      await manager.setError('Some error');

      const canResume = await manager.canResume();
      expect(canResume).toBe(true);
    });
  });

  describe('file paths', () => {
    it('should generate correct file paths', async () => {
      await manager.init('Test task');

      const sessionPath = manager.getFilePath('session.json');
      expect(sessionPath).toContain(testDir);
      expect(sessionPath).toContain('session.json');

      const planPath = manager.getFilePath('plan.md');
      expect(planPath).toContain('plan.md');

      const subdirPath = manager.getFilePath('checkpoints/test.json');
      expect(subdirPath).toContain('checkpoints');
      expect(subdirPath).toContain('test.json');
    });

    it('should return orchestra directory', () => {
      manager = new StateManager('.test-orchestra');
      const dir = manager.getOrchestraDir();

      expect(dir).toBe('.test-orchestra');
    });
  });

  describe('session lifecycle', () => {
    it('should track session through phases', async () => {
      const state = await manager.init('Test task');

      expect(state.phase).toBe('init');
      expect(state.iteration).toBe(0);

      await manager.setPhase('planning');
      await manager.setIteration(1);

      let session = await manager.load();
      expect(session?.phase).toBe('planning');
      expect(session?.iteration).toBe(1);

      await manager.setAgentStatus('architect', 'completed', 500);
      await manager.setPhase('executing');

      session = await manager.load();
      expect(session?.phase).toBe('executing');
      expect(session?.agents.architect?.duration).toBe(500);
    });

    it('should initialize all agents as pending', async () => {
      const state = await manager.init('Test task');

      expect(state.agents.architect.status).toBe('pending');
      expect(state.agents.executor.status).toBe('pending');
      expect(state.agents.auditor.status).toBe('pending');
      expect(state.agents.consultant.status).toBe('not_needed');
    });

    it('should track completion of agents', async () => {
      await manager.init('Test task');

      await manager.setAgentStatus('architect', 'completed', 1000);
      await manager.setAgentStatus('executor', 'completed', 2000);
      await manager.setAgentStatus('auditor', 'completed', 500);

      const session = await manager.load();
      expect(session?.agents.architect.status).toBe('completed');
      expect(session?.agents.executor.status).toBe('completed');
      expect(session?.agents.auditor.status).toBe('completed');
    });
  });

  describe('state persistence', () => {
    it('should persist state across manager instances', async () => {
      // Create first manager and initialize
      await manager.init('Persisted task');
      await manager.setPhase('executing');
      await manager.setIteration(3);

      // Create new manager instance
      const manager2 = new StateManager(testDir);
      const session = await manager2.load();

      expect(session).toBeDefined();
      expect(session?.task).toBe('Persisted task');
      expect(session?.phase).toBe('executing');
      expect(session?.iteration).toBe(3);
    });

    it('should handle multiple saves correctly', async () => {
      await manager.init('Multi-save test');

      for (let i = 0; i < 5; i++) {
        await manager.setIteration(i);
      }

      const session = await manager.load();
      expect(session?.iteration).toBe(4);
    });
  });
});
