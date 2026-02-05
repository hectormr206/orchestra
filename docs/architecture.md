# Orchestra Architecture

## System Architecture

Orchestra is designed as a **multi-agent orchestration system** with automatic fallback chains and recovery capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI / TUI                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Agent Chain with Optimized Model Hierarchy       │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │   │
│  │  │Architect│→ │Executor│→ │Auditor │  │Consultant│ │   │
│  │  │ Kimi k2.5│ │GLM-4.7 │  │Gemini 3│  │GPT-5.2  │ │   │
│  │  │ Gemini 3 │ │ Kimi   │  │ Codex  │  │ Kimi   │ │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │   │
│  │                                                       │   │
│  │  Cost Optimization: GLM-4.7 primary, Kimi fallback   │   │
│  │  Context Compaction: Auto-retry on CONTEXT_EXCEEDED  │   │
│  │  Model Performance: Token/cost/latency tracking      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Execution Modes:                                           │
│  - Sequential: Phases execute one after another              │
│  - Parallel: Files processed concurrently (maxConcurrency)    │
│  - Pipeline: Execute and audit files simultaneously          │
│  - Watch: Auto-reexecute on file changes                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Manager                            │
│  - Session persistence in `.orchestra/`                     │
│  - Checkpoints for recovery                                 │
│  - Agent status tracking                                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Orchestrator

**File:** `src/orchestrator/Orchestrator.ts`

The Orchestrator is the main coordinator that:

1. **Runs the Architect Agent** - Creates implementation plan
2. **Gets User Approval** - Interactive plan review (unless autoApprove)
3. **Runs the Executor Agent** - Generates code
4. **Runs the Auditor Agent** - Reviews code quality
5. **Iterates if Issues Found** - Fix with Consultant or re-audit
6. **Optional Tests** - Run test framework
7. **Optional Git Commit** - Conventional commits

#### Agent Flow (Optimized Model Hierarchy)

```
User Task
    ↓
🏗️  Architect (Kimi k2.5 → Gemini 3 Pro)
    → Creates plan with Agent Swarm
    → Cost: ~$0.30/M tokens
    ↓
User Approval
    ↓
⚡ Executor (GLM-4.7 → Kimi k2.5)
    → Generates code (most economical)
    → Cost: ~$0.05/M tokens
    ↓
🔍 Auditor (Gemini 3 Pro → GPT-5.2-Codex)
    → Reviews code quality (massive context)
    → Cost: ~$0.15/M tokens
    ↓
Issues?
    ├─ No → Tests → Git Commit → Done
    └─ Yes → 🧠 Consultant (GPT-5.2-Codex → Kimi k2.5)
                → Surgical algorithmic help
                → Cost: ~$0.50/M tokens (use sparingly)
                ↓
                Fix → Audit Again → Loop (max iterations)
```

**Cost Optimization:**
- Target: < $0.10 per session for typical tasks
- GLM-4.7 handles 80% of execution work
- Expensive models (GPT-5.2-Codex) reserved for complex issues
- Automatic fallback on rate limits (RATE_LIMIT_429)
- Context compaction on CONTEXT_EXCEEDED errors

### 2. Adapter System

**Directory:** `src/adapters/`

All adapters implement the `Adapter` interface:

```typescript
interface Adapter {
  execute(options: ExecuteOptions): Promise<AgentResult>;
  isAvailable(): Promise<boolean>;
  getInfo(): { name: string; model: string; provider: string };
}
```

#### Available Adapters

- **KimiAdapter** - Moonshot Kimi k2.5 (Agent Swarm, 200K context, bilingual)
- **GLMAdapter** - Zhipu GLM-4.7 via z.ai (most economical, fast execution)
- **GeminiAdapter** - Google Gemini 3 Pro (massive context window)
- **CodexAdapter** - OpenAI GPT-5.2-Codex (surgical use, algorithmic problems)
- **ClaudeAdapter** - Anthropic Claude Opus 4.5 (premium quality)
- **FallbackAdapter** - Chains multiple adapters with automatic fallback

**New Features (All Adapters):**
- ✅ Automatic CONTEXT_EXCEEDED detection and retry
- ✅ Context compaction with 5-strategy approach (50-70% reduction)
- ✅ RATE_LIMIT_429 detection with fallback rotation
- ✅ Bilingual error detection (English + Chinese)
- ✅ Model performance tracking (tokens, latency, cost)

#### Optimized Fallback Chains

```typescript
// Architect: Planning with Agent Swarm
const architectChain = new FallbackAdapter([
  new KimiAdapter(),           // Primary: Agent Swarm
  new GeminiAdapter(),         // Fallback: Massive context
]);

// Executor: Most economical
const executorChain = new FallbackAdapter([
  new GLMAdapter(),            // Primary: Lowest cost
  new KimiAdapter(),           // Fallback: Good value
]);

// Auditor: Thorough review
const auditorChain = new FallbackAdapter([
  new GeminiAdapter(),         // Primary: Best for review
  new CodexAdapter(),          // Fallback: Deep analysis
]);

// Consultant: Algorithmic expertise
const consultantChain = new FallbackAdapter([
  new CodexAdapter(),          // Primary: Best for algorithms
  new KimiAdapter(),           // Fallback: Good alternative
]);
```

