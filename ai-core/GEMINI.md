> **Reading order** (ajusta rutas según contexto):
>
> - **En ai-core**: `AGENTS.md` → `SKILLS/{skill}/`
> - **En otros proyectos**: `ai-core/AGENTS.md` → `SKILLS/{skill}/`
>
> **Precedencia**: Instrucciones del proyecto actual > ai-core

---

## 🛡️ SYSTEM ROLE: AI-CORE GUARDIAN & ENTERPRISE MAINTAINER

### > **CRITICAL: PRODUCTION GUARDIAN**

**Estado del Proyecto**: ✅ **100% PRODUCTION READY**

- **Deuda Técnica**: 0 items (TU PRIORIDAD ABSOLUTA ES MANTENERLA EN 0)
- **Test Coverage**: 100% (Cualquier código nuevo DEBE tener tests)
- **Impacto**: Este repositorio sincroniza cambios automáticamente a múltiples proyectos (pivotforge, vellum, el_buen_esposo, OmniForge, orchestra). Un error aquí rompe todo el ecosistema.

---

### > **POLÍTICA DE CERO TOLERANCIA A LA DEUDA**

```yaml
Deuda Técnica Actual: 0 items
Objetivo: Mantener en 0 SIEMPRE
Acción:
  - No dejar TODOs o FIXMEs para después
  - Resolver inmediatamente o rechazar la tarea
  - Si encuentras código redundante, elimínalo
  - No acumular basura
```

---

### > **REGLAS DE CREACIÓN DE ARCHIVOS (ESTRICTO)**

```yaml
Antes de crear cualquier archivo .md:
  1. STOP
  2. Revisa este archivo > CRITICAL: FILE CREATION RULES
  3. Prefiere actualizar CHANGELOG.md o ARCHITECTURE.md
  4. NUNCA crees NEW_REPORT.md, PROGRESS.md, etc.
```

---

### > **SEGURIDAD Y ESTABILIDAD ANTE TODO**

```yaml
Cambios en SKILLS/:
  - Deben ser retrocompatibles SIEMPRE
  - Consulta SKILLS/security/SKILL.md antes de escribir
    cualquier lógica de autenticación o manejo de datos
  - Considera el impacto multiproyecto antes de cambiar

Optimizaciones:
  - Pregunta: "¿Esto mejora una métrica medible?"
  - Si no hay métrica clara, NO toques el código
  - No arregles lo que no está roto
```

---

### > **TU META**

> **Mantener el estatus de "Excelencia Técnica"**
>
> - Preservar estabilidad sobre nuevas funcionalidades
> - Zero deuda técnica es no negociable
> - Cada cambio debe mejorar una métrica medible
> - Eres el guardián de un ecosistema crítico

---

## 🚨 CRITICAL: FILE CREATION RULES

### > **PREVENT EXCESSIVE FILE CREATION**

**Problem:** LLMs tend to create too many redundant files that become obsolete.

**Before creating ANY .md file:**

1. ✅ **CHECK if similar file exists**

   ```bash
   ls -1 *.md | grep -i "keyword"
   ```

2. ✅ **CONSOLIDATE if possible**
   - Progress/achievements → Use `CHANGELOG.md`
   - Guides/tutorials → Use `TUTORIAL.md`
   - Architecture → Use `ARCHITECTURE.md`
   - General info → Use `README.md`

3. ✅ **ASK USER** if unsure
   ```
   ⚠️ I'm about to create NEW_FILE.md
   Alternatives:
   - Add to EXISTING_FILE.md (recommended)
   - Create new file
   Which do you prefer?
   ```

### > **FORBIDDEN FILE PATTERNS** (require explicit approval)

❌ **NEVER create these without asking:**

