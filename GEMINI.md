<!-- ============================================================================
     AI-CORE INTEGRATION - GEMINI CLI
     ============================================================================
     Este proyecto usa ai-core para patrones universales de desarrollo.

     📖 REFERENCIA CENTRAL: ai-core/SUBAGENTS/AGENTS.md
        Contiene: Working Agreements, Subagentes, Skills, Estructura del proyecto

     PRIORIDAD: Las instrucciones de este archivo tienen precedencia sobre ai-core
     ============================================================================ -->

> **Orden de lectura** para Gemini CLI:
>
> 1. `ai-core/SUBAGENTS/AGENTS.md` ← 📖 Guía central (skills, subagentes, working agreements)
> 2. Este archivo ← Instrucciones específicas de TU proyecto
>
> **Precedencia**: Este archivo > ai-core

---
## Project Overview

This project, `@ai-core/orchestra`, is a "Meta-Orchestrator" for AI development tools. It coordinates multiple AI agents (Claude, Codex, Gemini, and GLM) to perform complex development tasks. The project is a Node.js application written in TypeScript and includes both a command-line interface (CLI) and a text-based user interface (TUI).

The orchestration flow follows a sequence of agents:

1.  **Architect:** Creates a plan for the task.
2.  **Executor:** Implements the code based on the plan.
3.  **Consultant:** Assists with algorithmic problems and syntax errors.
4.  **Auditor:** Reviews the generated code for quality and correctness.

The orchestrator uses a fallback mechanism for the AI agents, ensuring resilience and reliability. It also supports parallel execution, a pipeline mode for simultaneous execution and auditing, and a watch mode for automatic re-execution on file changes.

## Building and Running

### Prerequisites

*   Node.js (>=18.0.0)
*   npm

### Installation

```bash
npm install
```

### Building

To compile the TypeScript code, run:

```bash
npm run build
```

### Running the CLI

You can run the CLI in development mode using:

```bash
npm run dev -- [command] [options]
```

To run the compiled version of the CLI, use:

```bash
npm start -- [command] [options]
```

The main command to start a new task is `start`:

```bash
npm run dev -- start "Your task description"
```

### Running the TUI

To launch the Text-based User Interface, run:

```bash
npm run tui
```

### Running Tests

The project uses `vitest` for testing. To run the tests, use:

```bash
npm test
```

To run the tests with coverage, use:

```bash
npm run test:coverage
```

### Linting

The project uses `eslint` for linting. To lint the code, run:

```bash
npm run lint
```

## Development Conventions

*   **Language:** TypeScript
*   **Testing:** `vitest`
*   **Linting:** `eslint`
*   **Code Style:** The project follows a modular structure with a clear separation of concerns. The code is well-documented with comments and JSDoc annotations.
*   **User Interface:** The project includes both a CLI and a TUI. The TUI is built with React and the `ink` library.
*   **State Management:** The `StateManager` class is used to manage the state of the orchestration process.
*   **AI Integration:** The project uses an adapter pattern to integrate with different AI agents. The `FallbackAdapter` provides a resilient way to interact with the agents.
---

## Recursos de ai-core

| Recurso          | Ubicación                     | Descripción                                        |
| ---------------- | ----------------------------- | -------------------------------------------------- |
| **Guía Central** | `ai-core/SUBAGENTS/AGENTS.md` | Working agreements, subagentes, skills disponibles |
| **Skills**       | `.gemini/skills/`             | Symlink a `ai-core/SKILLS/`                        |
| **Subagentes**   | `.gemini/agents/`             | Symlink a `ai-core/SUBAGENTS/`                     |

### Auto-Detección de Skills

Gemini detecta automáticamente qué skill usar según tu solicitud:

| Si mencionas...           | Skill a consultar |
| ------------------------- | ----------------- |
| auth, login, JWT, secrets | `security`        |
| test, spec, mock, TDD     | `testing`         |
| API, endpoint, REST       | `backend`         |
| component, UI, React      | `frontend`        |
| database, SQL, migration  | `database`        |
| deploy, CI/CD, pipeline   | `ci-cd`           |

### Subagentes Principales

- `ai-core-guardian` - Guardian de producción (siempre activo)
- `security-specialist` - OWASP, Zero Trust, OAuth2
- `testing-specialist` - TDD, coverage, mocking
- `code-reviewer` - Revisión de PRs

Para lista completa y working agreements, ver: **`ai-core/SUBAGENTS/AGENTS.md`**