### 3. State Management

**File:** `src/utils/StateManager.ts`

The StateManager handles:

- Session initialization and persistence
- Phase tracking (init → planning → executing → etc.)
- Agent status updates
- Checkpoint creation
- Error tracking
- Resume capability

#### Session State

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

### 4. Execution Modes

#### Sequential Mode (default)

Files are executed one by one through the agent chain:

```
File 1: Architect → Executor → Auditor → [Loop if issues]
File 2: Architect → Executor → Auditor → [Loop if issues]
File 3: Architect → Executor → Auditor → [Loop if issues]
```

#### Parallel Mode

Multiple files are processed concurrently:

```
Worker 1: File 1 → Executor → Auditor
Worker 2: File 2 → Executor → Auditor
Worker 3: File 3 → Executor → Auditor
```

#### Pipeline Mode

Execution and auditing happen simultaneously:

```
File 1: Executor → Immediately audited by Auditor
File 2: Executor → Immediately audited by Auditor
File 3: Executor → Immediately audited by Auditor
```

This provides better performance for multi-file tasks.

### 5. Recovery Mode

When the normal audit loop fails, Recovery Mode activates:

1. **Syntax Validation** - Check for incomplete code blocks
2. **Incomplete Code Detection** - Detect missing closing braces
3. **Fix Attempts** - Use Consultant agent to fix issues
4. **Timeout Protection** - Adaptive timeout based on complexity
5. **Auto-Revert** - Revert changes if all recovery attempts fail

#### Recovery Flow

```
Normal Audit Fails
    ↓
Enter Recovery Mode
    ↓
Syntax Check
    ↓
Detect Incomplete Code
    ↓
Consultant Fixes Code
    ↓
Validate Syntax
    ↓
Done? → No → Retry (up to maxRecoveryAttempts)
    │
    └→ Yes → Save File
```

### 6. Context Compaction System

**File:** `src/adapters/contextCompaction.ts`

When context limits are exceeded, Orchestra automatically compacts prompts using a 5-strategy approach:

#### Compaction Strategies

1. **Whitespace Removal** - Collapses excessive whitespace while preserving structure
2. **Repeated Phrase Detection** - Removes duplicate sentences and instructions
3. **Code Block Summarization** - Summarizes code blocks > 500 chars
4. **Verbose Phrase Removal** - Strips common verbose patterns
5. **Aggressive Summarization** - Ranks sentences by importance, keeps only essential content

#### Automatic Retry Flow

```typescript
async execute(options, retryCount = 0) {
  // Execute request
  const result = await runCommand(options);

  // Detect CONTEXT_EXCEEDED
  if (isContextExceededError(result.stderr)) {
    if (retryCount < 2) {
      // Compact prompt
      const compacted = compactPrompt(options.prompt);
      console.log(`Compacted: ${compacted.reductionPercent}% reduction`);

      // Retry with compacted prompt
      return await this.execute({
        ...options,
        prompt: compacted.compactedPrompt
      }, retryCount + 1);
    }
  }

  return result;
}
```

**Features:**
- ✅ 50-70% typical reduction in prompt size
- ✅ Preserves action-oriented sentences and key terms
- ✅ Maximum 2 retry attempts to prevent loops
- ✅ Bilingual error detection (English + Chinese)
- ✅ Proactive checking with `wouldExceedContext()`

### 7. Model Performance Tracking

**File:** `src/utils/StateManager.ts`

The system now tracks detailed performance metrics for each model:

#### ModelUsage Interface

```typescript
interface ModelUsage {
  modelId: string;                // "glm-4.7", "kimi-k2.5", etc.
  provider: string;               // "zai", "moonshot", "openai"
  tokensUsed: number;             // Tokens consumed
  latencyMs: number;              // Response time
  success: boolean;               // Execution success
  errorCode?: 'RATE_LIMIT_429' | 'CONTEXT_EXCEEDED' | 'TIMEOUT' | 'API_ERROR';
  errorMessage?: string;          // Detailed error
  timestamp: string;              // ISO timestamp
  estimatedCost?: number;         // Cost in USD
}
```

#### GlobalMetrics Tracking

```typescript
interface GlobalMetrics {
  totalCostEstimate: number;      // Total session cost
  startTime: number;              // Session start
  endTime?: number;               // Session end
  totalTokens: number;            // All tokens used
  totalAttempts: number;          // All API calls
  successfulAttempts: number;     // Successful calls
  failedAttempts: number;         // Failed calls
  fallbackRotations: number;      // Fallback switches
  avgLatencyMs: number;           // Average response time
}
```

#### TaskStep Tracking

Each workflow step is tracked with complete history:

