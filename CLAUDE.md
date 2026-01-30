# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run dev -- <cmd>   # Run CLI in dev mode: npm run dev -- start "task"
npm start -- <cmd>     # Run compiled CLI: npm start -- doctor
npm run tui            # Run Terminal UI
npm test               # Run tests (vitest)
npm run test:coverage  # Tests with coverage
npm run lint           # ESLint
npm run clean          # Remove dist/
```

After code changes, always rebuild with `npm run build`.

## Architecture

Orchestra coordinates multiple AI CLI tools through a multi-agent workflow:

```
Task → Architect → Executor → Auditor → Complete
           ↓           ↓
       Consultant (assists with issues)
```

### Agent Roles & Fallback Chain

| Agent | Purpose | Fallback Chain |
|-------|---------|----------------|
| Architect | Creates implementation plan | Codex → Gemini → GLM |
| Executor | Implements code from plan | GLM |
| Auditor | Reviews generated code | Gemini → GLM |
| Consultant | Assists with complex issues | Codex → Gemini → GLM |

### Core Components

- **`src/orchestrator/Orchestrator.ts`** - Main coordination logic. Manages phases: `planning → awaiting_approval → executing → auditing → completed`. Uses callbacks for progress reporting.

- **`src/adapters/`** - AI CLI wrappers implementing the `Adapter` interface:
  ```typescript
  interface Adapter {
    execute(options: ExecuteOptions): Promise<AgentResult>;
    isAvailable(): Promise<boolean>;
    getInfo(): { name: string; model: string; provider: string };
  }
  ```
  - `FallbackAdapter.ts` - Chains adapters with automatic fallback on rate limits
  - `CodexAdapter.ts` - Uses `codex exec --dangerously-bypass-approvals-and-sandbox`
  - `GeminiAdapter.ts` - Uses `gemini -y`
  - `GLMAdapter.ts` - Uses `zai` with ZAI_API_KEY

- **`src/prompts/`** - Agent prompt builders. Each file exports `build*Prompt()` functions and response parsers.

- **`src/cli/index.ts`** - Commander.js CLI with 17 commands (start, resume, pipeline, watch, etc.)

- **`src/tui/`** - React/Ink terminal UI
  - `App.tsx` - Main app with screen navigation
  - `screens/` - Dashboard, Execution, History, PlanReview, Settings, Doctor
  - `hooks/useOrchestrator.ts` - State management hook

- **`src/utils/`** - Utilities
  - `StateManager.ts` - Session persistence to `.orchestra/`
  - `validators.ts` - Multi-language syntax validation
  - `configLoader.ts` - Loads `.orchestrarc.json`
  - `cache.ts` - Result caching with SHA256 task hashing

### Working Directory Context

All AI CLIs execute in `process.cwd()`. When orchestra runs from a project directory, the CLIs automatically read project-specific config files (CLAUDE.md, GEMINI.md, .claude/, .gemini/).

### Session State

State persists in `.orchestra/` directory:
- `session-state.json` - Current session
- `plan.md` - Implementation plan
- `audit-result.json` - Audit results

## Code Conventions

- ESM modules with `.js` extensions in imports (TypeScript compiles to ESM)
- Types defined in `types.ts`, exported from `index.ts`
- Spanish comments in some files (legacy)
- React functional components for TUI
