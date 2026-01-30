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

## Gemini Project Development Context

This document provides the necessary context for Gemini to effectively assist in the development and maintenance of this project.

### 1. Project Overview

[Project Name] is [brief description of what your project does].

- **Core Idea:** [Explain the main purpose and value proposition]
- **Technology Stack:** [List main technologies: languages, frameworks, databases]
- **Architecture:** [Brief description of the system architecture. See `ARCHITECTURE.md` if exists]

### 2. Building, Running, and Testing

- **Installation:**

  ```bash
  # Installation commands
  [Add your installation commands here]
  ```

- **Running the Application:**

  ```bash
  # Development mode
  [Add dev command]

  # Production mode
  [Add prod command]
  ```

- **Running Tests:**

  ```bash
  # Run all tests
  [Add test command]

  # Run specific test suite
  [Add suite-specific commands]
  ```

### 3. Development Conventions

All contributions **must** adhere to the project conventions.

#### Code Structure

- **[Directory 1]:** Description of what goes here
- **[Directory 2]:** Description of what goes here
- **[Directory 3]:** Description of what goes here

#### Coding Principles

- **[Principle 1]:** Brief explanation
- **[Principle 2]:** Brief explanation
- **Write for an LLM:** Be specific, direct, and action-oriented
- **Use Structured Formats:** Employ tables, bold keywords, and lists
- **Validate Rigorously:** [Add validation requirements]

### 4. Key Files & Directories

- `src/`: Main source code directory
- `tests/`: Contains all test scripts
- `docs/`: Documentation files
- `.github/workflows/`: GitHub Actions for CI/CD
- `[config file]`: Main configuration file
- `[other important files]`: Brief descriptions

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
