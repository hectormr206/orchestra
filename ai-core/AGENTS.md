> **Reading order** (ajusta rutas según contexto):
> - **En ai-core**: `AGENTS.md` → `SKILLS/{skill}/`
> - **En otros proyectos**: `ai-core/AGENTS.md` → `SKILLS/{skill}/`
>
> **Precedencia**: Instrucciones del proyecto actual > ai-core

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

### > **FORBIDDEN FILE PATTERNS**

❌ **NEVER create these without asking:**
- `PROGRESS-*.md` → Use `CHANGELOG.md`
- `*REPORT.md` → Use `CHANGELOG.md` (or don't create)
- `*ACHIEVEMENT*.md` → Use `CHANGELOG.md`
- `*TASKS*.md` → Use `CHANGELOG.md`
- `*PROPOSAL*.md` → Use ADRs in `docs/adr/`

### > **ALLOWED FILES**

✅ **These files are always okay:**
- `SKILLS/*/SKILL.md` - New skills
- `tests/skills/*.test.md` - Skill tests
- `docs/adr/*.md` - Architecture Decision Records
- `CHANGELOG.md` - Only update, don't create new

**For detailed guidelines:** See `LLM-FILE-CREATION-GUIDELINES.md`

**To check current files:** Run `./scripts/check-redundant-files.sh`

---

# Instrucciones Específicas del Proyecto

---

## 🎯 AI-CORE ORCHESTRATION

### > **CENTRALIZED INTELLIGENT ORCHESTRATION**

**All requests flow through the Master Orchestrator for optimal handling:**

1. **Master Orchestrator** - Central coordinator for all requests
   - Analyzes user intent automatically
   - Selects appropriate skills/agents
   - Coordinates multi-agent workflows
   - Ensures safety at every step
   - [Full documentation](ai-core/SUBAGENTS/universal/master-orchestrator.md)

2. **Intent Analysis Skill** - Understands what the user needs
   - Classifies task type (feature, bug, refactor, etc.)
   - Identifies domain (frontend, backend, database, etc.)
   - Determines complexity (simple, medium, complex)
   - Maps to required resources
   - [Full documentation](SKILLS/intent-analysis/SKILL.md)

3. **Automatic Flow** - How it works
   ```
   User Request
      ↓
   Intent Analysis (understand what's needed)
      ↓
   Safety Check (dangerous-mode-guard if needed)
      ↓
   Resource Selection (skills + agents)
      ↓
   Execution (coordinated workflow)
      ↓
   Results (aggregated output)
   ```

---

### > **TASK CLASSIFICATION** 📊

**The orchestrator automatically classifies your request:**

| Task Type | Examples | Resources |
|-----------|----------|-----------|
| **feature** | "Add login", "Create API" | feature-creator + domain skills |
| **bug** | "Fix error", "Not working" | bug-fixer + domain skills |
| **refactor** | "Improve code", "Clean up" | code-refactorer + code-quality |
| **test** | "Add tests", "Check coverage" | testing-specialist + testing |
| **review** | "Review PR", "Check code" | pr-reviewer + code-quality |
| **security** | "Fix vulnerability", "Secure API" | security-specialist + security |
| **performance** | "Optimize", "Slow query" | performance-optimizer + observability |
| **deploy** | "Deploy to prod", "Release" | devops-specialist + ci-cd |
| **docs** | "Document API", "Write README" | documentation-writer |
| **maintenance** | "Update deps", "Run maintenance" | maintenance-coordinator |

---

### > **EXECUTION STRATEGIES** ⚡

**Based on complexity, the orchestrator chooses the best approach:**

```yaml
Simple Tasks (< 30 min):
  Strategy: Direct skill invocation
  Example: "Add button" → frontend skill
  No agent needed

Medium Tasks (1-2 hours):
  Strategy: Single agent coordination
  Example: "Add login form" → feature-creator + 2-3 skills
  One agent coordinates multiple skills

Complex Tasks (2+ hours):
  Strategy: Multi-agent orchestration
  Example: "Payment system" → 2-3 agents + 5+ skills
  Orchestrator coordinates multiple agents
```

---

### > **HOW IT WORKS** 🔄

**You don't need to choose skills or agents - just describe what you need:**

```yaml
You: "Add OAuth2 authentication with Google"

Orchestrator:
  1. ✅ Intent Analysis
     → Task: feature
     → Domain: security + backend
     → Complexity: medium

  2. ✅ Resource Selection
     → Skills: security, backend, api-design
     → Agent: feature-creator

  3. ✅ Execution
     → feature-creator coordinates all skills
     → Implements OAuth2 with Google

  4. ✅ Complete
     → Full authentication system ready
```

---

### > **BENEFITS** ✨

| Before | After |
|--------|-------|
| You choose skills | Orchestrator selects automatically |
| Manual coordination | Automatic multi-agent workflows |
| No safety validation | Built-in safety checks |
| Trial and error | Intent-driven routing |
| Fragmented responses | Coordinated solutions |

---

## 🚨 CRITICAL: Dangerous Mode Protection

### > **ALWAYS ACTIVE - Even in `--dangerously-skip-permissions` mode**

**You are protected by multiple safety layers:**

1. **Skill: `dangerous-mode-guard`** - Auto-invoked when dangerous mode is detected
   - Validates EVERY command before execution
   - Blocks destructive operations automatically
   - Requires confirmation for high-risk actions
   - [Full rules](SKILLS/dangerous-mode-guard/SKILL.md)

2. **Agent: `permission-gatekeeper`** - Gatekeeper for dangerous operations
   - Intercepts commands before execution
   - Classifies risk (HIGH/MEDIUM/LOW)
   - Blocks forbidden operations
   - Asks for user confirmation when needed
   - [Full documentation](ai-core/SUBAGENTS/universal/permission-gatekeeper.md)

3. **These rules below** - Always active, regardless of mode

---

### > **FORBIDDEN OPERATIONS** 🚫

**NEVER execute these without explicit user confirmation:**

```bash
# Git - Destructive operations
git push --force
git reset --hard
git clean -fd
git branch -D

# Files - Data destruction
rm -rf /
rm -rf *
dd if=/dev/zero
shred, wipe

# Database - Data loss
DROP DATABASE
TRUNCATE TABLE
DELETE FROM table (without WHERE)

# Cloud/Infrastructure
terraform destroy -auto-approve
kubectl delete namespace
docker system prune -a --volumes
aws ec2 terminate-instances

# System - Critical services
systemctl stop ssh/nginx/mysql
iptables -F
chmod 777
```

---

### > **REQUIRED CHECKLIST** ✅

**Before executing ANY command in dangerous mode:**

```yaml
[ ] Command analyzed and understood
[ ] Risk level assessed (HIGH/MEDIUM/LOW)
[ ] Checked against forbidden patterns
[ ] Verified target (prod/staging/local)
[ ] User intent is clear
[ ] Considered safer alternatives
[ ] Asked user if HIGH RISK
[ ] Confirmed recovery plan exists

ONLY THEN: Execute
```

---

### > **WHEN IN DOUBT** ⚠️

```yaml
Rule: When in doubt, ASK THE USER

Never:
  - Assume it's safe
  - Skip validation
  - "Guess" the intent
  - Run commands blindly

Always:
  - Use AskUserQuestion tool
  - Explain the risk
  - Show the command
  - Wait for confirmation
```

---

## 🚨 When to Auto-Invoke dangerous-mode-guard

**ALWAYS auto-invoke `dangerous-mode-guard` skill when:**

- Detected `--dangerously-skip-permissions` flag
- User mentions bypassing permissions
- High-risk operations are requested (git force push, rm -rf, etc.)
- Destructive database operations (DROP, TRUNCATE)
- Infrastructure destruction (terraform destroy, kubectl delete)
- System-critical modifications (chmod 777, systemctl stop)

**The skill will:**
1. Analyze the command for danger patterns
2. Classify the risk level
3. Block forbidden operations
4. Ask for confirmation on high-risk actions
5. Suggest safer alternatives

---

# AI Agents - Universal Guide

> **Guía maestra para LLMs** - Patrones universales para cualquier proyecto full stack.
> Enterprise-ready: **40 skills** cubriendo GDPR, HIPAA, SOC 2, PCI-DSS, AI/ML, FinOps y más.

---

## Universal Skills

Use these skills for critical patterns that apply to ANY project:

### Core Development

| Skill | Description | URL |
|-------|-------------|-----|
| `security` | OWASP Top 10, Zero Trust, auth, secrets, XSS, CSRF, Passkeys | [SKILL.md](SKILLS/security/SKILL.md) |
| `testing` | Test Pyramid, TDD, mocks, integration, E2E | [SKILL.md](SKILLS/testing/SKILL.md) |
| `frontend` | Component patterns, state management, a11y | [SKILL.md](SKILLS/frontend/SKILL.md) |
| `backend` | REST/GraphQL, validation, error handling | [SKILL.md](SKILLS/backend/SKILL.md) |
| `mobile` | iOS, Android, React Native, Flutter, offline-first | [SKILL.md](SKILLS/mobile/SKILL.md) |
| `database` | Schema design, indexing, migrations, backups | [SKILL.md](SKILLS/database/SKILL.md) |
| `api-design` | Versioning, docs, rate limiting, pagination | [SKILL.md](SKILLS/api-design/SKILL.md) |

### DevOps & Infrastructure

| Skill | Description | URL |
|-------|-------------|-----|
| `git-workflow` | Commits, branching, PRs, code review | [SKILL.md](SKILLS/git-workflow/SKILL.md) |
| `ci-cd` | Pipelines, testing, deployment, rollback | [SKILL.md](SKILLS/ci-cd/SKILL.md) |
| `infrastructure` | Terraform, Kubernetes, Docker, GitOps | [SKILL.md](SKILLS/infrastructure/SKILL.md) |
| `disaster-recovery` | RPO/RTO, backups, failover, incident response | [SKILL.md](SKILLS/disaster-recovery/SKILL.md) |
| `finops` | Cloud cost optimization, resource right-sizing, budgets | [SKILL.md](SKILLS/finops/SKILL.md) |

### Observability & Reliability

| Skill | Description | URL |
|-------|-------------|-----|
| `observability` | Distributed tracing, metrics, APM, SLIs/SLOs | [SKILL.md](SKILLS/observability/SKILL.md) |
| `logging` | Structured logs, correlation IDs, monitoring | [SKILL.md](SKILLS/logging/SKILL.md) |
| `error-handling` | Graceful degradation, retries, circuit breakers | [SKILL.md](SKILLS/error-handling/SKILL.md) |
| `performance` | Caching, lazy loading, profiling, optimization | [SKILL.md](SKILLS/performance/SKILL.md) |
| `scalability` | Horizontal scaling, load balancing, queues | [SKILL.md](SKILLS/scalability/SKILL.md) |

### Enterprise & Compliance

| Skill | Description | URL |
|-------|-------------|-----|
| `compliance` | GDPR, HIPAA, SOC 2, PCI-DSS, ISO 27001 | [SKILL.md](SKILLS/compliance/SKILL.md) |
| `audit-logging` | Immutable audit trails, who/what/when/where | [SKILL.md](SKILLS/audit-logging/SKILL.md) |
| `accessibility` | WCAG 2.1, ADA, Section 508, screen readers | [SKILL.md](SKILLS/accessibility/SKILL.md) |
| `i18n` | Multi-language, RTL, date/currency formatting | [SKILL.md](SKILLS/i18n/SKILL.md) |

### Architecture & Design

| Skill | Description | URL |
|-------|-------------|-----|
| `architecture` | Microservices, DDD, CQRS, clean architecture | [SKILL.md](SKILLS/architecture/SKILL.md) |
| `documentation` | README, API docs, ADRs | [SKILL.md](SKILLS/documentation/SKILL.md) |
| `dependency-management` | SBOM, vulnerability scanning, license compliance | [SKILL.md](SKILLS/dependency-management/SKILL.md) |
| `realtime` | WebSockets, SSE, presence, live sync | [SKILL.md](SKILLS/realtime/SKILL.md) |

### AI & Data

| Skill | Description | URL |
|-------|-------------|-----|
| `ai-ml` | LLM APIs, RAG, embeddings, vector DBs, MLOps | [SKILL.md](SKILLS/ai-ml/SKILL.md) |
| `data-analytics` | ETL/ELT pipelines, BI dashboards, event tracking | [SKILL.md](SKILLS/data-analytics/SKILL.md) |

### Developer Experience

| Skill | Description | URL |
|-------|-------------|-----|
| `code-quality` | Linting, formatting, SonarQube, pre-commit hooks | [SKILL.md](SKILLS/code-quality/SKILL.md) |
| `developer-experience` | Dev containers, onboarding, local setup, tooling | [SKILL.md](SKILLS/developer-experience/SKILL.md) |
| `feature-flags` | A/B testing, gradual rollouts, kill switches | [SKILL.md](SKILLS/feature-flags/SKILL.md) |

### AI-Core Development

| Skill | Description | URL |
|-------|-------------|-----|
| `skill-authoring` | Creating new skills, prompting patterns, SKILL.md structure | [SKILL.md](SKILLS/skill-authoring/SKILL.md) |
| `toolkit-maintenance` | Automated maintenance system, workflows, installer, release process | [SKILL.md](SKILLS/toolkit-maintenance/SKILL.md) |

### Maintenance (Automated)

| Skill | Description | URL |
|-------|-------------|-----|
| `dependency-updates` | Safe dependency updates, abandoned library detection, rollback automation | [SKILL.md](SKILLS/dependency-updates/SKILL.md) |
| `technical-debt` | Debt tracking, scoring system, prioritization matrix, reduction strategies | [SKILL.md](SKILLS/technical-debt/SKILL.md) |
| `security-scanning` | Automated security scans, vulnerability detection, secrets scanning, OWASP Top 10 | [SKILL.md](SKILLS/security-scanning/SKILL.md) |

### Safety & Security (Always Active)

| Skill | Description | URL |
|-------|-------------|-----|
| `dangerous-mode-guard` | **CRITICAL**: Protection for --dangerously-skip-permissions mode. Prevents destructive ops, data loss, security vulnerabilities. Auto-invoked. | [SKILL.md](SKILLS/dangerous-mode-guard/SKILL.md) |

### Orchestration & Analysis (Always Active)

| Skill | Description | URL |
|-------|-------------|-----|
| `intent-analysis` | **CRITICAL**: Analyzes user intent, classifies tasks, maps to skills/agents. Core of intelligent orchestration. Auto-invoked on every request. | [SKILL.md](SKILLS/intent-analysis/SKILL.md) |

---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Implementing authentication/authorization | `security` |
| Handling user input or forms | `security` |
| Managing secrets/env variables | `security` |
| Implementing Zero Trust | `security` |
| Writing tests (unit, integration, E2E) | `testing` |
| Reviewing test coverage | `testing` |
| Creating UI components | `frontend` |
| Managing frontend state | `frontend` |
| Creating API endpoints | `backend` |
| Validating incoming data | `backend` |
| Building mobile applications | `mobile` |
| Implementing offline functionality | `mobile` |
| Designing database schema | `database` |
| Writing database queries | `database` |
| Designing API contracts | `api-design` |
| Versioning APIs | `api-design` |
| Writing commit messages | `git-workflow` |
| Creating pull requests | `git-workflow` |
| Setting up CI/CD pipelines | `ci-cd` |
| Writing Terraform/IaC | `infrastructure` |
| Configuring Kubernetes | `infrastructure` |
| Planning disaster recovery | `disaster-recovery` |
| Implementing backups | `disaster-recovery` |
| Setting up monitoring/alerting | `observability` |
| Defining SLIs/SLOs | `observability` |
| Writing README or docs | `documentation` |
| Creating ADRs | `documentation` |
| Implementing error handling | `error-handling` |
| Adding logging | `logging` |
| Optimizing performance | `performance` |
| Planning scalability | `scalability` |
| Handling PII/sensitive data | `compliance` |
| Implementing GDPR/HIPAA requirements | `compliance` |
| Creating audit trails | `audit-logging` |
| Building accessible UI | `accessibility` |
| Implementing multi-language support | `i18n` |
| Making architectural decisions | `architecture` |
| Adding/updating dependencies | `dependency-management` |
| Implementing WebSockets/SSE | `realtime` |
| Building live/real-time features | `realtime` |
| Integrating LLM APIs | `ai-ml` |
| Implementing RAG pipelines | `ai-ml` |
| Building ML/AI features | `ai-ml` |
| Building ETL/data pipelines | `data-analytics` |
| Implementing event tracking | `data-analytics` |
| Setting up BI dashboards | `data-analytics` |
| Configuring linting/formatting | `code-quality` |
| Setting up pre-commit hooks | `code-quality` |
| Setting up dev environment | `developer-experience` |
| Creating dev containers | `developer-experience` |
| Implementing feature flags | `feature-flags` |
| Setting up A/B testing | `feature-flags` |
| Optimizing cloud costs | `finops` |
| Right-sizing resources | `finops` |
| Creating a new skill | `skill-authoring` |
| Maintaining ai-core or releasing updates | `toolkit-maintenance` |
| Updating dependencies | `dependency-updates` |
| Checking for abandoned libraries | `dependency-updates` |
| Running dependency updates safely | `dependency-updates` |
| Tracking technical debt | `technical-debt` |
| Planning debt reduction | `technical-debt` |
| Refactoring legacy code | `technical-debt` |
| Running security scans | `security-scanning` |
| Checking for vulnerabilities | `security-scanning` |
| Scanning for leaked secrets | `security-scanning` |
| **Detected --dangerously-skip-permissions** | **`dangerous-mode-guard`** |
| **Attempting git push --force** | **`dangerous-mode-guard`** |
| **Running rm -rf or similar destructive commands** | **`dangerous-mode-guard`** |
| **Executing terraform destroy or kubectl delete** | **`dangerous-mode-guard`** |
| **Running DROP/ TRUNCATE database operations** | **`dangerous-mode-guard`** |
| **Modifying system permissions (chmod 777)** | **`dangerous-mode-guard`** |
| **Stopping critical system services** | **`dangerous-mode-guard`** |
| **ANY user request (orchestration)** | **`master-orchestrator`** |
| **Need to understand user intent** | **`intent-analysis`** |

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

| Concept | Universal Pattern |
|---------|-------------------|
| Auth | JWT sessions, OAuth2 + PKCE, Passkeys, refresh tokens |
| Validation | Schema validation (Zod/Joi/Pydantic) |
| Error handling | HTTP status codes + error objects |
| Logging | Structured JSON logs with correlation IDs |
| Testing | Arrange-Act-Assert pattern |
| API | RESTful verbs + proper status codes |
| Scaling | Stateless apps + load balancer |
| Observability | Logs + Metrics + Traces (3 pillars) |
| Compliance | Audit logs + data classification + consent |

---

## For Any Project Size

| Project Size | Essential Skills |
|--------------|------------------|
| **Small** (< 1K users) | security, testing, git-workflow, documentation, code-quality |
| **Medium** (1K-100K) | + ci-cd, error-handling, logging, performance, developer-experience |
| **Large** (100K-1M) | + database, api-design, scalability, observability, feature-flags |
| **Enterprise** (> 1M) | + compliance, audit-logging, disaster-recovery, infrastructure, architecture, finops |
| **AI-Enabled** | + ai-ml, data-analytics (for any size with AI/ML features) |

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

**EOF**
