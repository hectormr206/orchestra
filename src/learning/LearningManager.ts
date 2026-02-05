/**
 * Learning Manager
 *
 * Manages learning modes and policy deployment
 */

import { ExperienceCollector } from './ExperienceCollector.js';
import { ActorCriticModel } from './ActorCriticModel.js';
import type {
  LearningMode,
  LearningConfig,
  ActionVector,
  StateVector,
  PolicyMetrics,
  Experience,
  TrainingMetrics,
} from './types.js';

/**
 * Learning Manager
 */
export class LearningManager {
  private collector: ExperienceCollector;
  private config: LearningConfig;
  private policy: Policy | null = null;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      mode: this.parseLearningModeFromEnv(config.mode),
      experienceBufferSize: config.experienceBufferSize ?? 10000,
      experienceBufferPath:
        config.experienceBufferPath ?? 'data/experience_buffer/experiences.jsonl',
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      abTestRatio: config.abTestRatio ?? 0.1,
      enableMetrics: config.enableMetrics ?? true,
      modelPath: config.modelPath,
    };

    this.collector = new ExperienceCollector(this.config);
  }

  /**
   * Initialize learning system
   */
  async initialize(): Promise<void> {
    await this.collector.initialize();

    // Load trained model if available
    if (this.config.modelPath && this.config.mode !== 'disabled') {
      try {
        this.policy = await Policy.load(this.config.modelPath);
        console.log(`[Learning] Loaded policy from ${this.config.modelPath}`);
      } catch (error) {
        console.warn(`[Learning] Could not load policy: ${error}`);
        this.policy = null;
      }
    }
  }

  /**
   * Get current learning mode
   */
  getMode(): LearningMode {
    return this.config.mode;
  }

  /**
   * Set learning mode
   */
  setMode(mode: LearningMode): void {
    this.config.mode = mode;
    console.log(`[Learning] Mode set to: ${mode}`);
  }

  /**
   * Decide whether to use learned policy or rules
   */
  shouldUseLearnedPolicy(): boolean {
    if (!this.policy) {
      return false;
    }

    switch (this.config.mode) {
      case 'disabled':
        return false;
      case 'shadow':
        return false; // Collect but don't use
      case 'ab_test':
        return Math.random() < (this.config.abTestRatio ?? 0.1);
      case 'production':
        return true;
      default:
        return false;
    }
  }

  /**
   * Get action from learned policy
   */
  async getPolicyAction(state: StateVector): Promise<ActionVector | null> {
    if (!this.policy) {
      return null;
    }

    try {
      const action = await this.policy.predict(state);
      return action;
    } catch (error) {
      console.error(`[Learning] Policy prediction failed: ${error}`);
      return null;
    }
  }

  /**
   * Get experience collector
   */
  getCollector(): ExperienceCollector {
    return this.collector;
  }

  /**
   * Get statistics
   */
  getStats(): {
    mode: LearningMode;
    policyLoaded: boolean;
    experienceStats: ReturnType<ExperienceCollector['getStats']>;
  } {
    return {
      mode: this.config.mode,
      policyLoaded: this.policy !== null,
      experienceStats: this.collector.getStats(),
    };
  }

  /**
   * Export experiences for training
   */
  async exportExperiences(outputPath: string): Promise<void> {
    await this.collector.exportForTraining(outputPath);
  }

  /**
   * Train policy on collected experiences
   */
  async trainPolicy(epochs: number = 100): Promise<TrainingMetrics[]> {
    const experiences = this.collector.getExperiences();

    if (experiences.length < 50) {
      throw new Error(
        `Not enough experiences to train. Have ${experiences.length}, need at least 50.`
      );
    }

    console.log(`[Learning] Training policy on ${experiences.length} experiences...`);

    // Create new policy if not exists
    if (!this.policy) {
      this.policy = Policy.create();
    }

    // Train
    const history = await this.policy.train(experiences, epochs);

    console.log('[Learning] Training complete!');

    return history;
  }

  /**
   * Evaluate policy on collected experiences
   */
  async evaluatePolicy(): Promise<PolicyMetrics> {
    if (!this.policy) {
      throw new Error('No policy loaded or trained');
    }

    const experiences = this.collector.getExperiences();

    if (experiences.length === 0) {
      throw new Error('No experiences to evaluate on');
    }

    console.log(`[Learning] Evaluating policy on ${experiences.length} experiences...`);

    const metrics = await this.policy.evaluate(experiences);

    console.log('[Learning] Evaluation results:');
    console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  Mean Reward: ${metrics.meanReward.toFixed(2)}`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);

    return metrics;
  }

  /**
   * Save trained policy
   */
  async savePolicy(directory: string): Promise<void> {
    if (!this.policy) {
      throw new Error('No policy to save');
    }

    await this.policy.save(directory);
    console.log(`[Learning] Policy saved to ${directory}`);
  }

  /**
   * Parse learning mode from environment variable
   */
  private parseLearningModeFromEnv(configMode?: LearningMode): LearningMode {
    const envMode = process.env.ORCHESTRA_LEARNING_MODE?.toLowerCase();

    if (configMode) {
      return configMode;
    }

    switch (envMode) {
      case 'shadow':
        return 'shadow';
      case 'ab_test':
      case 'ab-test':
        return 'ab_test';
      case 'production':
        return 'production';
      case 'disabled':
      default:
        return 'disabled';
    }
  }
}

/**
 * Policy class wrapping ActorCriticModel
 */
class Policy {
  private model: ActorCriticModel;

  constructor(model: ActorCriticModel) {
    this.model = model;
  }

  /**
   * Load policy from file
   */
  static async load(modelPath: string): Promise<Policy> {
    const model = new ActorCriticModel();
    await model.load(modelPath);
    return new Policy(model);
  }

  /**
   * Create new policy
   */
  static create(): Policy {
    const model = new ActorCriticModel();
    model.initialize();
    return new Policy(model);
  }

  /**
   * Predict action from state
   */
  async predict(state: StateVector): Promise<ActionVector> {
    return await this.model.predict(state);
  }

  /**
   * Train policy on experiences
   */
  async train(experiences: Experience[], epochs: number = 100): Promise<TrainingMetrics[]> {
    return await this.model.trainEpochs(experiences, epochs);
  }

  /**
   * Evaluate policy on test set
   */
  async evaluate(experiences: Experience[]): Promise<PolicyMetrics> {
    return await this.model.evaluate(experiences);
  }

  /**
   * Save policy to disk
   */
  async save(directory: string): Promise<void> {
    await this.model.save(directory);
  }

  /**
   * Get model summary
   */
  getSummary(): string {
    return this.model.getSummary();
  }
}

/**
 * Singleton instance
 */
let learningManagerInstance: LearningManager | null = null;

export function getLearningManager(config?: Partial<LearningConfig>): LearningManager {
  if (!learningManagerInstance || config) {
    learningManagerInstance = new LearningManager(config);
  }
  return learningManagerInstance;
}