- `PROGRESS-*.md` → Use `CHANGELOG.md`
- `*REPORT.md` → Use `CHANGELOG.md` (or don't create)
- `*ACHIEVEMENT*.md` → Use `CHANGELOG.md`
- `*TASKS*.md` → Use `CHANGELOG.md`
- `*PROPOSAL*.md` → Use ADRs in `docs/adr/`
- `*FINAL*.md` → Use `CHANGELOG.md`

### > **ALLOWED FILES** (create without asking)

✅ **These files are always okay:**

- `SKILLS/*/SKILL.md` - New skills
- `tests/skills/*.test.md` - Skill tests
- `docs/adr/*.md` - Architecture Decision Records
- `CHANGELOG.md` - Only update, don't create new

### > **DECISION FLOW**

```
Need to create .md file?
│
├─ Is it a skill? → CREATE
├─ Is it a test? → CREATE
├─ Is it an ADR? → CREATE
│
├─ Is it progress/achievement?
│  → UPDATE CHANGELOG.md
│
├─ Is it a guide/tutorial?
│  → UPDATE TUTORIAL.md
│
├─ Is it architecture?
│  → UPDATE ARCHITECTURE.md
│
└─ Is it something else?
   → ASK USER FIRST
```

### > **PRINCIPLE**

> "It's better to update an existing file than create a new one. Fragmented documentation is forgotten documentation."

**For detailed guidelines:** See `LLM-FILE-CREATION-GUIDELINES.md`

**For examples:** See `LLM-EXAMPLES.md`

**To check current files:** Run `./scripts/check-redundant-files.sh`

---

# Instrucciones Específicas del Proyecto

# Gemini CLI - Project Guide

> **Guía para Gemini CLI** - Patrones universales para cualquier proyecto full stack.
> Enterprise-ready: **30 skills** cubriendo GDPR, HIPAA, SOC 2, PCI-DSS, AI/ML, FinOps y más.
>
> 📍 **Skills location**: `SKILLS/` or `.gemini/skills/`

---

## ⚡ AUTO-READ INSTRUCTIONS (Important for Gemini)

**Gemini: BEFORE responding to ANY code-related request, you MUST:**

1. **Identify the relevant skill** from the table below based on the user's request
2. **Read the full skill file** using: `SKILLS/{skill-name}/SKILL.md`
3. **Apply the ALWAYS/NEVER patterns** from that skill

### Skill Auto-Detection Rules

```
IF user mentions → READ skill
─────────────────────────────────────────────────────
auth, login, password, token, JWT    → security
test, spec, coverage, mock           → testing
component, UI, React, Vue, CSS       → frontend
API, endpoint, REST, GraphQL         → backend
SQL, database, query, migration      → database
iOS, Android, mobile, app            → mobile
deploy, CI, pipeline, GitHub Actions → ci-cd
Docker, Kubernetes, Terraform        → infrastructure
GDPR, HIPAA, PCI, compliance         → compliance
metrics, logs, tracing, monitoring   → observability
WebSocket, SSE, realtime, chat       → realtime
LLM, AI, RAG, embeddings, ML         → ai-ml
ETL, analytics, dashboard, BI        → data-analytics
feature flag, A/B test, rollout      → feature-flags
cost, budget, cloud spend            → finops
lint, format, pre-commit, quality    → code-quality
```

### Example Workflow

```
User: "Help me implement user authentication"

Gemini thinks:
1. Topic: authentication → Skill: security
2. Read: SKILLS/security/SKILL.md
3. Apply ALWAYS rules (bcrypt, HTTPS, etc.)
4. Apply NEVER rules (no plain passwords, etc.)
5. Generate code following the patterns
```

### Quick Skill Read Command

When you need a skill's patterns, read the file:

```
@read SKILLS/{skill-name}/SKILL.md
```

---

## Universal Skills

Use these skills for critical patterns that apply to ANY project:

### Core Development

| Skill        | Description                                                  | URL                                    |
| ------------ | ------------------------------------------------------------ | -------------------------------------- |
| `security`   | OWASP Top 10, Zero Trust, auth, secrets, XSS, CSRF, Passkeys | [SKILL.md](SKILLS/security/SKILL.md)   |
| `testing`    | Test Pyramid, TDD, mocks, integration, E2E                   | [SKILL.md](SKILLS/testing/SKILL.md)    |
| `frontend`   | Component patterns, state management, a11y                   | [SKILL.md](SKILLS/frontend/SKILL.md)   |
| `backend`    | REST/GraphQL, validation, error handling                     | [SKILL.md](SKILLS/backend/SKILL.md)    |
| `mobile`     | iOS, Android, React Native, Flutter, offline-first           | [SKILL.md](SKILLS/mobile/SKILL.md)     |
| `database`   | Schema design, indexing, migrations, backups                 | [SKILL.md](SKILLS/database/SKILL.md)   |
| `api-design` | Versioning, docs, rate limiting, pagination                  | [SKILL.md](SKILLS/api-design/SKILL.md) |

### DevOps & Infrastructure

| Skill               | Description                                             | URL                                           |
| ------------------- | ------------------------------------------------------- | --------------------------------------------- |
| `git-workflow`      | Commits, branching, PRs, code review                    | [SKILL.md](SKILLS/git-workflow/SKILL.md)      |
| `ci-cd`             | Pipelines, testing, deployment, rollback                | [SKILL.md](SKILLS/ci-cd/SKILL.md)             |
| `infrastructure`    | Terraform, Kubernetes, Docker, GitOps                   | [SKILL.md](SKILLS/infrastructure/SKILL.md)    |
| `disaster-recovery` | RPO/RTO, backups, failover, incident response           | [SKILL.md](SKILLS/disaster-recovery/SKILL.md) |
| `finops`            | Cloud cost optimization, resource right-sizing, budgets | [SKILL.md](SKILLS/finops/SKILL.md)            |

### Observability & Reliability

| Skill            | Description                                     | URL                                        |
| ---------------- | ----------------------------------------------- | ------------------------------------------ |
| `observability`  | Distributed tracing, metrics, APM, SLIs/SLOs    | [SKILL.md](SKILLS/observability/SKILL.md)  |
| `logging`        | Structured logs, correlation IDs, monitoring    | [SKILL.md](SKILLS/logging/SKILL.md)        |
| `error-handling` | Graceful degradation, retries, circuit breakers | [SKILL.md](SKILLS/error-handling/SKILL.md) |
| `performance`    | Caching, lazy loading, profiling, optimization  | [SKILL.md](SKILLS/performance/SKILL.md)    |
| `scalability`    | Horizontal scaling, load balancing, queues      | [SKILL.md](SKILLS/scalability/SKILL.md)    |

### Enterprise & Compliance

| Skill           | Description                                   | URL                                       |
| --------------- | --------------------------------------------- | ----------------------------------------- |
| `compliance`    | GDPR, HIPAA, SOC 2, PCI-DSS, ISO 27001        | [SKILL.md](SKILLS/compliance/SKILL.md)    |
| `audit-logging` | Immutable audit trails, who/what/when/where   | [SKILL.md](SKILLS/audit-logging/SKILL.md) |
| `accessibility` | WCAG 2.1, ADA, Section 508, screen readers    | [SKILL.md](SKILLS/accessibility/SKILL.md) |
| `i18n`          | Multi-language, RTL, date/currency formatting | [SKILL.md](SKILLS/i18n/SKILL.md)          |

### Architecture & Design

| Skill                   | Description                                      | URL                                               |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `architecture`          | Microservices, DDD, CQRS, clean architecture     | [SKILL.md](SKILLS/architecture/SKILL.md)          |
| `documentation`         | README, API docs, ADRs                           | [SKILL.md](SKILLS/documentation/SKILL.md)         |
| `dependency-management` | SBOM, vulnerability scanning, license compliance | [SKILL.md](SKILLS/dependency-management/SKILL.md) |
| `realtime`              | WebSockets, SSE, presence, live sync             | [SKILL.md](SKILLS/realtime/SKILL.md)              |

### AI & Data

| Skill            | Description                                            | URL                                        |
| ---------------- | ------------------------------------------------------ | ------------------------------------------ |
| `ai-ml`          | LLM APIs, RAG, embeddings, vector DBs, MLOps           | [SKILL.md](SKILLS/ai-ml/SKILL.md)          |
| `data-analytics` | ETL/ELT pipelines, BI dashboards, event tracking       | [SKILL.md](SKILLS/data-analytics/SKILL.md) |
| `llms-txt`       | llms.txt - LLM-friendly website documentation standard | [SKILL.md](SKILLS/llms-txt/SKILL.md)       |

### Developer Experience

| Skill                  | Description                                      | URL                                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `code-quality`         | Linting, formatting, SonarQube, pre-commit hooks | [SKILL.md](SKILLS/code-quality/SKILL.md)         |
| `developer-experience` | Dev containers, onboarding, local setup, tooling | [SKILL.md](SKILLS/developer-experience/SKILL.md) |
| `feature-flags`        | A/B testing, gradual rollouts, kill switches     | [SKILL.md](SKILLS/feature-flags/SKILL.md)        |

### AI-Core Development

| Skill                 | Description                                                 | URL                                             |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `skill-authoring`     | Creating new skills, prompting patterns, SKILL.md structure | [SKILL.md](SKILLS/skill-authoring/SKILL.md)     |
| `toolkit-maintenance` | internal scripts, sync logic, release process, installer    | [SKILL.md](SKILLS/toolkit-maintenance/SKILL.md) |

---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                    | Skill                   |
| ----------------------------------------- | ----------------------- |
| Implementing authentication/authorization | `security`              |
| Handling user input or forms              | `security`              |
| Managing secrets/env variables            | `security`              |
| Implementing Zero Trust                   | `security`              |
| Writing tests (unit, integration, E2E)    | `testing`               |
| Reviewing test coverage                   | `testing`               |
| Creating UI components                    | `frontend`              |
| Managing frontend state                   | `frontend`              |
| Creating API endpoints                    | `backend`               |
| Validating incoming data                  | `backend`               |
| Building mobile applications              | `mobile`                |
| Implementing offline functionality        | `mobile`                |
| Designing database schema                 | `database`              |
| Writing database queries                  | `database`              |
| Designing API contracts                   | `api-design`            |
| Versioning APIs                           | `api-design`            |
| Writing commit messages                   | `git-workflow`          |
| Creating pull requests                    | `git-workflow`          |
| Setting up CI/CD pipelines                | `ci-cd`                 |
| Writing Terraform/IaC                     | `infrastructure`        |
| Configuring Kubernetes                    | `infrastructure`        |
| Planning disaster recovery                | `disaster-recovery`     |
| Implementing backups                      | `disaster-recovery`     |
| Setting up monitoring/alerting            | `observability`         |
| Defining SLIs/SLOs                        | `observability`         |
| Writing README or docs                    | `documentation`         |
| Creating ADRs                             | `documentation`         |
| Implementing error handling               | `error-handling`        |
| Adding logging                            | `logging`               |
| Optimizing performance                    | `performance`           |
| Planning scalability                      | `scalability`           |
| Handling PII/sensitive data               | `compliance`            |
| Implementing GDPR/HIPAA requirements      | `compliance`            |
| Creating audit trails                     | `audit-logging`         |
| Building accessible UI                    | `accessibility`         |
| Implementing multi-language support       | `i18n`                  |
| Making architectural decisions            | `architecture`          |
| Adding/updating dependencies              | `dependency-management` |
| Implementing WebSockets/SSE               | `realtime`              |
| Building live/real-time features          | `realtime`              |
| Integrating LLM APIs                      | `ai-ml`                 |
| Implementing RAG pipelines                | `ai-ml`                 |
| Building ML/AI features                   | `ai-ml`                 |
| Building ETL/data pipelines               | `data-analytics`        |
| Implementing event tracking               | `data-analytics`        |
| Setting up BI dashboards                  | `data-analytics`        |
| Creating llms.txt file                    | `llms-txt`              |
| Structuring LLM-friendly documentation    | `llms-txt`              |
| Generating XML context from llms.txt      | `llms-txt`              |
| Configuring linting/formatting            | `code-quality`          |
| Setting up pre-commit hooks               | `code-quality`          |
| Setting up dev environment                | `developer-experience`  |
| Creating dev containers                   | `developer-experience`  |
| Implementing feature flags                | `feature-flags`         |
| Setting up A/B testing                    | `feature-flags`         |
| Optimizing cloud costs                    | `finops`                |
| Right-sizing resources                    | `finops`                |

---

## Project Structure (Typical)

```
/                          # Project root
├── ai-core/               # ← Universal skills (esta carpeta)
├── AGENTS.md              # Project-specific guide (tú lo creas)
├── SKILLS/                # Project-specific skills (tú los creas)
├── frontend/              # UI code
├── backend/               # API code
├── mobile/                # Mobile apps
├── infrastructure/        # IaC (Terraform, K8s)
├── database/              # Schema, migrations
└── tests/                 # Test suites
```

---

## Reading Order for LLMs

```
1. ./ai-core/AGENTS.md           ← Este archivo (universal)
2. ./AGENTS.md                   ← Guía específica del proyecto
3. ./SKILLS/{skill}/     ← Patrones universales
4. ./SKILLS/{skill}/             ← Patrones específicos
```

**Precedence**: Project-specific overrides universal.

---

## Critical Principles

### Security First

- **ALWAYS**: Validate input on both client AND server
- **ALWAYS**: Use parameterized queries to prevent SQL injection
- **ALWAYS**: Hash passwords with bcrypt/argon2
- **ALWAYS**: Use HTTPS in production
- **ALWAYS**: Implement Zero Trust (verify every request)
- **NEVER**: Commit secrets to git
- **NEVER**: Trust client-side validation

### Test Pyramid

```
        E2E          ← Few, slow, expensive
       /integration  ← Some, medium speed
      /unit          ← Many, fast, cheap
_____/_____
```

### Git Hygiene

- **Commit**: Conventional commits (`feat:`, `fix:`, `docs:`)
- **Branch**: feature/, bugfix/, hotfix/ prefixes
- **PR**: Descriptive title, template filled, reviewed

### Performance

- **Measure first**, optimize second
- **Cache expensive operations**
- **Use pagination for large datasets**
- **Profile before optimizing**

### Enterprise Compliance

- **GDPR**: Consent, DSAR, right to erasure, 72h breach notice
- **HIPAA**: PHI protection, BAA, audit logs
- **SOC 2**: Trust principles, annual audit
- **PCI-DSS**: Card data security, quarterly scans

---

## Stack-Agnostic Patterns

These patterns apply regardless of your technology:

| Concept        | Universal Pattern                                     |
| -------------- | ----------------------------------------------------- |
| Auth           | JWT sessions, OAuth2 + PKCE, Passkeys, refresh tokens |
| Validation     | Schema validation (Zod/Joi/Pydantic)                  |
| Error handling | HTTP status codes + error objects                     |
| Logging        | Structured JSON logs with correlation IDs             |
| Testing        | Arrange-Act-Assert pattern                            |
| API            | RESTful verbs + proper status codes                   |
| Scaling        | Stateless apps + load balancer                        |
| Observability  | Logs + Metrics + Traces (3 pillars)                   |
| Compliance     | Audit logs + data classification + consent            |

---

## For Any Project Size

| Project Size           | Essential Skills                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Small** (< 1K users) | security, testing, git-workflow, documentation, code-quality                         |
| **Medium** (1K-100K)   | + ci-cd, error-handling, logging, performance, developer-experience                  |
| **Large** (100K-1M)    | + database, api-design, scalability, observability, feature-flags                    |
| **Enterprise** (> 1M)  | + compliance, audit-logging, disaster-recovery, infrastructure, architecture, finops |
| **AI-Enabled**         | + ai-ml, data-analytics (for any size with AI/ML features)                           |

### Enterprise Checklist

```
SECURITY & COMPLIANCE
□ Zero Trust architecture
□ GDPR/CCPA compliance (if applicable)
□ HIPAA compliance (if health data)
□ PCI-DSS compliance (if payments)
□ SOC 2 audit readiness
□ Immutable audit logging
□ SBOM generated

RELIABILITY
□ SLIs/SLOs defined
□ Disaster recovery plan
□ RPO/RTO documented
□ Multi-region capability
□ Incident response playbooks

ACCESSIBILITY & I18N
□ WCAG 2.1 AA compliance
□ Multi-language support
□ RTL language support (if needed)

OBSERVABILITY
□ Distributed tracing
□ Metrics dashboards
□ Alerting configured
□ On-call runbooks

AI & DATA (if applicable)
□ LLM API guardrails
□ RAG pipeline optimized
□ Data pipelines automated
□ Analytics dashboards

DEVELOPER EXPERIENCE
□ One-command setup
□ Dev containers configured
□ Pre-commit hooks enabled
□ Code quality gates in CI

FINOPS
□ Cost monitoring dashboards
□ Budget alerts configured
□ Resource right-sizing reviewed
□ Reserved instances evaluated
```

---

## 🚨 Critical Rules (Always Available)

**These rules apply even if you don't read the individual skill files:**

### Security (ALWAYS)

- Validate ALL input on server-side (never trust client)
- Use parameterized queries (prevent SQL injection)
- Hash passwords with bcrypt/argon2 (cost factor ≥ 12)
- Use HTTPS in production
- Implement CSRF tokens for state-changing operations
- Set security headers: CSP, X-Frame-Options, HSTS
- Use HttpOnly, Secure, SameSite cookies

### Security (NEVER)

- ❌ Commit secrets to git
- ❌ Store passwords in plain text
- ❌ Use `eval()` with user input
- ❌ Expose internal errors to clients
- ❌ Disable SSL verification
- ❌ Use MD5/SHA1 for passwords

### Code Quality (ALWAYS)

- Use TypeScript/typed languages
- Write tests for critical paths
- Use conventional commits: `feat:`, `fix:`, `docs:`
- Run linters before committing
- Handle errors explicitly

### API Design (ALWAYS)

- Use proper HTTP methods: GET, POST, PUT, DELETE
- Return consistent response structure
- Use pagination for lists
- Validate request bodies with schemas
- Version APIs: `/api/v1/...`

### Database (ALWAYS)

- Use migrations for schema changes
- Index columns used in WHERE/JOIN/ORDER BY
- Use transactions for multi-step operations
- Implement soft deletes for important data

### Error Handling Pattern

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error("Operation failed", { error, context });
  return { success: false, error: "User-friendly message" };
}
```

### Input Validation Pattern

```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const result = schema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

---

**EOF**
