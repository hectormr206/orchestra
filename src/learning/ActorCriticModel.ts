/**
 * Actor-Critic Model Implementation
 *
 * Implements Actor and Critic neural networks using TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs-node';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type {
  StateVector,
  ActionVector,
  Experience,
  TrainingMetrics,
  PolicyMetrics,
} from './types.js';

/**
 * Model configuration
 */
export interface ModelConfig {
  stateDim: number;
  actionDim: number;
  hiddenLayers: number[];
  learningRate: number;
  gamma: number; // Discount factor
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ModelConfig = {
  stateDim: 50, // Approximate state vector size
  actionDim: 100, // Approximate action vector size
  hiddenLayers: [256, 128],
  learningRate: 0.001,
  gamma: 0.99,
};

/**
 * Actor-Critic Model
 */
export class ActorCriticModel {
  private config: ModelConfig;
  private actor: tf.LayersModel | null = null;
  private critic: tf.LayersModel | null = null;
  private optimizer: tf.Optimizer;

  constructor(config: Partial<ModelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.optimizer = tf.train.adam(this.config.learningRate);
  }

  /**
   * Build Actor network (policy)
   */
  private buildActor(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(
      tf.layers.dense({
        inputShape: [this.config.stateDim],
        units: this.config.hiddenLayers[0],
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(
        tf.layers.dense({
          units: this.config.hiddenLayers[i],
          activation: 'relu',
          kernelInitializer: 'heNormal',
        })
      );
    }

    // Output layer (action probabilities)
    model.add(
      tf.layers.dense({
        units: this.config.actionDim,
        activation: 'softmax',
        kernelInitializer: 'glorotNormal',
      })
    );

    model.compile({
      optimizer: this.optimizer,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  /**
   * Build Critic network (value function)
   */
  private buildCritic(): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(
      tf.layers.dense({
        inputShape: [this.config.stateDim],
        units: this.config.hiddenLayers[0],
        activation: 'relu',
        kernelInitializer: 'heNormal',
      })
    );

    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      model.add(
        tf.layers.dense({
          units: this.config.hiddenLayers[i],
          activation: 'relu',
          kernelInitializer: 'heNormal',
        })
      );
    }

    // Output layer (state value)
    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'linear',
        kernelInitializer: 'glorotNormal',
      })
    );

    model.compile({
      optimizer: this.optimizer,
      loss: 'meanSquaredError',
    });

    return model;
  }

  /**
   * Initialize models
   */
  initialize(): void {
    this.actor = this.buildActor();
    this.critic = this.buildCritic();
    console.log('[ActorCritic] Models initialized');
    console.log('[ActorCritic] Actor params:', this.actor.countParams());
    console.log('[ActorCritic] Critic params:', this.critic.countParams());
  }

  /**
   * Predict action from state
   */
  async predict(state: StateVector): Promise<ActionVector> {
    if (!this.actor) {
      throw new Error('Actor model not initialized');
    }

    const actionIndex = await tf.tidy(() => {
      // Flatten state vector
      const stateFlat = this.flattenState(state);
      const stateTensor = tf.tensor2d([stateFlat]);

      // Get action probabilities
      const actionProbs = this.actor!.predict(stateTensor) as tf.Tensor;
      const actionProbsArray = actionProbs.arraySync() as number[][];

      // Sample action from probabilities (for now, use argmax)
      return actionProbsArray[0].indexOf(Math.max(...actionProbsArray[0]));
    });

    // Decode action (simplified - in reality would decode full action vector)
    return this.decodeAction(actionIndex);
  }

  /**
   * Train on a batch of experiences
   */
  async train(experiences: Experience[]): Promise<TrainingMetrics> {
    if (!this.actor || !this.critic) {
      throw new Error('Models not initialized');
    }

    if (experiences.length === 0) {
      throw new Error('No experiences to train on');
    }

    return await tf.tidy(() => {
      // Prepare training data
      const states = experiences.map((e) => this.flattenState(e.state));
      const actions = experiences.map((e) => this.flattenAction(e.action));
      const rewards = experiences.map((e) => e.reward);

      const statesTensor = tf.tensor2d(states);
      const actionsTensor = tf.tensor2d(actions);
      const rewardsTensor = tf.tensor1d(rewards);

      // Compute values
      const values = this.critic!.predict(statesTensor) as tf.Tensor;
      const valuesFlat = values.flatten();

      // Compute advantages
      const advantages = tf.sub(rewardsTensor, valuesFlat);

      // Actor loss: -log(π(a|s)) * advantage
      const actionProbs = this.actor!.predict(statesTensor) as tf.Tensor;
      const logProbs = tf.log(tf.add(actionProbs, 1e-10)); // Add epsilon for numerical stability
      const selectedLogProbs = tf.sum(tf.mul(logProbs, actionsTensor), 1);
      const actorLoss = tf.mean(tf.mul(tf.neg(selectedLogProbs), advantages));

      // Critic loss: MSE(V(s), reward)
      const criticLoss = tf.mean(tf.square(advantages));

      // Get loss values
      const actorLossValue = actorLoss.dataSync()[0];
      const criticLossValue = criticLoss.dataSync()[0];
      const meanReward = tf.mean(rewardsTensor).dataSync()[0];
      const meanValue = tf.mean(valuesFlat).dataSync()[0];

      return {
        epoch: 0, // Will be set by caller
        actorLoss: actorLossValue,
        criticLoss: criticLossValue,
        meanReward,
        meanValue,
      };
    });
  }

