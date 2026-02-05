/**
 * Learning System Types
 *
 * Types for the Actor-Critic reinforcement learning system
 */

/**
 * Task classification types
 */
export type TaskType =
  | 'feature'
  | 'bug'
  | 'refactor'
  | 'test'
  | 'docs'
  | 'review'
  | 'deploy'
  | 'security'
  | 'performance'
  | 'architecture'
  | 'database'
  | 'maintenance'
  | 'optimization';

export type Domain =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'mobile'
  | 'ai-ml'
  | 'security'
  | 'testing'
  | 'architecture';

export type Complexity = 'simple' | 'medium' | 'complex';
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * State representation for RL
 */
export interface StateVector {
  // Task features
  taskType: number[]; // one-hot encoded (13 dims)
  domain: number[]; // one-hot encoded (9 dims)
  complexity: number[]; // ordinal (3 dims)
  riskLevel: number[]; // ordinal (3 dims)

  // Context features (normalized 0-1)
  estimatedTime: number;
  domainDiversity: number;
  skillCount: number;

  // Historical features
  successRate: number;
  timeAccuracy: number;
  resourceEfficiency: number;

  // System state
  concurrentTasks: number;
  systemLoad: number;
  agentAvailability: Record<string, number>;
}

/**
 * Action representation for RL
 */
export interface ActionVector {
  // Resources
  skills: string[];
  agents: string[];

  // Strategy
  approach: 'direct' | 'sequential' | 'parallel' | 'coordinated';

  // Parameters
  timeoutMultiplier: number; // [0.5, 2.0]
  parallelism: number; // [1, 4]
  retryStrategy: 'fail_fast' | 'retry_with_backoff' | 'fallback';
  safetyLevel: 'strict' | 'balanced' | 'permissive';
}

/**
 * Outcome of task execution
 */
export interface ExecutionOutcome {
  success: boolean;
  actualTime: number; // minutes
  resourcesUsed: string[];
  minimumResources?: number;
  errorCount: number;
  userModifications: number;
  safetyViolations: boolean;
  qualityScore?: number;
  testsPassed?: boolean;
}

/**
 * Experience tuple for RL training
 */
export interface Experience {
  state: StateVector;
  action: ActionVector;
  reward: number;
  nextState: StateVector | null;
  done: boolean;
  metadata: ExperienceMetadata;
  timestamp: Date;
}

/**
 * Metadata attached to experience
 */
export interface ExperienceMetadata {
  sessionId: string;
  taskId: string;
  taskType: TaskType;
  domain: Domain;
  complexity: Complexity;
  estimatedTime: string;
  actualTime: number;
  resourcesUsed: string[];
  errorCount: number;
  userModifications: number;
  safetyViolations: boolean;
  confidence: number;
  rewardBreakdown?: Record<string, number>;
}

/**
 * Learning modes
 */
export type LearningMode =
  | 'disabled' // No learning, use rules only
  | 'shadow' // Collect experiences but use rules
  | 'ab_test' // 10% learned, 90% rules
  | 'production'; // 100% learned with fallback

/**
 * Learning configuration
 */
export interface LearningConfig {
  mode: LearningMode;
  experienceBufferSize: number;
  experienceBufferPath: string;
  modelPath?: string;
  confidenceThreshold: number; // Minimum confidence to use learned policy
  abTestRatio?: number; // Percentage for A/B testing (0-1)
  enableMetrics: boolean;
}

/**
 * Reward components for debugging
 */
export interface RewardComponents {
  success: number;
  timeEfficiency: number;
  resourceEfficiency: number;
  quality: number;
  userSatisfaction: number;
  safety: number;
  confidence: number;
  total: number;
}

/**
 * Training metrics
 */
export interface TrainingMetrics {
  epoch: number;
  actorLoss: number;
  criticLoss: number;
  meanReward: number;
  meanValue: number;
  accuracy?: number;
}

/**
 * Policy evaluation metrics
 */
export interface PolicyMetrics {
  accuracy: number;
  meanReward: number;
  successRate: number;
  resourceEfficiency: number;
  timeAccuracy: number;
}
