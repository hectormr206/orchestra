/**
 * Experience Collector
 *
 * Collects execution experiences for reinforcement learning
 */

import { writeFile, appendFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type {
  Experience,
  StateVector,
  ActionVector,
  ExecutionOutcome,
  ExperienceMetadata,
  TaskType,
  Domain,
  Complexity,
  RiskLevel,
  RewardComponents,
  LearningConfig,
} from './types.js';

/**
 * Constants for state encoding
 */
const TASK_TYPES: TaskType[] = [
  'feature',
  'bug',
  'refactor',
  'test',
  'docs',
  'review',
  'deploy',
  'security',
  'performance',
  'architecture',
  'database',
  'maintenance',
  'optimization',
];

const DOMAINS: Domain[] = [
  'frontend',
  'backend',
  'database',
  'devops',
  'mobile',
  'ai-ml',
  'security',
  'testing',
  'architecture',
];

/**
 * Experience Collector
 */
export class ExperienceCollector {
  private config: LearningConfig;
  private experienceBuffer: Experience[] = [];

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      mode: config.mode ?? 'disabled',
      experienceBufferSize: config.experienceBufferSize ?? 10000,
      experienceBufferPath:
        config.experienceBufferPath ?? 'data/experience_buffer/experiences.jsonl',
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      abTestRatio: config.abTestRatio ?? 0.1,
      enableMetrics: config.enableMetrics ?? true,
      modelPath: config.modelPath,
    };
  }

  /**
   * Initialize storage directory
   */
  async initialize(): Promise<void> {
    const dir = path.dirname(this.config.experienceBufferPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Load existing experiences from file
    if (existsSync(this.config.experienceBufferPath)) {
      await this.loadExperiences();
    }
  }

  /**
   * Collect experience from execution
   */
  async collectExperience(
    context: {
      sessionId: string;
      taskId: string;
      taskType: TaskType;
      domain: Domain;
      complexity: Complexity;
      riskLevel: RiskLevel;
      estimatedTime: string;
      secondaryDomains?: Domain[];
      skillsNeeded: string[];
      agentsUsed: string[];
      strategy: 'direct' | 'sequential' | 'parallel' | 'coordinated';
      parameters: {
        timeoutMultiplier: number;
        parallelism: number;
        retryStrategy: 'fail_fast' | 'retry_with_backoff' | 'fallback';
        safetyLevel: 'strict' | 'balanced' | 'permissive';
      };
    },
    outcome: ExecutionOutcome
  ): Promise<Experience> {
    // Extract state
    const state = this.extractState(context);

    // Extract action
    const action: ActionVector = {
      skills: context.skillsNeeded,
      agents: context.agentsUsed,
      approach: context.strategy,
      timeoutMultiplier: context.parameters.timeoutMultiplier,
      parallelism: context.parameters.parallelism,
      retryStrategy: context.parameters.retryStrategy,
      safetyLevel: context.parameters.safetyLevel,
    };

    // Compute reward
    const { reward, breakdown } = this.computeReward(context, outcome);

    // Create experience
    const experience: Experience = {
      state,
      action,
      reward,
      nextState: null, // TODO: Implement if needed for temporal difference learning
      done: outcome.success,
      metadata: {
        sessionId: context.sessionId,
        taskId: context.taskId,
        taskType: context.taskType,
        domain: context.domain,
        complexity: context.complexity,
        estimatedTime: context.estimatedTime,
        actualTime: outcome.actualTime,
        resourcesUsed: outcome.resourcesUsed,
        errorCount: outcome.errorCount,
        userModifications: outcome.userModifications,
        safetyViolations: outcome.safetyViolations,
        confidence: 0.5, // TODO: Get from policy if using learned model
        rewardBreakdown: breakdown,
      },
      timestamp: new Date(),
    };

    // Store experience
    await this.storeExperience(experience);

    return experience;
  }

  /**
   * Extract state vector from context
   */
  private extractState(context: {
    taskType: TaskType;
    domain: Domain;
    complexity: Complexity;
    riskLevel: RiskLevel;
    estimatedTime: string;
    secondaryDomains?: Domain[];
    skillsNeeded: string[];
  }): StateVector {
    return {
      taskType: this.oneHotEncode(context.taskType, TASK_TYPES),
      domain: this.oneHotEncode(context.domain, DOMAINS),
      complexity: this.ordinalEncode(context.complexity, ['simple', 'medium', 'complex']),
      riskLevel: this.ordinalEncode(context.riskLevel, ['low', 'medium', 'high']),
      estimatedTime: this.normalizeTime(context.estimatedTime),
      domainDiversity: (context.secondaryDomains?.length ?? 0) / 5,
      skillCount: Math.min(context.skillsNeeded.length, 10) / 10,
      successRate: 0.5, // TODO: Get from historical data
      timeAccuracy: 0.5, // TODO: Get from historical data
      resourceEfficiency: 0.5, // TODO: Get from historical data
      concurrentTasks: 0, // TODO: Get from system monitoring
      systemLoad: 0, // TODO: Get from system monitoring
      agentAvailability: {}, // TODO: Get from system monitoring
    };
  }

  /**
   * Compute reward from execution outcome
   */
  private computeReward(
    context: {
      estimatedTime: string;
    },
    outcome: ExecutionOutcome
  ): { reward: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};

    // 1. Success reward (dominant)
    breakdown.success = outcome.success ? 100 : -100;

    // 2. Time efficiency
    if (outcome.success) {
      const estimatedMinutes = this.parseTime(context.estimatedTime);
      const actualMinutes = outcome.actualTime;
      const efficiency = Math.min(estimatedMinutes / Math.max(actualMinutes, 1), 2.0);
      breakdown.timeEfficiency = efficiency * 20;
    } else {
      breakdown.timeEfficiency = 0;
    }

    // 3. Resource efficiency
    const resourcesUsed = outcome.resourcesUsed.length;
    const minimumResources = outcome.minimumResources ?? resourcesUsed;
    if (resourcesUsed <= minimumResources) {
      breakdown.resourceEfficiency = 10;
    } else {
      breakdown.resourceEfficiency = -(resourcesUsed - minimumResources) * 5;
    }

    // 4. Quality metrics
    if (outcome.errorCount === 0) {
      breakdown.quality = 15;
    } else {
      breakdown.quality = -outcome.errorCount * 10;
    }

    // 5. User satisfaction (implicit)
    if (outcome.userModifications === 0) {
      breakdown.userSatisfaction = 10;
    } else {
      breakdown.userSatisfaction = -outcome.userModifications * 5;
    }

    // 6. Safety adherence
    if (!outcome.safetyViolations) {
      breakdown.safety = 10;
    } else {
      breakdown.safety = -50; // Large penalty for safety issues
    }

    // 7. Test success bonus
    if (outcome.testsPassed) {
      breakdown.tests = 5;
    } else {
      breakdown.tests = 0;
    }

    // Calculate total reward
    const reward = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

    return { reward, breakdown };
  }

  /**
   * Store experience in buffer and persist to disk
   */
  private async storeExperience(experience: Experience): Promise<void> {
    // Add to in-memory buffer
    this.experienceBuffer.push(experience);

    // Maintain buffer size limit (rolling buffer)
    if (this.experienceBuffer.length > this.config.experienceBufferSize) {
      this.experienceBuffer.shift();
    }

    // Persist to disk (append-only JSONL format)
    const line = JSON.stringify(this.serializeExperience(experience)) + '\n';
    await appendFile(this.config.experienceBufferPath, line, 'utf-8');
  }

  /**
   * Load experiences from disk
   */
  private async loadExperiences(): Promise<void> {
    try {
      const content = await readFile(this.config.experienceBufferPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      // Load last N experiences (buffer size limit)
      const startIndex = Math.max(0, lines.length - this.config.experienceBufferSize);
      this.experienceBuffer = lines
        .slice(startIndex)
        .map((line) => this.deserializeExperience(JSON.parse(line)));
    } catch (error) {
      // File doesn't exist or is corrupted, start fresh
      this.experienceBuffer = [];
    }
  }

  /**
   * Get current experience buffer
   */
  getExperiences(): Experience[] {
    return [...this.experienceBuffer];
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    total: number;
    meanReward: number;
    successRate: number;
    byTaskType: Record<string, number>;
    byDomain: Record<string, number>;
  } {
    const stats = {
      total: this.experienceBuffer.length,
      meanReward: 0,
      successRate: 0,
      byTaskType: {} as Record<string, number>,
      byDomain: {} as Record<string, number>,
    };

    if (this.experienceBuffer.length === 0) {
      return stats;
    }

    // Calculate mean reward
    stats.meanReward =
      this.experienceBuffer.reduce((sum, exp) => sum + exp.reward, 0) /
      this.experienceBuffer.length;

    // Calculate success rate
    const successes = this.experienceBuffer.filter((exp) => exp.done).length;
    stats.successRate = successes / this.experienceBuffer.length;

    // Group by task type
    for (const exp of this.experienceBuffer) {
      const taskType = exp.metadata.taskType;
      stats.byTaskType[taskType] = (stats.byTaskType[taskType] ?? 0) + 1;
    }

    // Group by domain
    for (const exp of this.experienceBuffer) {
      const domain = exp.metadata.domain;
      stats.byDomain[domain] = (stats.byDomain[domain] ?? 0) + 1;
    }

    return stats;
  }

  /**
   * Export experiences for training
   */
  async exportForTraining(outputPath: string): Promise<void> {
    const data = this.experienceBuffer.map((exp) => this.serializeExperience(exp));
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Clear experience buffer
   */
  async clear(): Promise<void> {
    this.experienceBuffer = [];
  }

  // Helper methods

  private oneHotEncode<T>(value: T, values: T[]): number[] {
    return values.map((v) => (v === value ? 1 : 0));
  }

  private ordinalEncode(value: string, levels: string[]): number[] {
    const index = levels.indexOf(value);
    return levels.map((_, i) => (i === index ? 1 : 0));
  }

  private normalizeTime(timeStr: string): number {
    const minutes = this.parseTime(timeStr);
    // Normalize: < 30 min = 0.0, 60-120 min = 0.5, 120+ min = 1.0
    if (minutes < 30) return 0.0;
    if (minutes < 120) return (minutes - 30) / 90;
    return 1.0;
  }

  private parseTime(timeStr: string): number {
    // Parse strings like "30 minutes", "1 hour", "2 hours"
    const match = timeStr.match(/(\d+)\s*(min|minute|minutes|hour|hours|h)/i);
    if (!match) return 60; // Default to 1 hour

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('min')) {
      return value;
    } else {
      return value * 60;
    }
  }

  private serializeExperience(exp: Experience): any {
    return {
      state: exp.state,
      action: exp.action,
      reward: exp.reward,
      nextState: exp.nextState,
      done: exp.done,
      metadata: exp.metadata,
      timestamp: exp.timestamp.toISOString(),
    };
  }

  private deserializeExperience(data: any): Experience {
    return {
      ...data,
      timestamp: new Date(data.timestamp),
    };
  }
}