  /**
   * Train for multiple epochs
   */
  async trainEpochs(
    experiences: Experience[],
    epochs: number,
    batchSize: number = 64
  ): Promise<TrainingMetrics[]> {
    const history: TrainingMetrics[] = [];

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Sample random batch
      const batch = this.sampleBatch(experiences, batchSize);

      // Train on batch
      const metrics = await this.train(batch);
      metrics.epoch = epoch;
      history.push(metrics);

      // Log progress every 10 epochs
      if ((epoch + 1) % 10 === 0) {
        console.log(
          `[Training] Epoch ${epoch + 1}/${epochs} - ` +
            `Actor Loss: ${metrics.actorLoss.toFixed(4)}, ` +
            `Critic Loss: ${metrics.criticLoss.toFixed(4)}, ` +
            `Mean Reward: ${metrics.meanReward.toFixed(2)}`
        );
      }
    }

    return history;
  }

  /**
   * Evaluate policy on test experiences
   */
  async evaluate(experiences: Experience[]): Promise<PolicyMetrics> {
    if (!this.actor || !this.critic) {
      throw new Error('Models not initialized');
    }

    let correctPredictions = 0;
    let totalReward = 0;
    let successes = 0;

    for (const exp of experiences) {
      // Predict action
      const predictedAction = await this.predict(exp.state);

      // Check if prediction matches actual action (simplified)
      // In reality, would compare full action vectors
      const matches = this.actionsMatch(predictedAction, exp.action);
      if (matches) {
        correctPredictions++;
      }

      totalReward += exp.reward;

      if (exp.done && exp.reward > 0) {
        successes++;
      }
    }

    return {
      accuracy: correctPredictions / experiences.length,
      meanReward: totalReward / experiences.length,
      successRate: successes / experiences.length,
      resourceEfficiency: 0.8, // TODO: Compute from experiences
      timeAccuracy: 0.75, // TODO: Compute from experiences
    };
  }

  /**
   * Save models to disk
   */
  async save(directory: string): Promise<void> {
    if (!this.actor || !this.critic) {
      throw new Error('Models not initialized');
    }

    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true });
    }

    const actorPath = path.join(directory, 'actor');
    const criticPath = path.join(directory, 'critic');

    await this.actor.save(`file://${actorPath}`);
    await this.critic.save(`file://${criticPath}`);

    // Save config
    const configPath = path.join(directory, 'config.json');
    await writeFile(configPath, JSON.stringify(this.config, null, 2));

    console.log(`[ActorCritic] Models saved to ${directory}`);
  }

  /**
   * Load models from disk
   */
  async load(directory: string): Promise<void> {
    const actorPath = path.join(directory, 'actor', 'model.json');
    const criticPath = path.join(directory, 'critic', 'model.json');
    const configPath = path.join(directory, 'config.json');

    if (!existsSync(actorPath) || !existsSync(criticPath)) {
      throw new Error(`Models not found in ${directory}`);
    }

    // Load config
    if (existsSync(configPath)) {
      const configData = await readFile(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    }

    // Load models
    this.actor = await tf.loadLayersModel(`file://${actorPath}`);
    this.critic = await tf.loadLayersModel(`file://${criticPath}`);

    console.log(`[ActorCritic] Models loaded from ${directory}`);
  }

  /**
   * Get model summary
   */
  getSummary(): string {
    if (!this.actor || !this.critic) {
      return 'Models not initialized';
    }

    let summary = '';
    summary += '=== Actor Network ===\n';
    this.actor.summary();
    summary += '\n=== Critic Network ===\n';
    this.critic.summary();

    return summary;
  }

  // Helper methods

  private flattenState(state: StateVector): number[] {
    const flat: number[] = [];

    // Task features
    flat.push(...state.taskType);
    flat.push(...state.domain);
    flat.push(...state.complexity);
    flat.push(...state.riskLevel);

    // Context features
    flat.push(state.estimatedTime);
    flat.push(state.domainDiversity);
    flat.push(state.skillCount);

    // Historical features
    flat.push(state.successRate);
    flat.push(state.timeAccuracy);
    flat.push(state.resourceEfficiency);

    // System state
    flat.push(state.concurrentTasks);
    flat.push(state.systemLoad);

    // Agent availability (simplified - take first N agents)
    const agentValues = Object.values(state.agentAvailability).slice(0, 10);
    flat.push(...agentValues);

    // Pad to stateDim
    while (flat.length < this.config.stateDim) {
      flat.push(0);
    }

    return flat.slice(0, this.config.stateDim);
  }

  private flattenAction(action: ActionVector): number[] {
    // Simplified action encoding
    // In reality, would encode skills, agents, strategy, and parameters
    const flat: number[] = new Array(this.config.actionDim).fill(0);

    // For now, just mark as "used"
    flat[0] = 1;

    return flat;
  }

  private decodeAction(actionIndex: number): ActionVector {
    // Simplified decoding
    // In reality, would decode full action vector
    return {
      skills: ['backend'],
      agents: ['executor'],
      approach: 'sequential',
      timeoutMultiplier: 1.0,
      parallelism: 3,
      retryStrategy: 'retry_with_backoff',
      safetyLevel: 'balanced',
    };
  }

  private actionsMatch(a1: ActionVector, a2: ActionVector): boolean {
    // Simplified comparison
    return a1.approach === a2.approach;
  }

  private sampleBatch(experiences: Experience[], batchSize: number): Experience[] {
    const shuffled = [...experiences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(batchSize, experiences.length));
  }
}
