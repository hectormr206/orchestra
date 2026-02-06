<!-- ============================================================================
     AI-CORE INTEGRATION - CLAUDE CODE
     ============================================================================
     Este proyecto usa ai-core para patrones universales de desarrollo.

     📖 REFERENCIA CENTRAL: ai-core/SUBAGENTS/AGENTS.md
        Contiene: Working Agreements, Subagentes, Skills, Estructura del proyecto

     PRIORIDAD: Las instrucciones de este archivo tienen precedencia sobre ai-core
     ============================================================================ -->

> **Orden de lectura** para Claude Code:
>
> 1. `ai-core/SUBAGENTS/AGENTS.md` ← 📖 Guía central (skills, subagentes, working agreements)
> 2. Este archivo ← Instrucciones específicas de TU proyecto
>
> **Precedencia**: Este archivo > ai-core

---

## Project Overview

**Orchestra** is a Meta-Orchestrator for AI development tools that coordinates multiple AI agents (Claude, Codex, Gemini, GLM) to perform complex development tasks. It provides both a CLI tool and a TUI (Terminal User Interface) for intelligent task automation.

**Status**: Development | **Test Coverage**: Target 100% | **Tech Stack**: TypeScript + React (Ink) + Node.js CLI

---

## Reading Order

1. **CLAUDE.md** (this file) - Claude Code specific guidance
2. **AGENTS.md** - Project-specific AI agent rules and ai-core integration
3. **ai-core/SUBAGENTS/AGENTS.md** - Universal skills, subagents, and patterns
4. **ai-core/SKILLS/{skill}/SKILL.md** - Domain-specific patterns as needed

**Precedence**: This file > AGENTS.md > ai-core patterns

---

## Common Commands

```bash
# Development
npm run build          # Compile TypeScript to dist/
npm run dev           # Run CLI in development mode (tsx)
npm run start         # Run built CLI from dist/
npm run tui           # Start Terminal UI
npm run clean         # Remove dist/ directory

# Testing
npm test              # Run tests (vitest)
npm run test:coverage # Run with coverage report

# Quality
npm run lint          # Run ESLint on src/

# CLI Commands (after build)
orchestra start <task>         # Begin new orchestration
orchestra resume               # Resume interrupted session
orchestra pipeline <task>      # Pipeline execution mode
orchestra watch <task>         # Watch mode with auto-reload
orchestra status              # Show current session status
orchestra plan                # View current execution plan
orchestra clean              # Clear session data
orchestra doctor             # Verify setup and dependencies
orchestra validate           # Validate syntax of generated code
orchestra init               # Create .orchestrarc.json config
orchestra dry-run <task>      # Analyze without execution

# Export & Reporting
orchestra export --format <type>    # Export session (markdown, json, csv, html)
orchestra history                   # Show session history
orchestra history --full-search <q> # Full-text search in all sessions
orchestra history --from <date>     # Filter by date range
orchestra history --stats           # Show statistics
orchestra compare <id1> <id2>       # Compare two sessions
orchestra tui                       # Launch Terminal UI with Analytics
```

---

## Architecture

Orchestra follows a **multi-agent orchestration pattern** with automatic fallback chains:

### Agent Workflow (Optimized Model Hierarchy)

```
User Request
    ↓
🏗️  Architect (Claude via Kimi k2.5 → Gemini 3 Pro)
    → Creates implementation plan with Agent Swarm
    ↓
[Plan Approval]
    ↓
⚡ Executor (GLM-4.7 → Kimi k2.5)
    → Generates code (most economical)
    ↓
🔍 Auditor (Gemini 3 Pro → GPT-5.2-Codex)
    → Reviews code quality (massive context)
    ↓
[Issues Found?] → 🧠 Consultant (GPT-5.2-Codex → Kimi k2.5)
    → Surgical algorithmic help
    ↓
[Loop until approved or max iterations]
    ↓
[Optional] Tests (auto-detected framework)
    ↓
[Optional] Git commit (conventional commits)
```

**Model Rationale:**

