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
}

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
export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'go' | 'rust' | 'json' | 'yaml';

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
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_needed';
  duration: number | null;
}

export interface Checkpoint {
  id: string;
  phase: string;
  file: string;
  timestamp: string;
}

export type Phase =
  | 'init'
  | 'planning'
  | 'awaiting_approval'
  | 'executing'
  | 'fixing'
  | 'consulting'
  | 'auditing'
  | 'testing'
  | 'committing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'max_iterations';

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
