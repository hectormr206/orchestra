/**
 * Tipos base para el Meta-Orchestrator
 */

export interface OrchestratorConfig {
  orchestraDir: string;
  aiCorePath: string;
  timeout: number;
  maxIterations: number;
  /** Skip plan approval and execute automatically */
  autoApprove: boolean;
  /** Enable parallel file processing */
  parallel: boolean;
  /** Maximum concurrent file operations (default: 3) */
  maxConcurrency: number;
  /** Enable pipeline mode: audit files as they complete execution */
  pipeline: boolean;
  /** Enable watch mode: re-run on file changes */
  watch: boolean;
  /** Patterns to watch (glob patterns, default: files from plan) */
  watchPatterns: string[];
  /** Run tests after code generation */
  runTests: boolean;
  /** Test command to execute (default: auto-detect) */
  testCommand: string;
  /** Auto-commit after successful completion */
  gitCommit: boolean;
  /** Commit message template */
  commitMessage: string;
  /** Languages to validate syntax (default: auto-detect) */
  languages: SupportedLanguage[];
  /** Custom prompts for agents */
  customPrompts: CustomPrompts;
  /** Maximum recovery attempts per file when normal audit loop fails (default: 3) */
  maxRecoveryAttempts: number;
  /** Timeout for recovery mode in milliseconds (default: 600000 = 10 min) */
  recoveryTimeout: number;
  /** Auto-revert failed files when recovery mode fails (default: true) */
  /** Auto-revert failed files when recovery mode fails (default: true) */
  autoRevertOnFailure: boolean;
  /** Configuration for specific agents */
  agents: AgentConfig;
}

export interface AgentConfig {
  architect: ModelType[];
  executor: ModelType[];
  auditor: ModelType[];
  consultant: ModelType[];
}

export type ModelType =
  | "Claude"
  | "Claude (GLM 4.7)"
  | "Gemini"
  | "Codex"
  | "Kimi";

/** Custom prompt templates */
export interface CustomPrompts {
  /** Additional context for the architect prompt */
  architect?: string;
  /** Additional context for the executor prompt */
  executor?: string;
  /** Additional context for the auditor prompt */
  auditor?: string;
  /** Additional context for the consultant prompt */
  consultant?: string;
}

/** Supported languages for syntax validation */
export type SupportedLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "json"
  | "yaml";

/** Test execution result */
export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  output: string;
  command: string;
}

/** Syntax validation result */
export interface SyntaxValidationResult {
  file: string;
  language: SupportedLanguage;
  valid: boolean;
  errors: SyntaxError[];
}

export interface SyntaxError {
  line: number;
  column: number;
  message: string;
}

/** Project configuration file (.orchestrarc.json) */
export interface ProjectConfig {
  /** Default task description */
  defaultTask?: string;
  /** Languages used in the project */
  languages?: SupportedLanguage[];
  /** Test configuration */
  test?: {
    command?: string;
    timeout?: number;
    runAfterGeneration?: boolean;
  };
  /** Git configuration */
  git?: {
    autoCommit?: boolean;
    commitMessageTemplate?: string;
    branch?: string;
  };
  /** Execution configuration */
  execution?: {
    parallel?: boolean;
    maxConcurrency?: number;
    maxIterations?: number;
    timeout?: number;
  };
  /** Custom prompts */
  prompts?: {
    architect?: string;
    executor?: string;
    auditor?: string;
  };
  /** TUI-specific settings */
  tui?: {
    autoApprove?: boolean;
    notifications?: boolean;
    cacheEnabled?: boolean;
    // Recovery Mode settings
    maxRecoveryAttempts?: number;
    recoveryTimeoutMinutes?: number;
    autoRevertOnFailure?: boolean;
    // Agent Models
    agents?: AgentConfig;
  };
}

export interface AgentResult {
  success: boolean;
  duration: number;
  outputFile?: string;
  error?: string;
}

export interface SessionState {
  sessionId: string;
  task: string;
  phase: Phase;
  iteration: number;
  startedAt: string;
  lastActivity: string;
  agents: {
    architect: AgentStatus;
    executor: AgentStatus;
    auditor: AgentStatus;
    consultant: AgentStatus;
  };
  checkpoints: Checkpoint[];
  canResume: boolean;
  lastError: string | null;
}

export interface AgentStatus {
  status: "pending" | "in_progress" | "completed" | "failed" | "not_needed";
  duration: number | null;
}

export interface Checkpoint {
  id: string;
  phase: string;
  file: string;
  timestamp: string;
}

export type Phase =
  | "init"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "fixing"
  | "consulting"
  | "auditing"
  | "recovery"
  | "testing"
  | "committing"
  | "completed"
  | "failed"
  | "rejected"
  | "max_iterations";

export interface AdapterConfig {
  command: string;
  timeout: number;
  env: Record<string, string>;
}

export interface ExecuteOptions {
  prompt: string;
  outputFile?: string;
  workingDir?: string;
}

/**
 * Model Usage Tracking
 * Tracks performance metrics for each model attempt
 */
export interface ModelUsage {
  /** Model identifier (e.g., 'glm-4.7', 'gpt-5.2-codex', 'kimi-k2.5') */
  modelId: string;
  /** Provider name (e.g., 'zai', 'openai', 'moonshot', 'google') */
  provider: string;
  /** Number of tokens consumed */
  tokensUsed: number;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Whether the attempt was successful */
  success: boolean;
  /** Error code if failed (e.g., 'RATE_LIMIT_429', 'CONTEXT_EXCEEDED', 'TIMEOUT') */
  errorCode?: 'RATE_LIMIT_429' | 'CONTEXT_EXCEEDED' | 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE';
  /** Error message details */
  errorMessage?: string;
  /** Timestamp of the attempt */
  timestamp: string;
  /** Estimated cost in USD */
  estimatedCost?: number;
}

/**
 * Task Step
 * Represents a single step in the orchestration workflow
 */
export interface TaskStep {
  /** Unique step identifier */
  id: string;
  /** Agent role for this step */
  agentRole: 'architect' | 'executor' | 'auditor' | 'consultant';
  /** Current status of the step */
  status: 'pending' | 'running' | 'completed' | 'failed';
  /** File path if this step operates on a specific file */
  filePath?: string;
  /** All attempts made for this step (including retries and fallbacks) */
  attempts: ModelUsage[];
  /** Hash of the output to detect if code actually changed */
  outputHash?: string;
  /** Start time of the step */
  startTime?: string;
  /** End time of the step */
  endTime?: string;
  /** Total duration in milliseconds */
  duration?: number;
}

/**
 * Global Metrics
 * Tracks overall session metrics
 */
export interface GlobalMetrics {
  /** Total estimated cost in USD */
  totalCostEstimate: number;
  /** Session start timestamp */
  startTime: number;
  /** Session end timestamp */
  endTime?: number;
  /** Total tokens used across all models */
  totalTokens: number;
  /** Total number of model attempts */
  totalAttempts: number;
  /** Number of successful attempts */
  successfulAttempts: number;
  /** Number of failed attempts */
  failedAttempts: number;
  /** Number of fallback rotations */
  fallbackRotations: number;
  /** Average latency in milliseconds */
  avgLatencyMs: number;
}

/**
 * Enhanced Session State with Model Tracking
 * Extends the base SessionState with detailed model usage tracking
 */
export interface EnhancedSessionState extends SessionState {
  /** Workflow steps with model tracking */
  workflow: TaskStep[];
  /** Global session metrics */
  globalMetrics: GlobalMetrics;
  /** Learning mode active */
  learningMode?: 'disabled' | 'shadow' | 'ab_test' | 'production';
}