| Agent | Primary Model | Cost/M tokens | Rationale | Fallback |
|-------|--------------|---------------|-----------|----------|
| **Architect** | Claude (Kimi k2.5) | $0.30 | Agent Swarm capabilities, 200K context | Gemini 3 Pro |
| **Executor** | Claude (GLM-4.7) | $0.05 | Most economical, fast execution | Claude (Kimi k2.5) |
| **Auditor** | Gemini 3 Pro | $0.15 | Massive context window, thorough review | GPT-5.2-Codex |
| **Consultant** | GPT-5.2-Codex | $0.50 | Surgical use only, best for algorithms | Claude (Kimi k2.5) |

**Cost Optimization Strategy:**
- GLM-4.7 as primary executor minimizes per-session costs
- Kimi k2.5 provides excellent value for planning and fallback
- GPT-5.2-Codex reserved for algorithmic problems only
- Automatic fallback rotation on rate limits or failures

### Execution Modes

- **Sequential**: Standard execution (default)
- **Parallel**: Process multiple files concurrently (configurable)
- **Pipeline**: Execute and audit simultaneously for faster feedback
- **Watch**: Auto-reload on file changes with debouncing

### Directory Structure

```
src/
├── orchestrator/
│   └── Orchestrator.ts          # Main orchestration engine
├── adapters/                    # AI provider adapters
│   ├── CodexAdapter.ts          # OpenAI Codex/GPT-5.2 integration
│   ├── GeminiAdapter.ts         # Google Gemini 3 Pro integration
│   ├── GLMAdapter.ts            # Zhipu GLM-4.7 integration
│   ├── KimiAdapter.ts           # Moonshot Kimi k2.5 integration
│   ├── ClaudeAdapter.ts         # Anthropic Claude Opus 4.5
│   ├── FallbackAdapter.ts       # Fallback chain management
│   ├── contextCompaction.ts     # Context compaction helper
│   └── contextCompaction.test.ts # Tests for context compaction
├── prompts/                     # Agent prompt templates
│   ├── architect.ts             # Planning phase prompts
│   ├── executor.ts              # Code generation prompts
│   ├── auditor.ts               # Code review prompts
│   └── consultant.ts            # Algorithmic help prompts
├── tui/                         # Terminal UI (React + Ink)
│   ├── screens/                 # Main screens
│   │   ├── History.tsx          # Session history with bulk operations
│   │   ├── SessionDetails.tsx   # Detailed session view
│   │   ├── Analytics.tsx        # Analytics dashboard
│   │   └── SessionCompare.tsx   # Session comparison view
│   ├── components/              # UI components (ProgressBar, LogView, etc.)
│   ├── hooks/                   # Custom React hooks
│   └── App.tsx                  # Main TUI app
├── cli/
│   └── index.ts                 # CLI command definitions (Commander.js)
├── utils/                       # Utilities
│   ├── StateManager.ts          # Session persistence (.orchestra/)
│   ├── configLoader.ts          # .orchestrarc.json handling
│   ├── gitIntegration.ts        # Git operations
│   ├── testRunner.ts            # Test framework detection and execution
│   ├── validators.ts            # Syntax validation (Python, JS, TS, Go, Rust)
│   ├── metrics.ts               # Performance metrics collection
│   ├── cache.ts                 # Response caching
│   ├── sessionHistory.ts        # Historical session data + full-text search
│   ├── sessionExport.ts         # Export to Markdown/JSON/CSV/HTML
│   ├── analytics.ts             # Analytics engine for trends and insights
│   ├── sessionCompare.ts        # Session comparison and diff generation
│   ├── notifications.ts         # Desktop notifications
│   ├── dryRun.ts                # Dry-run mode simulation
│   └── githubIntegration.ts     # GitHub integration
└── types.ts                     # TypeScript definitions

ai-core/                         # Universal patterns and skills
├── SKILLS/                      # 45+ domain-specific skills
└── SUBAGENTS/                   # Specialized subagents
```

### Key Architectural Patterns

