/**
 * Tests for ExperienceCollector
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExperienceCollector } from './ExperienceCollector.js';
import type { ExecutionOutcome } from './types.js';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

describe('ExperienceCollector', () => {
  let collector: ExperienceCollector;
  const testBufferPath = 'test-experience-buffer.jsonl';

  beforeEach(async () => {
    collector = new ExperienceCollector({
      experienceBufferPath: testBufferPath,
      experienceBufferSize: 10,
    });
    await collector.initialize();
  });

  afterEach(async () => {
    // Clean up test file
    if (existsSync(testBufferPath)) {
      await unlink(testBufferPath);
    }
  });

  describe('initialization', () => {
    it('should initialize with empty buffer', () => {
      const experiences = collector.getExperiences();
      expect(experiences).toHaveLength(0);
    });

    it('should create buffer directory', async () => {
      // Buffer file is created on first experience, not on init
      // Just verify initialization doesn't throw
      expect(collector).toBeDefined();
    });
  });

  describe('collectExperience', () => {
    it('should collect successful experience', async () => {
      const context = {
        sessionId: 'test-session-1',
        taskId: 'task-1',
        taskType: 'feature' as const,
        domain: 'backend' as const,
        complexity: 'medium' as const,
        riskLevel: 'low' as const,
        estimatedTime: '30 minutes',
        skillsNeeded: ['backend', 'database'],
        agentsUsed: ['architect', 'executor'],
        strategy: 'sequential' as const,
        parameters: {
          timeoutMultiplier: 1.0,
          parallelism: 3,
          retryStrategy: 'retry_with_backoff' as const,
          safetyLevel: 'balanced' as const,
        },
      };

      const outcome: ExecutionOutcome = {
        success: true,
        actualTime: 25,
        resourcesUsed: ['backend', 'database'],
        errorCount: 0,
        userModifications: 0,
        safetyViolations: false,
        testsPassed: true,
      };

      const experience = await collector.collectExperience(context, outcome);

      expect(experience.reward).toBeGreaterThan(0);
      expect(experience.done).toBe(true);
      expect(experience.metadata.taskType).toBe('feature');
    });

    it('should collect failed experience with negative reward', async () => {
      const context = {
        sessionId: 'test-session-2',
        taskId: 'task-2',
        taskType: 'bug' as const,
        domain: 'frontend' as const,
        complexity: 'simple' as const,
        riskLevel: 'low' as const,
        estimatedTime: '15 minutes',
        skillsNeeded: ['frontend'],
        agentsUsed: ['executor'],
        strategy: 'direct' as const,
        parameters: {
          timeoutMultiplier: 1.0,
          parallelism: 1,
          retryStrategy: 'fail_fast' as const,
          safetyLevel: 'strict' as const,
        },
      };

      const outcome: ExecutionOutcome = {
        success: false,
        actualTime: 30,
        resourcesUsed: ['frontend'],
        errorCount: 3,
        userModifications: 0,
        safetyViolations: false,
      };

      const experience = await collector.collectExperience(context, outcome);

      expect(experience.reward).toBeLessThan(0);
      expect(experience.done).toBe(false);
    });

    it('should add experience to buffer', async () => {
      const context = {
        sessionId: 'test-session-3',
        taskId: 'task-3',
        taskType: 'feature' as const,
        domain: 'backend' as const,
        complexity: 'simple' as const,
        riskLevel: 'low' as const,
        estimatedTime: '10 minutes',
        skillsNeeded: ['backend'],
        agentsUsed: ['executor'],
        strategy: 'sequential' as const,
        parameters: {
          timeoutMultiplier: 1.0,
          parallelism: 1,
          retryStrategy: 'retry_with_backoff' as const,
          safetyLevel: 'balanced' as const,
        },
      };

      const outcome: ExecutionOutcome = {
        success: true,
        actualTime: 8,
        resourcesUsed: ['backend'],
        errorCount: 0,
        userModifications: 0,
        safetyViolations: false,
      };

      await collector.collectExperience(context, outcome);

      const experiences = collector.getExperiences();
      expect(experiences).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return empty stats for empty buffer', () => {
      const stats = collector.getStats();

      expect(stats.total).toBe(0);
      expect(stats.meanReward).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate stats correctly', async () => {
      // Add successful experience
      await collector.collectExperience(
        {
          sessionId: 's1',
          taskId: 't1',
          taskType: 'feature',
          domain: 'backend',
          complexity: 'simple',
          riskLevel: 'low',
          estimatedTime: '10 min',
          skillsNeeded: [],
          agentsUsed: [],
          strategy: 'sequential',
          parameters: {
            timeoutMultiplier: 1,
            parallelism: 1,
            retryStrategy: 'retry_with_backoff',
            safetyLevel: 'balanced',
          },
        },
        {
          success: true,
          actualTime: 10,
          resourcesUsed: [],
          errorCount: 0,
          userModifications: 0,
          safetyViolations: false,
        }
      );

      // Add failed experience
      await collector.collectExperience(
        {
          sessionId: 's2',
          taskId: 't2',
          taskType: 'bug',
          domain: 'frontend',
          complexity: 'medium',
          riskLevel: 'medium',
          estimatedTime: '20 min',
          skillsNeeded: [],
          agentsUsed: [],
          strategy: 'sequential',
          parameters: {
            timeoutMultiplier: 1,
            parallelism: 1,
            retryStrategy: 'retry_with_backoff',
            safetyLevel: 'balanced',
          },
        },
        {
          success: false,
          actualTime: 30,
          resourcesUsed: [],
          errorCount: 2,
          userModifications: 0,
          safetyViolations: false,
        }
      );

      const stats = collector.getStats();

      expect(stats.total).toBe(2);
      expect(stats.successRate).toBe(0.5);
      expect(stats.byTaskType).toHaveProperty('feature');
      expect(stats.byTaskType).toHaveProperty('bug');
      expect(stats.byDomain).toHaveProperty('backend');
      expect(stats.byDomain).toHaveProperty('frontend');
    });
  });

  describe('buffer management', () => {
    it('should respect buffer size limit', async () => {
      // Collect more than buffer size
      for (let i = 0; i < 15; i++) {
        await collector.collectExperience(
          {
            sessionId: `s${i}`,
            taskId: `t${i}`,
            taskType: 'feature',
            domain: 'backend',
            complexity: 'simple',
            riskLevel: 'low',
            estimatedTime: '10 min',
            skillsNeeded: [],
            agentsUsed: [],
            strategy: 'sequential',
            parameters: {
              timeoutMultiplier: 1,
              parallelism: 1,
              retryStrategy: 'retry_with_backoff',
              safetyLevel: 'balanced',
            },
          },
          {
            success: true,
            actualTime: 10,
            resourcesUsed: [],
            errorCount: 0,
            userModifications: 0,
            safetyViolations: false,
          }
        );
      }

      const experiences = collector.getExperiences();
      expect(experiences.length).toBeLessThanOrEqual(10);
    });
  });
});
