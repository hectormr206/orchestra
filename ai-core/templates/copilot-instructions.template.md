# GitHub Copilot Instructions

<!-- ============================================================================
     AI-CORE INTEGRATION - GITHUB COPILOT
     ============================================================================
     Este proyecto usa ai-core para patrones universales de desarrollo.

     📖 REFERENCIA CENTRAL: ai-core/SUBAGENTS/AGENTS.md
        Contiene: Working Agreements, Subagentes, Skills, Estructura del proyecto
     ============================================================================ -->

## Referencia a ai-core

Este proyecto utiliza **ai-core** para patrones universales.

📖 **Guía Central**: `ai-core/SUBAGENTS/AGENTS.md`

- Working Agreements (estándares de calidad, seguridad)
- 30+ Skills especializados
- Subagentes para tareas específicas

---

## Repository Guidelines

### Project Structure & Module Organization

[Project Name] is [brief description]. Key paths:

- `src/`: main source code directory
- `tests/`: test runners and suites
- `docs/`: documentation files
- `[other key paths]`: brief descriptions

### Build, Test, and Development Commands

- `[test command]`: run the full test suite.
- `[build command]`: build the project.
- `[dev command]`: start development server.
- `[lint command]`: run linting and formatting.

### Coding Style & Naming Conventions

- [Describe naming conventions for files, functions, variables]
- [Describe formatting preferences: indentation, line length, etc.]
- Prefer concise, structured code with clear comments.
- No TODOs or FIXMEs; remove redundant code immediately.

### Testing Guidelines

- All new code must include tests and keep coverage at project expectations.
- Use `[test command]` for full coverage.
- Name new tests to match existing suite conventions.

### Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- Keep commits focused; include the "why" in the message when behavior changes.
- PRs should include a concise summary, test results, and relevant context.

### Agent-Specific Instructions

- Follow the reading order: `CLAUDE.md` → `AGENTS.md` → relevant skills.
- Invoke skills BEFORE performing domain-specific actions.
- Changes affecting multiple modules must be retrocompatible.

---

## Reglas de ai-core (Siempre Aplicar)

### Seguridad

- Validar inputs en servidor (nunca confiar en cliente)
- Usar queries parametrizadas (prevenir SQL injection)
- Hash passwords con bcrypt/argon2
- Nunca commitear secretos

### Calidad

- Usar TypeScript con tipos estrictos
- Escribir tests para funcionalidad crítica
- Usar conventional commits: `feat:`, `fix:`, `docs:`

### APIs

- Métodos HTTP correctos: GET, POST, PUT, DELETE
- Estructura de respuesta consistente
- Paginación para listas

Para reglas completas, ver: **`ai-core/SUBAGENTS/AGENTS.md`**
