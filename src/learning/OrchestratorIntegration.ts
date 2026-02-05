/**
 * Orchestrator Integration with Learning System
 *
 * This module provides integration hooks between the Orchestrator and Learning System
 */

import type {
  TaskType,
  Domain,
  Complexity,
  RiskLevel,
  ExecutionOutcome,
} from './types.js';
import { getLearningManager } from './LearningManager.js';
import type { MetricsCollector, SessionMetrics } from '../utils/metrics.js';

/**
 * Extract learning context from orchestration session
 */
export interface LearningContext {
  sessionId: string;
  taskId: string;
  task: string;
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
}

/**
 * Infer learning context from task description and session metrics
 */
export function inferLearningContext(
  sessionId: string,
  task: string,
  metrics: SessionMetrics,
  config: {
    parallel?: boolean;
    maxConcurrency?: number;
    timeout?: number;
  }
): LearningContext {
  // Infer task type from task description
  const taskType = inferTaskType(task);

  // Infer domain from task description
  const domain = inferDomain(task);

  // Infer complexity based on metrics
  const complexity = inferComplexity(metrics, task);

  // Infer risk level based on task type and domain
  const riskLevel = inferRiskLevel(taskType, domain);

  // Extract agents used from metrics
  const agentsUsed = extractAgentsUsed(metrics);

  // Infer strategy from configuration
  const strategy = config.parallel ? 'parallel' : 'sequential';

  return {
    sessionId,
    taskId: sessionId, // Use sessionId as taskId
    task,
    taskType,
    domain,
    complexity,
    riskLevel,
    estimatedTime: estimateTime(complexity, metrics.files.length),
    skillsNeeded: inferSkillsNeeded(taskType, domain),
    agentsUsed,
    strategy,
    parameters: {
      timeoutMultiplier: config.timeout ? config.timeout / 300000 : 1.0,
      parallelism: config.maxConcurrency ?? 3,
      retryStrategy: 'retry_with_backoff',
      safetyLevel: 'balanced',
    },
  };
}

/**
 * Extract execution outcome from session metrics
 */
export function extractExecutionOutcome(metrics: SessionMetrics): ExecutionOutcome {
  const agentNames = Object.keys(metrics.agents);
  const resourcesUsed = agentNames.filter((name) => metrics.agents[name].invocations > 0);

  // Calculate total errors
  const totalErrors = agentNames.reduce(
    (sum, name) => sum + metrics.agents[name].failures,
    0
  );

  // Check safety violations (assume none for now, could be enhanced)
  const safetyViolations = false;

  // Calculate quality score based on success rate
  const allAgents = Object.values(metrics.agents);
  const avgSuccessRate =
    allAgents.reduce((sum, agent) => sum + agent.successRate, 0) / allAgents.length;

  const qualityScore = avgSuccessRate / 100;

  return {
    success: metrics.finalStatus === 'completed',
    actualTime: metrics.totalDuration / 60000, // Convert ms to minutes
    resourcesUsed,
    minimumResources: calculateMinimumResources(metrics),
    errorCount: totalErrors,
    userModifications: 0, // TODO: Track this in future
    safetyViolations,
    qualityScore,
    testsPassed: metrics.testsRun && (metrics.testsFailed ?? 0) === 0,
  };
}

/**
 * Collect experience after orchestration completes
 */
