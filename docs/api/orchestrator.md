# Orchestrator API

Detailed API documentation for the `Orchestrator` class - the core orchestration engine.

## Table of Contents

- [Overview](#overview)
- [Constructor](#constructor)
- [Configuration](#configuration)
- [Methods](#methods)
- [Callbacks](#callbacks)
- [Examples](#examples)

---

## Overview

The `Orchestrator` class is the core engine that coordinates multiple AI agents (Architect, Executor, Auditor, Consultant) to perform complex development tasks.

**Key Features:**
- Multi-agent workflow with automatic fallback
- Parallel and sequential file processing
- Persistent session management
- Recovery mode for failed audits
- Git integration
- Plugin system

---

## Constructor

```typescript
import { Orchestrator } from './orchestrator/Orchestrator.js';

const orchestrator = new Orchestrator(config?: OrchestratorConfig);
```

### Config Parameters

```typescript
interface OrchestratorConfig {
  // Execution mode
  parallel?: boolean;           // Process files in parallel (default: false)
  maxConcurrency?: number;      // Max concurrent files in parallel mode (default: 3)
  maxIterations?: number;       // Max audit iterations (default: 10)
  timeout?: number;             // Operation timeout in ms (default: 300000)

  // Recovery
  maxRecoveryAttempts?: number;     // Max recovery attempts (default: 3)
  recoveryTimeout?: number;         // Recovery timeout in ms (default: 600000)
  autoRevertOnFailure?: boolean;    // Auto-revert failed recoveries (default: true)

  // Git integration
  gitCommit?: boolean;             // Auto-commit generated code (default: false)
  commitMessage?: string;          // Commit message template

  // Languages
  languages?: string[];           // Target languages for syntax validation

  // Custom prompts
  customPrompts?: Record<string, string>;

  // Agents
  agents?: AgentConfig;
}
```

---

## Methods

### `orchestrate(task: string, metadata?: Record<string, unknown>): Promise<boolean>`

Main method to orchestrate a development task.

**Parameters:**
- `task`: Natural language description of the task
- `metadata`: Optional metadata (sessionId, tags, etc.)

**Returns:** `true` if task completed successfully, `false` otherwise

**Example:**
```typescript
const success = await orchestrator.orchestate(
  'Create a REST API for user management with authentication',
  { tags: ['api', 'auth'] }
);
```

---

### `orchestrateFromPlan(plan: string, metadata?: Record<string, unknown>): Promise<boolean>`

Orchestrate from a pre-generated plan instead of generating one.

**Parameters:**
- `plan`: Markdown formatted plan
- `metadata`: Optional metadata

**Returns:** `true` if successful

---

### `getStatus(): OrchestratorStatus`

Get current orchestration status.

**Returns:**
```typescript
interface OrchestratorStatus {
  phase: 'idle' | 'planning' | 'executing' | 'auditing' | 'recovery' | 'completed';
  progress: { current: number; total: number };
  sessionId: string | null;
  startTime: number | null;
  endTime: number | null;
}
```

---

### `getPlan(): string | null`

Get the current execution plan.

**Returns:** Plan content as Markdown string or `null`

---

### `pause(): void`

Pause the current orchestration (experimental).

---

### `resume(): Promise<void>`

Resume a paused orchestration.

---

### `cancel(): void`

Cancel the current orchestration.

---

### `generatePlan(task: string): Promise<string>`

Generate a plan for a task without executing.

---

## Callbacks

The Orchestrator supports callbacks for monitoring and customization:

```typescript
const orchestrator = new Orchestrator({
  callbacks: {
    onPhaseStart: (phase, description) => {
      console.log(`Starting ${phase}: ${description}`);
    },
    onFileStart: (file, current, total) => {
      console.log(`Processing ${file} (${current}/${total})`);
    },
    onProgress: (file, progress) => {
      console.log(`Progress: ${progress.percentage}%`);
    },
    onComplete: (result) => {
      console.log(`Orchestration complete: ${result.approved ? 'Success' : 'Failed'}`);
    },
    onError: (type, message) => {
      console.error(`Error [${type}]: ${message}`);
    },
  },
});
```

### Available Callbacks

| Callback | Parameters | Description |
|---------|------------|-------------|
| `onPhaseStart` | (phase, description) | Called when a phase starts |
| `onFileStart` | (file, current, total) | Called when file processing starts |
| `onProgress` | (file, progress) | Called on progress updates |
| `onFileComplete` | (file, success) | Called when file processing completes |
| `onAudit` | (file, result) | Called after file audit |
| `onConsultant` | (file, phase) | Called during consultant phase |
| `onRecoveryStart` | (failedFiles) | Called when recovery mode starts |
| `onRecoveryAttempt` | (attempt, max, remaining) | Called each recovery attempt |
| `onFileReverted` | (file) | Called when a file is reverted |
| `onFileDeleted` | (file) | Called when a file is deleted |
| `onRecoveryComplete` | (success, recovered, failed) | Called when recovery ends |
| `onComplete` | (result) | Called when orchestration completes |
| `onError` | (type, message) | Called on errors |

---

## Examples

### Basic Orchestration

```typescript
const orchestrator = new Orchestrator();

const success = await orchestrator.orchestrate(
  'Add user authentication to the Express app'
);

if (success) {
  console.log('Task completed successfully!');
}
```

### Parallel Processing

```typescript
const orchestrator = new Orchestrator({
  parallel: true,
  maxConcurrency: 5,
});

await orchestrator.orchestate(
  'Refactor all API endpoints to use async/await'
);
```

### With Custom Prompts

```typescript
const orchestrator = new Orchestrator({
  customPrompts: {
    architect: 'You are a senior Python expert.',
    executor: 'Follow PEP 8 style guidelines.',
  },
});
```

### With Callbacks for Monitoring

```typescript
const orchestrator = new Orchestrator({
  callbacks: {
    onPhaseStart: (phase, description) => {
      console.log(`[${phase.toUpperCase()}] ${description}`);
    },
    onProgress: (file, progress) => {
      const bar = '█'.repeat(Math.floor(progress.percentage / 5));
      process.stdout.write(`\r${file}: [${bar}${' '.repeat(20 - Math.floor(progress.percentage / 5))}] ${progress.percentage}%`);
    },
  },
});
```

### With Git Auto-commit

```typescript
const orchestrator = new Orchestrator({
  gitCommit: true,
  commitMessage: 'feat: {task}',
});

await orchestrator.orchestate('Add caching layer');
// Automatically creates: "feat: Add caching layer" commit
```

### Recovery Mode Configuration

```typescript
const orchestrator = new Orchestrator({
  maxRecoveryAttempts: 5,
  recoveryTimeout: 120000, // 2 minutes
  autoRevertOnFailure: true,
});
```

---

## Error Handling

The Orchestrator can fail for several reasons:

1. **Plan rejected by user** - Returns `false`
2. **All audit iterations failed** - Enters recovery mode
3. **Recovery mode failed** - Returns `false` and reverts changes

Always check the return value:

```typescript
const success = await orchestrator.orchestrate(task);

if (!success) {
  console.error('Orchestration failed');
  process.exit(1);
}
```

---

## Advanced Usage

### Multiple Sessions

```typescript
// Session 1
const orchestrator1 = new Orchestrator();
await orchestrator1.orchestrate('Task 1');

// Session 2
const orchestrator2 = new Orchestrator();
await orchestrator2.orchestrate('Task 2');
```

### With State Persistence

The Orchestrator automatically persists state to `.orchestra/` directory. Sessions can be resumed:

```bash
orchestra resume  # Resume last interrupted session
```

### Integration with Plugins

```typescript
// The Orchestrator automatically loads plugins from .orchestra/plugins/
// Plugins receive callbacks via hook functions

// Plugins can enhance behavior:
// - before-plan: Add framework-specific context
// - before-execute: Validate code before execution
// - after-execute: Suggest improvements
// - before-audit: Add custom audit rules
```

---

## Performance Tips

1. **Use parallel mode** for independent files
2. **Adjust maxIterations** based on task complexity
3. **Enable recovery** for complex tasks
4. **Use custom prompts** for better results

---

## See Also

- [Adapters API](./adapters.md)
- [Types Reference](../types.ts)
- [Plugin Development](../guides/plugin-development.md)
