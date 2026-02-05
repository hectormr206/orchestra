# Orchestra API Documentation

## Overview

Orchestra is a meta-orchestrator for AI development tools. It coordinates multiple AI agents (Claude, Codex, Gemini, GLM) to perform complex development tasks automatically.

**Version:** 0.1.0
**Status:** Development
**License:** MIT

---

## Table of Contents

- [Orchestrator](#orchestrator)
- [Adapters](#adapters)
- [Types](#types)
- [Utilities](#utilities)
- [TUI Components](#tui-components)
- [Plugin System](#plugin-system)

---

## Orchestrator

### `Orchestrator`

Main orchestration engine that coordinates AI agents for task execution.

#### Constructor

```typescript
constructor(config: OrchestratorConfig, callbacks?: OrchestratorCallbacks)
```

**Parameters:**
- `config`: Configuration object for the orchestrator
- `callbacks`: Optional callbacks for lifecycle events

**Example:**

```typescript
const orchestrator = new Orchestrator(
  {
    orchestraDir: '.orchestra',
    aiCorePath: './ai-core',
    timeout: 600000,
    maxIterations: 3,
    autoApprove: false,
    parallel: false,
    maxConcurrency: 3,
    pipeline: false,
    agents: {
      architect: ['Kimi', 'Gemini'],
      executor: ['Claude (GLM 4.7)', 'Kimi'],
      auditor: ['Gemini', 'Codex'],
      consultant: ['Codex', 'Kimi'],
    },
  },
  {
    onPhaseStart: (phase, agent) => console.log(`Starting ${phase} with ${agent}`),
    onPhaseComplete: (phase, agent, result) => console.log(`Completed ${phase}`),
  }
);
```

#### Methods

##### `run(task: string): Promise<boolean>`

Execute a complete orchestration task.

**Parameters:**
- `task`: Task description string

**Returns:** `true` if successful, `false` otherwise

**Example:**

```typescript
const success = await orchestrator.run('Create a user authentication system');
```

##### `runPipeline(task: string): Promise<boolean>`

Execute in pipeline mode (execute and audit simultaneously).

**Parameters:**
- `task`: Task description string

**Returns:** `true` if successful, `false` otherwise

##### `resume(): Promise<boolean>`

Resume an interrupted session.

**Returns:** `true` if successful, `false` otherwise

##### `clean(): Promise<void>`

Clear current session data.

##### `doctor(): Promise<boolean>`

Verify environment and dependencies.

**Returns:** `true` if environment is valid, `false` otherwise

---

## Adapters

### `Adapter`

Interface that all AI provider adapters must implement.

#### Methods

##### `execute(options: ExecuteOptions): Promise<AgentResult>`

Execute a prompt with the AI provider.

**Parameters:**
- `options`: Execution options containing prompt and optional outputFile/workingDir

**Returns:** Agent result with success status, content, and duration

##### `isAvailable(): Promise<boolean>`

Check if the adapter is available (API key configured, service reachable).

**Returns:** `true` if available, `false` otherwise

##### `getInfo(): { name: string; model: string; provider: string }`

Get adapter information.

**Returns:** Adapter metadata

### `FallbackAdapter`

Manages fallback chains between multiple adapters.

#### Constructor

```typescript
constructor(adapters: Adapter[], callbacks?: FallbackAdapterCallbacks)
```

**Parameters:**
- `adapters`: Array of adapters in priority order
- `callbacks`: Optional callbacks for fallback events

**Example:**

```typescript
const fallback = new FallbackAdapter(
  [
    new CodexAdapter(),
    new GeminiAdapter(),
    new GLMAdapter(),
  ],
  {
    onAdapterFallback: (from, to, reason) => {
      console.log(`Fallback from ${from} to ${to}: ${reason}`);
    },
  }
);
```

---

## Types

### `OrchestratorConfig`

Configuration for the orchestrator.

```typescript
interface OrchestratorConfig {
  orchestraDir: string;
  aiCorePath: string;
  timeout: number;
  maxIterations: number;
  autoApprove: boolean;
  parallel: boolean;
  maxConcurrency: number;
  pipeline: boolean;
  watch: boolean;
  watchPatterns: string[];
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  commitMessage: string;
  languages: SupportedLanguage[];
  customPrompts: CustomPrompts;
  maxRecoveryAttempts: number;
  recoveryTimeout: number;
  autoRevertOnFailure: boolean;
  agents: AgentConfig;
}
```

### `ExecuteOptions`

Options for executing a prompt.

```typescript
interface ExecuteOptions {
  prompt: string;
  outputFile?: string;
  workingDir?: string;
}
```

### `AgentResult`

Result from an adapter execution.

```typescript
interface AgentResult {
  success: boolean;
  duration: number;
  outputFile?: string;
  error?: string;
}
```

### `SessionState`

Current session state.

```typescript
interface SessionState {
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
```

### `Phase`

Orchestration phases.

```typescript
type Phase =
  | "init"
  | "planning"
  | "approving"
  | "executing"
  | "auditing"
  | "fixing"
  | "testing"
  | "committing"
  | "completed"
  | "failed";
```

---

## Utilities

### `StateManager`

Manages session state persistence.

#### Constructor

```typescript
constructor(orchestraDir?: string)
```

#### Methods

##### `init(task: string): Promise<SessionState>`

Initialize a new session.

##### `load(): Promise<SessionState | null>`

Load current session state.

##### `save(state: SessionState): Promise<void>`

Save session state.

##### `setPhase(phase: Phase): Promise<void>`

Update current phase.

##### `setIteration(iteration: number): Promise<void>`

Update current iteration.

##### `setAgentStatus(agent, status, duration?): Promise<void>`

Update agent status.

##### `createCheckpoint(phase: string): Promise<void>`

Create a checkpoint.

##### `setError(error: string): Promise<void>`

Record an error.

##### `canResume(): Promise<boolean>`

Check if session can be resumed.

##### `clear(): Promise<void>`

Clear all session data.

##### `getFilePath(filename: string): string`

Get path for a session file.

### `FrameworkDetector`

Automatically detects project frameworks and technologies.

#### Functions

##### `detectProject(cwd?: string): ProjectDetection`

Detect project frameworks and configuration.

##### `getTestCommand(detection: ProjectDetection): string`

Get recommended test command.

##### `getBuildCommand(detection: ProjectDetection): string | undefined`

Get recommended build command.

##### `getLintCommand(detection: ProjectDetection): string | undefined`

Get recommended lint command.

### `ContextAnalyzer`

Analyzes project structure for multi-file context.

#### Constructor

```typescript
constructor(projectRoot?: string)
```

#### Methods

##### `buildContext(options?: ContextOptions): Promise<ProjectContext>`

Build complete project context with dependency graph.

##### `getFileContext(filePath, options?): Promise<FileContextResult>`

Get context for a specific file including dependencies and dependents.

##### `getMultiFileContext(filePaths, options?): Promise<MultiFileContextResult>`

Get context for multiple files including shared dependencies.

##### `findRelevantFiles(task, options?): Promise<string[]>`

Find files relevant to a task based on keyword analysis.

---

## Plugin System

### `PluginManager`

Manages plugin lifecycle and execution.

#### Constructor

```typescript
constructor(pluginDir?: string)
```

#### Methods

##### `loadPlugin(pluginPath: string): Promise<{ success: boolean; error?: string }>`

Load a plugin from a directory.

##### `unloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }>`

Unload a plugin.

##### `enablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }>`

Enable a plugin.

##### `disablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }>`

Disable a plugin.

##### `executeHook(hookName: PluginHook, context: PluginContext): Promise<HookResult[]>`

Execute a plugin hook.

##### `registerHook(hookName: PluginHook, handler: HookFunction): void`

Register a hook handler.

##### `getStats(): PluginStats`

Get plugin statistics.

### `PluginHook`

Available plugin hooks:

```typescript
type PluginHook =
  | 'before-init'
  | 'after-init'
  | 'before-plan'
  | 'after-plan'
  | 'before-execute'
  | 'after-execute'
  | 'before-audit'
  | 'after-audit'
  | 'before-recovery'
  | 'after-recovery'
  | 'before-test'
  | 'after-test'
  | 'before-commit'
  | 'after-commit'
  | 'on-complete'
  | 'on-error'
  | 'on-file-change';
```

---

## CLI Usage

### Commands

```bash
# Start a new task
orchestra start "Create a user authentication system"

# Resume interrupted session
orchestra resume

# Pipeline mode
orchestra pipeline "Create API endpoints"

# Watch mode
orchestra watch "Add feature"

# Dry run
orchestra dry-run "Analyze codebase"

# Status
orchestra status

# Plan
orchestra plan

# History
orchestra history

# Clean
orchestra clean

# Doctor
orchestra doctor

# Init config
orchestra init

# Validate
orchestra validate

# Detect framework
orchestra detect

# TUI
orchestra tui

# Plugin management
orchestra plugin list
orchestra plugin load --path ./my-plugin
orchestra plugin enable my-plugin
orchestra plugin disable my-plugin

# Security audit
orchestra audit

# Export
orchestra export [session-id]

# Recovery
orchestra recover
```

### Configuration

Create `.orchestrarc.json` in your project root:

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3,
    "maxIterations": 10,
    "timeout": 300000
  },
  "test": {
    "command": "npm test",
    "runAfterGeneration": true,
    "timeout": 120000
  },
  "git": {
    "autoCommit": true,
    "commitMessageTemplate": "feat: {task}"
  },
  "languages": ["typescript", "javascript"],
  "tui": {
    "autoApprove": false,
    "notifications": true,
    "cacheEnabled": true,
    "maxRecoveryAttempts": 3,
    "recoveryTimeoutMinutes": 10,
    "autoRevertOnFailure": true
  }
}
```

---

## Examples

### Basic Usage

```typescript
import { Orchestrator } from './orchestrator/Orchestrator';

const orchestrator = new Orchestrator(
  {
    orchestraDir: '.orchestra',
    aiCorePath: './ai-core',
    timeout: 600000,
    maxIterations: 3,
    agents: {
      architect: ['Kimi', 'Gemini'],
      executor: ['Claude (GLM 4.7)', 'Kimi'],
      auditor: ['Gemini', 'Codex'],
      consultant: ['Codex', 'Kimi'],
    },
  },
  {
    onPhaseStart: (phase, agent) => {
      console.log(`Starting ${phase} phase with ${agent}`);
    },
  }
);

const success = await orchestrator.run('Create a REST API with Node.js and Express');
```

### Using Framework Detection

```typescript
import { detectProject } from './utils/frameworkDetector';

const detection = detectProject();

console.log(`Language: ${detection.language}`);
console.log(`Package Manager: ${detection.packageManager}`);
console.log(`Test Framework: ${detection.testFramework}`);

// Get recommended commands
const testCmd = getTestCommand(detection);
console.log(`Test command: ${testCmd}`);
```

### Using Context Analyzer

```typescript
import { ContextAnalyzer } from './utils/contextAnalyzer';

const analyzer = new ContextAnalyzer();
await analyzer.buildContext();

// Get context for a file
const context = await analyzer.getFileContext('src/utils/helper.ts');
console.log(`Dependencies: ${context.dependencies.map(d => d.path)}`);
console.log(`Dependents: ${context.dependents.map(d => d.path)}`);

// Find files related to a task
const relevantFiles = await analyzer.findRelevantFiles('Add user authentication');
console.log(`Relevant files: ${relevantFiles}`);
```

### Plugin Development

```typescript
import { PluginManager, type PluginManifest } from './plugins/PluginManager';

// Create plugin manifest
const manifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  main: 'index.js',
  hooks: {
    'before-execute': 'beforeExecute',
  },
};

// Create plugin hook
export async function beforeExecute(context: PluginContext) {
  console.log(`About to execute: ${context.task}`);
  return { success: true };
}
```

---

## Contributing

Contributions are welcome! Please see:
- `CONTRIBUTING.md` for contribution guidelines
- `docs/` for detailed documentation
- `examples/` for usage examples

---

## License

MIT License - see LICENSE file for details.