1. **Adapter Pattern**: Unified interface for multiple AI providers with automatic fallback
2. **State Management**: Persistent sessions in `.orchestra/` directory with JSON state files
3. **Progress Tracking**: Real-time progress updates for parallel operations
4. **Recovery Mode**: Automatic error recovery with configurable attempts and timeout
5. **Syntax Validation**: Language-specific validation before code application
6. **Test Integration**: Auto-detection of test frameworks (pytest, jest, vitest, go test, cargo test)
7. **Context Compaction**: Automatic prompt reduction on CONTEXT_EXCEEDED errors with 5-strategy compaction (50-70% reduction)
8. **Model Performance Tracking**: Token usage, latency, costs, and error rates per model for reinforcement learning

### Context Compaction System

When context limits are exceeded, Orchestra automatically compacts prompts using a 5-strategy approach:

**Compaction Strategies:**

1. **Whitespace Removal**: Eliminates excessive whitespace while preserving code structure
2. **Repeated Phrase Detection**: Removes duplicate sentences and repeated instructions
3. **Code Block Summarization**: Summarizes code blocks > 500 chars with `... (code omitted for brevity) ...`
4. **Verbose Phrase Removal**: Strips common verbose patterns ("Please note that", "Make sure to", etc.)
5. **Aggressive Summarization**: If target reduction not met, applies sentence ranking and keeps only essential content

**Automatic Retry Flow:**

```typescript
// All adapters support automatic retry on CONTEXT_EXCEEDED
try {
  result = await adapter.execute(options);
} catch (error) {
  if (isContextExceededError(error)) {
    const compacted = compactPrompt(originalPrompt, targetReduction: 0.5);
    result = await adapter.execute({ ...options, prompt: compacted });
  }
}
```

**Features:**

- **Bilingual Error Detection**: Supports English and Chinese error messages (上下文過長, 請求過於頻繁)
- **Maximum 2 Retries**: Prevents infinite compaction loops
- **Preservation of Essential Info**: Action-oriented sentences and key technical terms are preserved
- **Token Estimation**: Approximate token count (1 token ≈ 4 chars) for proactive checking
- **Test Coverage**: 19 comprehensive tests ensuring quality compaction

**Usage:**

```typescript
import { compactPrompt, isContextExceededError, wouldExceedContext } from './adapters/contextCompaction.js';

// Check before sending
if (wouldExceedContext(prompt, maxTokens)) {
  const result = compactPrompt(prompt, 0.6); // 60% reduction target
  console.log(`Reduced ${result.reductionPercent}%`);
}
```

---

## Configuration

Orchestra uses `.orchestrarc.json` for project-specific settings:

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

Create with `orchestra init` or manually.

---

## Environment Variables

Orchestra uses Claude Code CLI with different AI providers via API proxies:

- **`KIMI_API_KEY`**: Required for KimiAdapter (Architect role)
  - Format: `sk-kimi-...`
  - Get from: https://www.kimi.com/code/membership
  - Used via: `claude-kimi` function in `.zshrc`
  - Endpoint: `https://api.kimi.com/coding/`

- **`ZAI_API_KEY`**: Required for GLMAdapter (Executor role)
  - Get from: https://z.ai
  - Used via: `claude-glm` function in `.zshrc`
  - Endpoint: `https://api.z.ai/api/anthropic`

- **`GEMINI_API_KEY`**: Optional Gemini API key (fallback for Architect/Auditor)
- **`OPENAI_API_KEY`**: Optional OpenAI API key (for Codex adapter/Consultant)

**Note**: Orchestra executes Claude Code CLI with configured providers. Ensure your `.zshrc` has the `claude-kimi` and `claude-glm` functions configured.

---

## Key Development Concepts

### Adapter System

All AI providers implement a unified `Adapter` interface defined in `FallbackAdapter.ts`. The `FallbackAdapter` class manages automatic fallback chains when providers hit rate limits or fail.

Example fallback chain:
```typescript
const architect = new FallbackAdapter([
  new CodexAdapter(config),
  new GeminiAdapter(config),
  new GLMAdapter(config)
]);
```

### State Persistence

Sessions are persisted in `.orchestra/` directory:
- `session.json`: Current session state
- `plan.json`: Current execution plan
- `metrics.json`: Performance metrics
- `checkpoints/`: File checkpoints for recovery

