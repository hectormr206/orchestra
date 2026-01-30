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
orchestra export             # Export session data
orchestra history             # Show session history
orchestra tui                # Launch Terminal UI
```

---

## Architecture

Orchestra follows a **multi-agent orchestration pattern** with automatic fallback chains:

### Agent Workflow

```
User Request
    ↓
Architect (Codex → Gemini → GLM 4.7)
    → Creates implementation plan
    ↓
[Plan Approval]
    ↓
Executor (GLM 4.7)
    → Generates code
    ↓
Auditor (Gemini → GLM 4.7)
    → Reviews code quality
    ↓
[Issues Found?] → Consultant (Codex → Gemini → GLM 4.7)
    → Helps with algorithmic problems
    ↓
[Loop until approved or max iterations]
    ↓
[Optional] Tests (auto-detected framework)
    ↓
[Optional] Git commit (conventional commits)
```

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
│   ├── CodexAdapter.ts          # Claude/Codex integration
│   ├── GeminiAdapter.ts         # Google Gemini integration
│   ├── GLMAdapter.ts            # Zhipu GLM integration
│   └── FallbackAdapter.ts       # Fallback chain management
├── prompts/                     # Agent prompt templates
│   ├── architect.ts             # Planning phase prompts
│   ├── executor.ts              # Code generation prompts
│   ├── auditor.ts               # Code review prompts
│   └── consultant.ts            # Algorithmic help prompts
├── tui/                         # Terminal UI (React + Ink)
│   ├── screens/                 # Main screens (Dashboard, Execution, etc.)
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
│   ├── sessionHistory.ts        # Historical session data
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

- **`ZAI_API_KEY`**: Required API key for AI providers (Zhipu AI platform)
- **`GEMINI_API_KEY`**: Optional Gemini API key (if using Gemini adapter)
- **`OPENAI_API_KEY`**: Optional OpenAI API key (if using Codex adapter)

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
