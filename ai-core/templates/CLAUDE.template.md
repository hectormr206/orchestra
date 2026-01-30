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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

<!-- Describe your project here -->

**[Project Name]** is [brief description of what your project does].

**Status**: [Development/Production Ready] | **Technical Debt**: [items] | **Test Coverage**: [percentage]

---

## Common Commands

```bash
# Run all tests
# [Add your test command here]

# Run specific test suite
# [Add suite-specific command]

# Build the project
# [Add build command]

# Start development server
# [Add dev command]

# Linting and formatting
# [Add lint/format commands]
```

---

## Architecture

```
project/
├── src/                   # Source code
│   ├── components/        # UI components (if applicable)
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── tests/                 # Test suites
├── docs/                  # Documentation
└── [other directories]    # Add your project structure
```

### Key Patterns

1. **[Pattern 1]**: Brief description of a key architectural pattern
2. **[Pattern 2]**: Brief description of another pattern
3. **[Pattern 3]**: Additional patterns as needed

---

## Critical Rules

### Code Quality

- [Add your code quality rules]
- All new code MUST have tests
- No TODOs or FIXMEs left for later

### File Creation Rules

**Before creating ANY .md file:**

1. Check if similar file exists
2. Prefer updating existing files
3. **Forbidden patterns** (require explicit approval): `PROGRESS-*.md`, `*REPORT.md`, `*ACHIEVEMENT*.md`
4. **Allowed without asking**: `tests/*.test.md`, `docs/adr/*.md`

---

## Dangerous Mode Protection

**Always active, even with `--dangerously-skip-permissions`:**

```bash
# FORBIDDEN without explicit user confirmation:
git push --force, git reset --hard, git clean -fd
rm -rf /, rm -rf *, dd if=/dev/zero
DROP DATABASE, TRUNCATE TABLE, DELETE without WHERE
# [Add project-specific dangerous operations]
```

When in doubt, use AskUserQuestion tool.

---

## Skill Auto-Invocation

Invoke the corresponding skill BEFORE performing these actions:

| Action                       | Skill                  |
| ---------------------------- | ---------------------- |
| Authentication/authorization | `security`             |
| Writing tests                | `testing`              |
| UI components                | `frontend`             |
| API endpoints                | `backend`              |
| Database schema/queries      | `database`             |
| Git commits/PRs              | `git-workflow`         |
| CI/CD pipelines              | `ci-cd`                |
| Monitoring/alerting          | `observability`        |
| GDPR/HIPAA/PCI-DSS           | `compliance`           |
| LLM APIs/RAG                 | `ai-ml`                |
| **Destructive operations**   | `dangerous-mode-guard` |

---

## Reading Order

```
1. CLAUDE.md          ← This file (always first)
2. AGENTS.md          ← Project-specific guide
3. ai-core/SKILLS/    ← Universal patterns as needed
4. ai-core/SUBAGENTS/ ← Specialized agents as needed
```

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