### Recovery Mode

When normal audit loop fails, Recovery Mode activates:
1. Validates syntax with language-specific parsers
2. Detects incomplete code blocks
3. Iterates up to `maxRecoveryAttempts` (default: 3)
4. Auto-reverts changes if recovery fails (configurable)
5. Timeout controlled by `recoveryTimeout` (default: 10 min)

### Parallel Execution

File-level parallelism with controlled concurrency:
```typescript
// Runs with maxConcurrency workers (default: 3)
const results = await runWithConcurrency(
  files,
  processFile,
  maxConcurrency,
  onProgress
);
```

---

## Important Rules

### File Creation Rules (from AGENTS.md)

**Before creating ANY .md file:**
1. Check if similar file exists (`ls -1 *.md | grep -i "keyword"`)
2. Consolidate if possible (use `CHANGELOG.md`, `TUTORIAL.md`, `ARCHITECTURE.md`)
3. **Forbidden patterns**: `PROGRESS-*.md`, `*REPORT.md`, `*ACHIEVEMENT*.md`, `*TASKS*.md`
4. **Allowed without asking**: `SKILLS/*/SKILL.md`, `tests/*.test.md`, `docs/adr/*.md`

### Dangerous Mode Protection

**Always active** - The `dangerous-mode-guard` skill auto-invokes when:
- `--dangerously-skip-permissions` flag detected
- High-risk operations requested (git force push, rm -rf, terraform destroy, etc.)
- Destructive database operations (DROP, TRUNCATE)
- System-critical modifications (chmod 777, systemctl stop)

### Skill Auto-Invocation

Invoke skills BEFORE performing actions:

| Action                       | Skill                  |
| ---------------------------- | ---------------------- |
| Authentication/authorization | `security`             |
| Writing tests                | `testing`              |
| UI components                | `frontend`             |
| API endpoints                | `backend`              |
| Database schema/queries      | `database`             |
| Git commits/PRs              | `git-workflow`         |
| **Destructive operations**   | `dangerous-mode-guard` |

---

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode, ES2022 target)
- **CLI Framework**: Commander.js + chalk + ora
- **TUI Framework**: React 19.2.4 + Ink (React for CLI)
- **Testing**: Vitest
- **Build**: TypeScript compiler (tsc)
- **UI Components**: ink-big-text, ink-box, ink-gradient, ink-select-input, ink-spinner, ink-text-input

---

## Supported Languages for Syntax Validation

- `python` - Validates Python syntax
- `javascript` - Validates JavaScript syntax
- `typescript` - Validates TypeScript syntax
- `go` - Validates Go syntax
- `rust` - Validates Rust syntax
- `json` - Validates JSON structure
- `yaml` - Validates YAML structure

Auto-detection based on file extension, or configure in `.orchestrarc.json`.

---

## Test Framework Detection

Orchestra auto-detects and runs tests using:
- Python: `pytest` (pytest.ini), `unittest` (setup.py/test_*.py)
- JavaScript/TypeScript: `jest` (jest.config.*), `vitest` (vitest.config.*)
- Go: `go test` (*_test.go files)
- Rust: `cargo test` (Cargo.toml)

Override with `test.command` in config.

---

## Analytics & Reporting

Orchestra provides comprehensive analytics and reporting capabilities for tracking performance trends, agent effectiveness, and identifying common issues.

### Features

**1. Full-Text Search**

Search across all session data including tasks, plans, logs, and errors:

```bash
# CLI - Search in all fields
orchestra history --full-search "authentication error"

# Search with date range
orchestra history --full-search "API" --from 2026-01-01 --to 2026-02-01

# Search specific fields
orchestra history --full-search "timeout" --fields logs,errors

# Search by status
orchestra history --full-search "deploy" --status completed
```

**2. Export Formats**

Export sessions to multiple formats for analysis and reporting:

```bash
# Export current session to CSV
orchestra export --format csv --output ./reports

# Export specific session (via ID)
orchestra history --load sess_123456 --export csv

# Supported formats: markdown, json, csv, html
orchestra export --format html --output ./reports
```

