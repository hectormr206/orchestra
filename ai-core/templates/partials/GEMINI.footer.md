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