export async function collectExperienceFromOrchestration(
  task: string,
  metrics: SessionMetrics,
  config: {
    parallel?: boolean;
    maxConcurrency?: number;
    timeout?: number;
  }
): Promise<void> {
  const learningManager = getLearningManager();

  // Skip if learning is disabled
  if (learningManager.getMode() === 'disabled') {
    return;
  }

  try {
    // Infer context
    const context = inferLearningContext(metrics.sessionId, task, metrics, config);

    // Extract outcome
    const outcome = extractExecutionOutcome(metrics);

    // Collect experience
    await learningManager.getCollector().collectExperience(context, outcome);

    console.log(`[Learning] Experience collected for task: ${task.slice(0, 50)}...`);
  } catch (error) {
    console.error(`[Learning] Failed to collect experience: ${error}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function inferTaskType(task: string): TaskType {
  const taskLower = task.toLowerCase();

  if (taskLower.includes('bug') || taskLower.includes('fix') || taskLower.includes('error')) {
    return 'bug';
  }
  if (taskLower.includes('refactor') || taskLower.includes('reorganiz')) {
    return 'refactor';
  }
  if (taskLower.includes('test') || taskLower.includes('testing')) {
    return 'test';
  }
  if (taskLower.includes('document') || taskLower.includes('readme')) {
    return 'docs';
  }
  if (taskLower.includes('review') || taskLower.includes('audit')) {
    return 'review';
  }
  if (taskLower.includes('deploy') || taskLower.includes('release')) {
    return 'deploy';
  }
  if (taskLower.includes('security') || taskLower.includes('auth') || taskLower.includes('permission')) {
    return 'security';
  }
  if (taskLower.includes('performance') || taskLower.includes('optim') || taskLower.includes('speed')) {
    return 'performance';
  }
  if (taskLower.includes('architecture') || taskLower.includes('design')) {
    return 'architecture';
  }
  if (taskLower.includes('database') || taskLower.includes('schema') || taskLower.includes('migration')) {
    return 'database';
  }
  if (taskLower.includes('maintenance') || taskLower.includes('clean')) {
    return 'maintenance';
  }

  // Default to feature
  return 'feature';
}

function inferDomain(task: string): Domain {
  const taskLower = task.toLowerCase();

  if (taskLower.includes('frontend') || taskLower.includes('ui') || taskLower.includes('component')) {
    return 'frontend';
  }
  if (taskLower.includes('backend') || taskLower.includes('api') || taskLower.includes('server')) {
    return 'backend';
  }
  if (taskLower.includes('database') || taskLower.includes('sql') || taskLower.includes('query')) {
    return 'database';
  }
  if (taskLower.includes('devops') || taskLower.includes('docker') || taskLower.includes('ci/cd')) {
    return 'devops';
  }
  if (taskLower.includes('mobile') || taskLower.includes('ios') || taskLower.includes('android')) {
    return 'mobile';
  }
  if (taskLower.includes('ai') || taskLower.includes('ml') || taskLower.includes('machine learning')) {
    return 'ai-ml';
  }
  if (taskLower.includes('security') || taskLower.includes('auth')) {
    return 'security';
  }
  if (taskLower.includes('test') || taskLower.includes('testing')) {
    return 'testing';
  }
  if (taskLower.includes('architect') || taskLower.includes('design')) {
    return 'architecture';
  }

  // Default to backend
  return 'backend';
}

function inferComplexity(metrics: SessionMetrics, task: string): Complexity {
  const fileCount = metrics.files.length;
  const totalIterations = metrics.iterations;
  const totalTime = metrics.totalDuration / 60000; // minutes

  // Simple heuristic based on metrics
  if (fileCount <= 2 && totalIterations <= 2 && totalTime < 30) {
    return 'simple';
  }
  if (fileCount <= 5 && totalIterations <= 5 && totalTime < 120) {
    return 'medium';
  }
  return 'complex';
}

function inferRiskLevel(taskType: TaskType, domain: Domain): RiskLevel {
  // High risk tasks
  if (
    taskType === 'deploy' ||
    taskType === 'security' ||
    taskType === 'database' ||
    domain === 'security' ||
    domain === 'database'
  ) {
    return 'high';
  }

  // Medium risk tasks
  if (
    taskType === 'refactor' ||
    taskType === 'performance' ||
    taskType === 'architecture' ||
    domain === 'backend'
  ) {
    return 'medium';
  }

  // Low risk tasks
  return 'low';
}

function estimateTime(complexity: Complexity, fileCount: number): string {
  const baseTime = {
    simple: 15,
    medium: 60,
    complex: 120,
  }[complexity];

  const totalMinutes = baseTime + fileCount * 5;

  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  }
  return `${Math.round(totalMinutes / 60)} hours`;
}

function inferSkillsNeeded(taskType: TaskType, domain: Domain): string[] {
  const skills: string[] = [];

  // Add domain skills
  skills.push(domain);

  // Add task-specific skills
  switch (taskType) {
    case 'test':
      skills.push('testing');
      break;
    case 'security':
      skills.push('security');
      break;
    case 'performance':
      skills.push('performance');
      break;
    case 'architecture':
      skills.push('architecture');
      break;
    case 'docs':
      skills.push('documentation');
      break;
  }

  return skills;
}

function extractAgentsUsed(metrics: SessionMetrics): string[] {
  return Object.keys(metrics.agents).filter(
    (name) => metrics.agents[name].invocations > 0
  );
}

function calculateMinimumResources(metrics: SessionMetrics): number {
  // Heuristic: minimum resources is the number of agents that succeeded
  const successfulAgents = Object.values(metrics.agents).filter(
    (agent) => agent.successes > 0
  ).length;

  return Math.max(1, successfulAgents);
}
