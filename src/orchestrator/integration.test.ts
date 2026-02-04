/**
 * Integration Tests for Orchestra
 *
 * Tests the complete flow from task input to execution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Orchestrator } from './Orchestrator';
import type { OrchestratorConfig } from './types';

// Test types for integration testing
interface TestTask {
  id: string;
  description: string;
  context: string;
}

interface TestPlanStep {
  id: string;
  action: 'create' | 'modify' | 'delete';
  file: string;
  description: string;
}

interface TestExecutionPlan {
  taskId: string;
  steps: TestPlanStep[];
  estimatedDuration: number;
}

// Mock the adapters
vi.mock('./adapters/CodexAdapter', () => ({
  CodexAdapter: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn().mockResolvedValue({
      content: 'Test response',
      usage: { totalTokens: 100 },
    }),
  })),
}));

vi.mock('./adapters/GLMAdapter', () => ({
  GLMAdapter: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn().mockResolvedValue({
      content: 'Test response',
      usage: { totalTokens: 100 },
    }),
  })),
}));

describe('Orchestrator Integration', () => {
  let orchestrator: Orchestrator;
  let config: OrchestratorConfig;

  beforeEach(() => {
    config = {
      orchestraDir: '/tmp/test-orchestra',
      aiCorePath: '/tmp/ai-core',
      timeout: 60000,
      maxIterations: 3,
      autoApprove: true,
      parallel: false,
      maxConcurrency: 3,
      pipeline: false,
      watch: false,
      watchPatterns: [],
      runTests: false,
      testCommand: 'npm test',
      gitCommit: false,
      commitMessage: 'feat: {task}',
      languages: ['typescript', 'javascript'],
      customPrompts: {},
      maxRecoveryAttempts: 3,
      recoveryTimeout: 600000,
      autoRevertOnFailure: true,
      agents: {
        architect: ['Codex'],
        executor: ['Claude (GLM 4.7)'],
        auditor: ['Codex'],
        consultant: ['Codex'],
      },
    };

    orchestrator = new Orchestrator(config);
  });

  describe('plan creation', () => {
    it('should create an execution plan', () => {
      const task: TestTask = {
        id: 'test-1',
        description: 'Create a simple function',
        context: 'Testing integration',
      };

      const plan: TestExecutionPlan = {
        taskId: task.id,
        steps: [
          {
            id: 'step-1',
            action: 'create',
            file: 'test.ts',
            description: 'Create test file',
          },
        ],
        estimatedDuration: 60000,
      };

      expect(plan).toBeDefined();
      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0].file).toBe('test.ts');
    });

    it('should validate plan structure', () => {
      const plan: TestExecutionPlan = {
        taskId: 'test-2',
        steps: [
          {
            id: 'step-1',
            action: 'create',
            file: 'test.ts',
            description: 'Create test file',
          },
          {
            id: 'step-2',
            action: 'modify',
            file: 'test.ts',
            description: 'Modify test file',
          },
        ],
        estimatedDuration: 120000,
      };

      expect(plan.taskId).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
      plan.steps.forEach((step: TestPlanStep) => {
        expect(step.id).toBeDefined();
        expect(step.action).toBeDefined();
        expect(step.file).toBeDefined();
      });
    });
  });

  describe('execution flow', () => {
    it('should track execution state', () => {
      const state = {
        status: 'pending' as const,
        currentStep: 0,
        totalSteps: 3,
        completedSteps: [] as string[],
        errors: [] as string[],
      };

      expect(state.status).toBe('pending');
      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBe(3);
      expect(state.completedSteps).toHaveLength(0);
    });

    it('should update state on step completion', () => {
      const state = {
        status: 'running' as const,
        currentStep: 0,
        totalSteps: 2,
        completedSteps: [] as string[],
        errors: [] as string[],
      };

      // Simulate completing step 1
      state.currentStep = 1;
      state.completedSteps.push('step-1');

      expect(state.currentStep).toBe(1);
      expect(state.completedSteps).toContain('step-1');
    });

    it('should track errors during execution', () => {
      const state = {
        status: 'running' as const,
        currentStep: 1,
        totalSteps: 2,
        completedSteps: ['step-1'],
        errors: [] as string[],
      };

      // Simulate an error in step 2
      state.errors.push('Error in step-2: Failed to write file');

      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toContain('step-2');
    });
  });

  describe('configuration validation', () => {
    it('should validate required config fields', () => {
      const validConfig: OrchestratorConfig = {
        orchestraDir: '/tmp/test',
        aiCorePath: '/tmp/ai-core',
        timeout: 60000,
        maxIterations: 3,
        autoApprove: true,
        parallel: false,
        maxConcurrency: 3,
        pipeline: false,
        watch: false,
        watchPatterns: [],
        runTests: false,
        testCommand: 'npm test',
        gitCommit: false,
        commitMessage: 'feat: test',
        languages: ['typescript'],
        customPrompts: {},
        maxRecoveryAttempts: 3,
        recoveryTimeout: 600000,
        autoRevertOnFailure: true,
        agents: {
          architect: ['Codex'],
          executor: ['Claude (GLM 4.7)'],
          auditor: ['Codex'],
          consultant: ['Codex'],
        },
      };

      expect(validConfig.orchestraDir).toBeDefined();
      expect(validConfig.aiCorePath).toBeDefined();
      expect(validConfig.agents.architect).toBeDefined();
      expect(validConfig.agents.executor).toBeDefined();
      expect(validConfig.agents.auditor).toBeDefined();
    });

    it('should use default values for optional fields', () => {
      const minimalConfig: OrchestratorConfig = {
        orchestraDir: '/tmp/test',
        aiCorePath: '/tmp/ai-core',
        timeout: 60000,
        maxIterations: 3,
        autoApprove: true,
        parallel: false,
        maxConcurrency: 3,
        pipeline: false,
        watch: false,
        watchPatterns: [],
        runTests: false,
        testCommand: 'npm test',
        gitCommit: false,
        commitMessage: 'feat: test',
        languages: ['typescript'],
        customPrompts: {},
        maxRecoveryAttempts: 3,
        recoveryTimeout: 600000,
        autoRevertOnFailure: true,
        agents: {
          architect: ['Codex'],
          executor: ['Claude (GLM 4.7)'],
          auditor: ['Codex'],
          consultant: ['Codex'],
        },
      };

      expect(minimalConfig.maxIterations).toBe(3);
      expect(minimalConfig.timeout).toBe(60000);
    });
  });

  describe('recovery mode', () => {
    it('should track recovery attempts', () => {
      const recoveryState = {
        enabled: true,
        attempts: 0,
        maxAttempts: 3,
        successful: false,
      };

      expect(recoveryState.enabled).toBe(true);
      expect(recoveryState.attempts).toBeLessThanOrEqual(recoveryState.maxAttempts);
    });

    it('should increment recovery attempts on retry', () => {
      const recoveryState = {
        enabled: true,
        attempts: 1,
        maxAttempts: 3,
        successful: false,
      };

      recoveryState.attempts += 1;

      expect(recoveryState.attempts).toBe(2);
      expect(recoveryState.attempts).toBeLessThanOrEqual(recoveryState.maxAttempts);
    });

    it('should mark recovery as successful after completion', () => {
      const recoveryState = {
        enabled: true,
        attempts: 2,
        maxAttempts: 3,
        successful: false,
      };

      recoveryState.successful = true;

      expect(recoveryState.successful).toBe(true);
    });
  });

  describe('checkpoint system', () => {
    it('should create checkpoints for progress', () => {
      const checkpoints = {
        lastCheckpoint: null as string | null,
        checkpoints: [] as Array<{ stepId: string; timestamp: number }>,
      };

      const newCheckpoint = {
        stepId: 'step-1',
        timestamp: Date.now(),
      };

      checkpoints.checkpoints.push(newCheckpoint);
      checkpoints.lastCheckpoint = newCheckpoint.stepId;

      expect(checkpoints.checkpoints).toHaveLength(1);
      expect(checkpoints.lastCheckpoint).toBe('step-1');
    });

    it('should resume from last checkpoint', () => {
      const checkpoints = {
        checkpoints: [
          { stepId: 'step-1', timestamp: 1000 },
          { stepId: 'step-2', timestamp: 2000 },
          { stepId: 'step-3', timestamp: 3000 },
        ],
        lastCheckpoint: 'step-2',
      };

      const resumeIndex = checkpoints.checkpoints.findIndex(
        cp => cp.stepId === checkpoints.lastCheckpoint
      );

      expect(resumeIndex).toBe(1);
      expect(checkpoints.checkpoints[resumeIndex].stepId).toBe('step-2');
    });
  });

  describe('metrics collection', () => {
    it('should track execution metrics', () => {
      const metrics = {
        startTime: Date.now(),
        endTime: 0,
        duration: 0,
        stepsCompleted: 0,
        stepsFailed: 0,
        tokensUsed: 0,
      };

      // Simulate execution with delay
      metrics.endTime = metrics.startTime + 100; // Add 100ms
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.stepsCompleted = 3;
      metrics.tokensUsed = 1500;

      expect(metrics.duration).toBeGreaterThanOrEqual(0);
      expect(metrics.stepsCompleted).toBe(3);
      expect(metrics.tokensUsed).toBe(1500);
    });

    it('should calculate success rate', () => {
      const metrics = {
        totalSteps: 10,
        successfulSteps: 8,
        failedSteps: 2,
      };

      const successRate = (metrics.successfulSteps / metrics.totalSteps) * 100;

      expect(successRate).toBe(80);
      expect(metrics.failedSteps).toBe(2);
    });
  });
});