```typescript
interface TaskStep {
  id: string;                     // Unique identifier
  agentRole: 'architect' | 'executor' | 'auditor' | 'consultant';
  status: 'pending' | 'running' | 'completed' | 'failed';
  filePath?: string;              // File being processed
  attempts: ModelUsage[];         // All attempts (including retries)
  outputHash?: string;            // Output deduplication
  startTime?: string;             // Start timestamp
  endTime?: string;               // End timestamp
  duration?: number;              // Duration in ms
}
```

**Benefits:**
- 📊 Real-time cost monitoring
- 🎯 Model performance comparison
- 🔄 Fallback pattern analysis
- 🧠 Reinforcement learning data for optimization
- 📈 Session analytics and reporting

## Data Flow

### Plan Creation Phase

```
User Task
    ↓
Architect Agent (with ai-core skills if available)
    ↓
Plan saved to `.orchestra/plan.md`
    ↓
User Approval (if not autoApprove)
```

### Code Generation Phase

```
Plan from plan.md
    ↓
Extract files to create/modify
    ↓
For each file (or in parallel):
    ├─ Executor Agent generates code
    ├─ Save to file system
    └─ Audit Agent reviews quality
```

### Iteration Phase

```
Audit finds issues
    ↓
Fix needed?
    ├─ Yes → Consultant Agent generates fix
    ├─ Apply fix to code
    └─ Re-audit
    └─ No → Continue to next file
```

## Key Design Decisions

### 1. Agent Specialization

Each agent has a specific role:

- **Architect**: Creates structured plans, not code
- **Executor**: Writes code following the plan
- **Auditor**: Reviews code quality and correctness
- **Consultant**: Helps with algorithmic problems

### 2. Fallback Strategy

Automatic fallback based on:
- Rate limit errors (HTTP 429)
- Connection failures
- Invalid API responses

### 3. State Persistence

All state is persisted after each operation:
- Survives crashes
- Enables resume functionality
- Tracks progress across iterations

### 4. Multi-Modal Execution

Supports multiple execution modes:
- **Sequential**: Safe, predictable execution
- **Parallel**: Faster for independent files
- **Pipeline**: Best performance for multi-file tasks
- **Watch**: Development workflow with auto-reload

## Extension Points

### Plugin System

Plugins can hook into the orchestration lifecycle:

```typescript
// Available hooks
'before-init', 'after-init',
'before-plan', 'after-plan',
'before-execute', 'after-execute',
'before-audit', 'after-audit',
'on-complete', 'on-error',
'on-file-change'
```

### Custom Prompts

Agents can be configured with custom prompts:

```typescript
{
  customPrompts: {
    architect: 'Focus on security best practices',
    executor: 'Write clean, documented code',
    auditor: 'Check for OWASP Top 10',
  }
}
```

## Performance Considerations

### Concurrency Control

- `maxConcurrency` limits parallel operations
- Prevents resource exhaustion
- Configurable based on system capabilities

### Caching

- Response caching reduces API calls
- `ResultCache` stores successful results
- Configurable TTL for cache entries

### Rate Limiting

- Automatic fallback on rate limits
- Retry-after header respected
- Adaptive request timing

## Security Considerations

### API Keys

- Stored in environment variables
- Never logged or committed
- Per-adapter configuration

### Code Validation

- Syntax validation before applying changes
- Multiple validation iterations
- Recovery mode for failed fixes

### Git Integration

- Conventional commit messages
- Configurable commit templates
- Optional auto-commit after success

## Monitoring & Observability

### Metrics Collection

- Execution time tracking per agent
- Token usage statistics
- Success/failure rates
- Recovery success rates

### Structured Logging

- JSON-formatted logs
- Log levels: info, warning, error
- Timestamps on all log entries

### Performance Profiling

- Built-in profiler with CPU/memory metrics
- Bottleneck detection
- Optimization recommendations

## Error Handling

### Graceful Degradation

- Single file failure doesn't stop entire job
- Partial success reporting
- Clear error messages with context

### Recovery Strategies

1. **Retry with different agent** - Automatic fallback
2. **Syntax fixes** - Consultant agent assistance
3. **Recovery mode** - Specialized error recovery
4. **Auto-revert** - Rollback on persistent failures

## Testing Strategy

### Unit Tests

- Adapter mocking with controlled responses
- StateManager persistence testing
- Framework detection validation

### Integration Tests

- End-to-end orchestration flow
- Plugin system integration
- CLI command validation

### E2E Tests

- Complete workflows from CLI
- Multiple file scenarios
- Error recovery scenarios

---

## Future Enhancements

### Planned Features

1. **Multi-repo Orchestration** - Coordinate work across multiple repositories
2. **Web Interface** - React-based alternative to TUI
3. **Server Mode** - Remote orchestration via WebSocket
4. **Additional Adapters** - Llama 3, Mistral, etc.
5. **Distributed Caching** - Redis cache across sessions

### Scalability Considerations

- Horizontal scaling via server mode
- Load balancing for multiple orchestrators
- Distributed state management
- Microservice architecture support