**CSV Export Features:**
- RFC 4180 compliant
- Proper escaping of commas, quotes, newlines
- Batch export for multiple sessions
- Export manifest with metadata

**3. Analytics Dashboard (TUI)**

Launch the TUI and navigate to Analytics for:

```bash
npm run tui
# Navigate to Analytics screen
```

**Analytics Views:**
- **Success Rate Trends**: Weekly/monthly success rates with duration averages
- **Agent Performance**: Success rates, latency, and costs per agent (Architect, Executor, Auditor, Consultant)
- **Top Errors**: Most frequent errors with affected session counts
- **Time Range Filters**: 7d, 30d, 90d, all

**4. Session Comparison**

Compare two sessions side-by-side to analyze differences:

```bash
# Via CLI (if implemented)
orchestra compare sess_123456 sess_789012

# Via TUI
# Select two sessions and press 'c' for compare
```

**Comparison Features:**
- **Metrics Delta**: Duration, iterations, files created
- **Plan Diff**: Line-by-line unified diff of execution plans
- **File Differences**: Added, removed, and status-changed files

**5. Bulk Operations (TUI)**

Manage multiple sessions efficiently:

- **Selection Mode**: Press `s` to enter selection mode
- **Toggle Selection**: Use `Space` to select/deselect sessions
- **Bulk Delete**: Select multiple sessions and press `d`
- **Bulk Export**: Export selected sessions to any format

### Use Cases

**Performance Analysis:**
```bash
# Find slow sessions
orchestra history --full-search "timeout" --status failed

# Export for Excel analysis
orchestra history --status completed --export csv
```

**Error Investigation:**
```bash
# Search error logs
orchestra history --full-search "ECONNREFUSED" --fields logs,errors

# View analytics for error trends
npm run tui  # Navigate to Analytics
```

**Cost Optimization:**
```bash
# Analyze agent performance
# View Analytics → Agent Performance tab
# Identify agents with low success rates or high costs
```

**Session Comparison:**
```bash
# Compare failed vs successful attempt
orchestra compare sess_failed sess_success
# Identify what changed between attempts
```

### Data Retention

- **Default**: 50 sessions (configurable via `maxSessions` in `.orchestrarc.json`)
- **Auto-cleanup**: Enabled by default, removes oldest sessions
- **Manual cleanup**: `orchestra clean` or bulk delete via TUI

### Export Locations

- **Default**: `.orchestra/exports/`
- **Sessions**: `.orchestra/sessions/`
- **History Index**: `.orchestra/sessions/history-index.json`

---

## Common Issues

### Adapter Failures
- Check `ZAI_API_KEY` is set
- Verify API key has sufficient quota
- Check network connectivity
- Review adapter logs in TUI

### Recovery Mode Looping
- Increase `maxRecoveryAttempts` in config
- Increase `recoveryTimeout` if code is complex
- Check if prompts need adjustment for codebase

### State Corruption
- Run `orchestra clean` to reset session
- Delete `.orchestra/` directory manually
- Resume with `orchestra resume` if possible
---

---

## Recursos de ai-core

| Recurso          | Ubicación                     | Descripción                                        |
| ---------------- | ----------------------------- | -------------------------------------------------- |
| **Guía Central** | `ai-core/SUBAGENTS/AGENTS.md` | Working agreements, subagentes, skills disponibles |
| **Skills**       | `.claude/skills/`             | Symlink a `ai-core/SKILLS/`                        |
| **Subagentes**   | `.claude/agents/`             | Symlink a `ai-core/SUBAGENTS/`                     |

### Subagentes Principales

- `ai-core-guardian` - Guardian de producción (siempre activo)
- `security-specialist` - OWASP, Zero Trust, OAuth2
- `frontend-specialist` - React/Vue/Angular, a11y
- `backend-specialist` - REST/GraphQL, validación
- `testing-specialist` - TDD, coverage, mocking
- `code-reviewer` - Revisión de PRs, auditorías

Para lista completa y working agreements, ver: **`ai-core/SUBAGENTS/AGENTS.md`**
