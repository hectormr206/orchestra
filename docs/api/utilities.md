# Utilities API Reference

Complete reference for all utility modules in Orchestra.

## Table of Contents

- [State Management](#state-management)
- [Configuration](#configuration)
- [Git Integration](#git-integration)
- [Cache](#cache)
- [Session History](#session-history)
- [Export](#export)
- [Testing](#testing)
- [Validation](#validation)
- [Metrics](#metrics)
- [Notifications](#notifications)
- [Dry Run](#dry-run)
- [Security Audit](#security-audit)
- [Performance Optimization](#performance-optimization)
- [Streaming](#streaming)

---

## State Management

### StateManager

Manages session state persistence to `.orchestra/` directory.

```typescript
import { StateManager } from './utils/StateManager.js';

const stateManager = new StateManager('.orchestra');
await stateManager.init();

// Save agent status
await stateManager.setAgentStatus('architect', 'running');

// Load state
const state = await stateManager.load();

// Create checkpoint
await stateManager.createCheckpoint('plan-approved');

// Clear all state
await stateManager.clear();
```

#### Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize state directory |
| `save<T>(key: string, value: T)` | Save value to state |
| `load<T>(key: string)` | Load value from state |
| `setAgentStatus(agent, status, duration?)` | Update agent status |
| `getAgentStatus(agent)` | Get agent status |
| `createCheckpoint(name)` | Create named checkpoint |
| `getFilePath(filename)` | Get path to state file |
| `clear()` | Clear all state |

---

## Configuration

### configLoader

Load and merge project configuration.

```typescript
import { loadProjectConfig, mergeConfig } from './utils/configLoader.js';

const config = await loadProjectConfig();
const merged = mergeConfig(defaultConfig, config);
```

#### Functions

| Function | Description |
|----------|-------------|
| `loadProjectConfig(cwd?)` | Load `.orchestrarc.json` |
| `mergeConfig(base, override)` | Deep merge configs |

---

## Git Integration

### gitIntegration

Automatic git operations after successful orchestration.

```typescript
import { autoCommit, getGitStatus, createBranch } from './utils/gitIntegration.js';

// Auto-commit with conventional message
const result = await autoCommit({
  message: 'feat: add user authentication',
  addAll: true,
});

// Get git status
const status = await getGitStatus();
if (status.hasChanges) {
  console.log('Uncommitted changes exist');
}

// Create and switch branch
await createBranch('feature/new-auth');
```

---

## Cache

### ResultCache

In-memory caching for adapter responses.

```typescript
import { ResultCache } from './utils/cache.js';

const cache = new ResultCache({
  maxSize: 100,
  ttl: 3600000, // 1 hour
});

// Cache result
await cache.set('prompt-hash', { content: 'response' });

// Get cached result
const result = await cache.get('prompt-hash');

// Clear cache
cache.clear();

// Get stats
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate}%`);
```

---

## Session History

### SessionHistory

Manage historical session data with filtering and statistics.

```typescript
import { SessionHistory } from './utils/sessionHistory.js';

const history = new SessionHistory();

// List sessions
const sessions = await history.list({
  limit: 10,
  status: 'completed',
});

// Get session details
const session = await history.get('session-id');

// Get statistics
const stats = await history.getStats();
console.log(`Total: ${stats.total}, Success: ${stats.completed}`);

// Delete session
await history.delete('session-id');

// Clear all
await history.clear();
```

---

## Export

### ExportManager

Export sessions to various formats.

```typescript
import { ExportManager } from './utils/export.js';

const exporter = new ExportManager();

// Export to Markdown
await exporter.export('session-id', 'markdown', './output.md');

// Export to HTML
await exporter.export('session-id', 'html', './output.html');

// Export to JSON
await exporter.export('session-id', 'json', './output.json');

// Export to PDF
await exporter.exportToPDF('session-id', './output.pdf');
```

---

## Testing

### testRunner

Auto-detect and run tests.

```typescript
import { detectTestFramework, runTests } from './utils/testRunner.js';

// Detect framework
const framework = await detectTestFramework('/project');
// Returns: 'jest' | 'vitest' | 'pytest' | 'go-test' | 'cargo-test' | null

// Run tests
const result = await runTests('/project', {
  framework: 'vitest',
  args: ['--run'],
});

console.log(`Success: ${result.success}, Output: ${result.output}`);
```

---

## Validation

### validators

Syntax validation for multiple languages.

```typescript
import { validateSyntax, detectLanguage } from './utils/validators.js';

// Detect language from file extension
const lang = detectLanguage('script.ts');
// Returns: 'typescript'

// Validate syntax
const result = await validateSyntax('const x = 1', 'typescript');
if (!result.valid) {
  console.error(`Error: ${result.error}`);
}
```

#### Supported Languages

- `typescript` - Validates with TypeScript compiler
- `javascript` - Validates with ESLint/parser
- `python` - Validates with `py_compile`
- `go` - Validates with `go fmt`
- `rust` - Validates with Rust compiler
- `json` - Validates JSON structure
- `yaml` - Validates YAML structure

---

## Metrics

### metrics

Collect and track performance metrics.

```typescript
import { MetricsCollector } from './utils/metrics.js';

const metrics = new MetricsCollector();

// Record metric
metrics.record('api_latency', 150);
metrics.record('memory_usage', 250);

// Get statistics
const stats = metrics.getStats('api_latency');
console.log(`Avg: ${stats.avg}, P95: ${stats.p95}`);

// Reset metrics
metrics.reset('api_latency');

// Get all metrics
const all = metrics.getAll();
```

---

## Notifications

### notifications

Desktop and webhook notifications.

```typescript
import { sendNotification, NotificationConfig } from './utils/notifications.js';

const config: NotificationConfig = {
  desktop: true,
  webhook: 'https://hooks.slack.com/...',
};

await sendNotification('Task completed successfully', config);
```

---

## Dry Run

### dryRun

Analyze tasks without execution.

```typescript
import { analyzeTask } from './utils/dryRun.js';

const analysis = await analyzeTask('Create a REST API');

console.log(`Files to create: ${analysis.files.length}`);
console.log(`Est. duration: ${analysis.estimatedDuration}ms`);
console.log(`Complexity: ${analysis.complexity}`);
```

---

## Security Audit

### SecurityAuditor

OWASP Top 10 security audit.

```typescript
import { SecurityAuditor } from './utils/securityAudit.js';

const auditor = new SecurityAuditor();

// Audit code
const issues = await auditor.audit(code);

// Detect secrets
const secrets = auditor.detectSecrets(code);

// Check for SQL injection
const sqli = auditor.checkSQLInjection(code);

// Generate report
const report = auditor.generateReport(issues, 'markdown');
```

---

## Performance Optimization

### Performance Utilities

See [Performance Guide](../guides/performance.md) for detailed usage.

```typescript
import {
  PromptCache,
  runWithConcurrencyOptimized,
  ObjectPool,
  memoize,
  debounce,
  throttle,
  Lazy,
} from './utils/performanceOptimizer.js';

// Prompt caching
const cache = new PromptCache();
const prompt = cache.getOrCreate(
  () => buildPrompt(task),
  ['architect', task]
);

// Optimized concurrency
const results = await runWithConcurrencyOptimized(
  items,
  processItem,
  maxConcurrency,
  onProgress,
  { progressBatchInterval: 100 }
);

// Memoization
const expensive = memoize(compute, { ttl: 60000 });
```

---

## Streaming

### Streaming Utilities

Stream processing for API responses.

```typescript
import {
  processStream,
  StreamAccumulator,
  transformStream,
  batchStream,
} from './utils/streamingAdapter.js';

// Process stream
const result = await processStream(
  () => api.call(),
  { enabled: true, onChunk: (c) => console.log(c.content) }
);

// Transform stream
const uppercased = transformStream(stream, (s) => s.toUpperCase());

// Batch stream
const batches = batchStream(stream, 10);
```

---

## See Also

- [Orchestrator API](./orchestrator.md)
- [Adapters API](./adapters.md)
- [Performance Guide](../guides/performance.md)
- [Development Guide](../guides/development.md)
