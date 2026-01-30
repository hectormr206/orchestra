# GitHub Copilot - Complete Project Instructions

> **Guía completa para GitHub Copilot** - 40 skills enterprise-ready condensados.
> Incluye: Seguridad, Testing, DevOps, Compliance, AI/ML, FinOps y más.
>
> ⚠️ **Este archivo es auto-generado.** Para regenerar: `./ai-core/scripts/generate-copilot-instructions.sh`

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

## 📑 Table of Contents

### Quick Start

- [Quick Reference](#quick-reference)
- [Code Style](#code-style)

### Core Development Skills

- [accessibility](#accessibility) - WCAG 2.1, ARIA, keyboard navigation
- [api-design](#api-design) - Versioning, documentation, rate limiting
- [backend](#backend) - REST/GraphQL, validation, error handling
- [database](#database) - Schema design, indexing, migrations
- [frontend](#frontend) - Components, state management, patterns
- [mobile](#mobile) - iOS, Android, React Native, Flutter
- [testing](#testing) - Test Pyramid, TDD, mocks, E2E

### DevOps & Infrastructure

- [ci-cd](#ci-cd) - Pipelines, testing, deployment
- [disaster-recovery](#disaster-recovery) - RPO/RTO, backups, failover
- [finops](#finops) - Cloud cost optimization
- [infrastructure](#infrastructure) - Terraform, Kubernetes, Docker

### Observability & Reliability

- [error-handling](#error-handling) - Retries, circuit breakers
- [logging](#logging) - Structured logs, correlation IDs
- [observability](#observability) - Tracing, metrics, SLOs
- [performance](#performance) - Caching, profiling, optimization
- [scalability](#scalability) - Horizontal scaling, queues

### Enterprise & Compliance

- [audit-logging](#audit-logging) - Immutable audit trails
- [compliance](#compliance) - GDPR, HIPAA, SOC 2, PCI-DSS
- [i18n](#i18n) - Multi-language, RTL, formatting

### Architecture & Design

- [architecture](#architecture) - Microservices, DDD, CQRS
- [dependency-management](#dependency-management) - SBOM, vulnerabilities
- [documentation](#documentation) - README, API docs, ADRs
- [realtime](#realtime) - WebSockets, SSE, live sync

### AI & Data

- [ai-ml](#ai-ml) - LLMs, RAG, embeddings, MLOps
- [data-analytics](#data-analytics) - ETL/ELT, BI dashboards
- [llms-txt](#llms-txt) - LLM-friendly website documentation

### Developer Experience

- [code-quality](#code-quality) - Linting, formatting, SonarQube
- [developer-experience](#developer-experience) - Dev containers, onboarding
- [feature-flags](#feature-flags) - A/B testing, gradual rollouts

### Maintenance

- [dependency-updates](#dependency-updates) - Safe updates, rollback
- [security-scanning](#security-scanning) - Vulnerability scanning
- [technical-debt](#technical-debt) - Debt tracking, reduction

---

## Quick Reference

### File Naming Conventions

- Components: `PascalCase.tsx` (UserProfile.tsx)
- Utilities: `camelCase.ts` (formatDate.ts)
- Constants: `UPPER_SNAKE_CASE` (API_ENDPOINTS)
- CSS Modules: `kebab-case.module.css` (user-profile.module.css)

### Code Style

- Use `const` by default, `let` when reassignment needed, never `var`
- Prefer async/await over .then() chains
- Use optional chaining (?.) and nullish coalescing (??)
- Destructure objects and arrays when it improves readability

---

## accessibility

> Web accessibility patterns: WCAG 2.1 AA/AAA, ADA compliance, Section 508, screen readers, keyboard navigation, ARIA, inclusive design. Trigger: When building UI components or ensuring legal compliance

### ALWAYS

1. **Semantic HTML first**
2. **Keyboard accessibility**
3. **Color contrast ratios**
4. **Alternative text for images**
5. **Form labels and error handling**

### NEVER

1. **Rely on color alone to convey information**
2. **Remove focus outlines without replacement**
3. **Use placeholder as label**
4. **Create mouse-only interactions**
5. **Auto-play media without controls**
6. **Use CAPTCHA without alternatives**

#### Example

```
┌─────────────────────────────────────────────┐
│ LEVEL A (Minimum)                           │
│ → Basic accessibility                       │
│ → 30 success criteria                       │
│ → Legal minimum in most cases               │
├─────────────────────────────────────────────┤
│ LEVEL AA (Recommended)                      │
│ → Standard compliance target                │
│ → 20 additional criteria                    │
│ → Required by most regulations              │
├─────────────────────────────────────────────┤
│ LEVEL AAA (Enhanced)                        │
│ → Highest accessibility                     │
│ → 28 additional criteria                    │
│ → Often impractical for entire sites        │
└─────────────────────────────────────────────┘
```

---

## ai-ml

> AI/ML integration patterns: LLM APIs, RAG, embeddings, MLOps, model deployment, prompt engineering, vector databases, fine-tuning, responsible AI. Trigger: When integrating AI/ML models or building AI

### ALWAYS

1. **Implement proper error handling for AI APIs**
2. **Set token limits and cost controls**
3. **Use structured outputs**
4. **Implement caching for embeddings**
5. **Log all AI interactions for debugging**

### NEVER

1. **Expose API keys to frontend**
2. **Trust LLM output without validation**
3. **Send sensitive data to LLMs without consent**
4. **Ignore model output limits**
5. **Skip rate limiting for AI endpoints**

#### Example

```
┌─────────────────────────────────────────────┐
│                 RAG PIPELINE                │
├─────────────────────────────────────────────┤
│                                             │
│  1. INGESTION                               │
│     Documents → Chunking → Embeddings       │
│                    ↓                        │
│              Vector Database                │
│                                             │
│  2. RETRIEVAL                               │
│     Query → Embedding → Similarity Search   │
│                    ↓                        │
│              Top-K Documents                │
│                                             │
│  3. GENERATION                              │
│     Context + Query → LLM → Response        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## api-design

> REST/GraphQL API design patterns: versioning, documentation, rate limiting, pagination, error responses, idempotency. Trigger: When designing APIs, versioning endpoints, or writing API docs.

### ALWAYS

1. **Use nouns for resources, verbs for actions**
2. **API Versioning**
3. **Return consistent response structure**
4. **Use appropriate HTTP verbs**
5. **Pagination for list endpoints**
6. **Rate limiting**
7. **Idempotency keys for non-idempotent operations**

### NEVER

1. **Don't return nested arrays**
2. **Don't use verbs in URLs (except actions)**
3. **Don't expose internal IDs**

#### Example

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array

---

## architecture

> Software architecture patterns: microservices, monoliths, event-driven, CQRS, DDD, clean architecture, system design, trade-offs analysis. Trigger: When designing systems or making architectural decis

### ALWAYS
1. **Start with the problem, not the solution**
2. **Document decisions with ADRs**
3. **Apply the right pattern for the right scale**
4. **Design for failure**
5. **Separate concerns clearly**

### NEVER
1. **Start with microservices**
2. **Create circular dependencies**
3. **Share databases between services**
4. **Ignore Conway's Law**
5. **Over-engineer for hypothetical scale**

#### Example
```

MONOLITH when:

- Small team (< 10)
- New product (unknown domain)
- Simple deployment needs
- Strong consistency required
- Tight deadline

MICROSERVICES when:

- Large team (> 15)
- Well-understood domain
- Independent scaling needed
- Different tech requirements
- Multiple deployment cycles

````

---

## audit-logging

> Enterprise audit logging: who did what, when, where. Immutable audit trails, compliance reporting, forensics, tamper-proof logs, retention policies. Trigger: When implementing audit trails or complian

### ALWAYS
1. **Log the 5 W's**
2. **Make logs immutable**
3. **Use structured format**
4. **Separate audit logs from application logs**
5. **Protect audit logs**

### NEVER
1. **Log sensitive data in plain text**
2. **Allow audit log deletion**
3. **Skip logging for "minor" actions**
4. **Use client-provided timestamps**
5. **Store audit logs in the same DB as application data**

#### Example
```sql
-- Audit log table (append-only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version VARCHAR(10) NOT NULL DEFAULT '1.0',

    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_action VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,

    -- Actor (who)
    actor_id VARCHAR(255),
    actor_type VARCHAR(50) NOT NULL,
    actor_email VARCHAR(255),
    actor_ip INET,
    actor_user_agent TEXT,
    actor_session_id VARCHAR(255),

    -- Resource (what)
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),

---

## backend

> Universal backend patterns: API design, validation, error handling, authentication, rate limiting, logging. Trigger: When creating API endpoints, validating data, or implementing business logic.

### ALWAYS
1. **Validate input early**
2. **Use appropriate HTTP status codes**
3. **Return consistent error responses**
4. **Log structured data**
5. **Sanitize output**
6. **Use async for I/O operations**
7. **Implement idempotency**

### NEVER
1. **Don't trust client validation**
2. **Don't return raw stack traces to clients**
3. **Don't block the event loop**
4. **Don't hardcode URLs**
5. **Don't ignore errors**

#### Example
```python
@app.route("/api/users", methods=["POST"])
def create_user():
    # 1. Validate
    try:
        data = UserCreateSchema.validate(request.json)
    except ValidationError as e:
        return jsonify({"error": e.messages}), 400

    # 2. Business logic
    try:
        user = User.create(data)
    except DuplicateError:
        return jsonify({"error": "Email already exists"}), 409

    # 3. Response
    return jsonify(UserSchema.dump(user)), 201
````

---

## ci-cd

> CI/CD pipeline patterns: automated testing, deployment strategies, rollback plans, environment management. Trigger: When setting up pipelines, configuring deployments, or automating releases.

### ALWAYS

1. **Pipeline Stages**
2. **Environment Variables**
3. **Deployment Strategies**
4. **Rollback Plan**
5. **Artifact Versioning**
6. **Notifications**

### NEVER

1. **Don't skip tests for speed**
2. **Don't deploy directly to production**
3. **Don't hardcode credentials in pipeline**

#### Example

````yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:

---

## code-quality

> Code quality patterns: linting, formatting, static analysis, code review, SonarQube, pre-commit hooks, coding standards, technical debt management. Trigger: When setting up code quality tools or revie

### ALWAYS
1. **Automate formatting**
2. **Use pre-commit hooks**
3. **Fail CI on quality issues**
4. **Document coding standards**
5. **Track and manage technical debt**

### NEVER
1. **Commit code that doesn't pass linting**
2. **Disable rules project-wide without justification**
3. **Skip code review for "small" changes**
4. **Let technical debt accumulate without tracking**
5. **Mix formatting styles in the same project**

#### Example
```javascript
// eslint.config.js (ESLint 9+ flat config)
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',

---

## compliance

> Regulatory compliance patterns for enterprise: GDPR, HIPAA, SOC 2, PCI-DSS, ISO 27001, CCPA, LGPD. Data privacy, retention policies, audit requirements. Trigger: When handling PII, health data, paymen

### ALWAYS
1. **Data Classification**
2. **Consent Management**
3. **Data Minimization**
4. **Right to be Forgotten (GDPR Art. 17)**
5. **Data Subject Access Requests (DSAR)**
6. **Encryption Requirements**

### NEVER
1. **Store sensitive data without encryption**
2. **Transfer PII without explicit consent**
3. **Retain data beyond legal requirements**
4. **Process children's data without parental consent (COPPA)**
5. **Share data with third parties without DPA**
6. **Ignore data breach notification requirements**

#### Example
````

┌────────────────────────────────────────────┐
│ 1. Consent → User explicitly agrees│
│ 2. Contract → Necessary for service │
│ 3. Legal obligation→ Law requires it │
│ 4. Vital interests → Life/death situation │
│ 5. Public task → Government function │
│ 6. Legitimate int. → Business need (risky) │
└────────────────────────────────────────────┘

````

---

## data-analytics

> Data analytics patterns: ETL/ELT pipelines, data warehousing, BI integration, event tracking, analytics SDKs, data modeling, reporting. Trigger: When implementing analytics, data pipelines, or BI dash

### ALWAYS
1. **Define a tracking plan**
2. **Use consistent naming conventions**
3. **Include essential properties**
4. **Validate events before sending**
5. **Buffer and batch events**

### NEVER
1. **Track PII without consent**
2. **Use inconsistent event names**
3. **Skip event validation**
4. **Block UI waiting for analytics**
5. **Store raw user input in analytics**

#### Example
```typescript
// analytics.ts
class Analytics {
  private userId?: string;
  private anonymousId: string;
  private queue: Event[] = [];

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.setupPageTracking();
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;
    this.track('user_identified', { ...traits });

    // Update analytics services
    if (window.gtag) {
      window.gtag('set', 'user_id', userId);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    const enrichedEvent = {
      event,

---

## database

> Universal database patterns: schema design, indexing, migrations, backups, transactions, query optimization. Trigger: When designing database schema, writing queries, or planning migrations.

### ALWAYS
1. **Use appropriate data types**
2. **Add indexes on foreign keys and query filters**
3. **Use transactions for multi-step operations**
4. **Use parameterized queries**
5. **Normalize (3NF) until it hurts, then denormalize**
6. **Use UUIDs for public IDs, ints for internal**
7. **Set NOT NULL and DEFAULT**
8. **Regular backups**

### NEVER
1. **Don't use SELECT ***
2. **Don't N+1 query**
3. **Don't store passwords in plain text**
4. **Don't forget foreign key constraints**
5. **Don't use ENUM for mutable data**

#### Example
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    public_id UUID DEFAULT gen_random_uuid() UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP  -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_public_id ON users(public_id);
````

---

## dependency-management

> Secure dependency management: SBOM, vulnerability scanning, license compliance, supply chain security, dependency updates, lock files, version pinning. Trigger: When managing dependencies or securing

### ALWAYS

1. **Use lock files**
2. **Pin dependency versions**
3. **Scan for vulnerabilities regularly**
4. **Generate and maintain SBOM**
5. **Review before adding dependencies**

### NEVER

1. **Ignore vulnerability warnings**
2. **Use deprecated packages**
3. **Install from untrusted sources**
4. **Commit secrets in dependencies**
5. **Allow arbitrary code execution in install scripts**
6. **Use \* or latest as version**

#### Example

````yaml
# .github/workflows/security.yml
name: Dependency Security

on:
  push:
    paths:
      - '**/package.json'
      - '**/package-lock.json'
      - '**/requirements.txt'
      - '**/poetry.lock'
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9am

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Node.js
      - name: npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

---

## developer-experience

> Developer experience (DX) patterns: local development, dev containers, onboarding, tooling, documentation, debugging, productivity. Trigger: When setting up development environment or improving DX.

### ALWAYS
1. **One-command setup**
2. **Document prerequisites clearly**
3. **Use environment templates**
4. **Provide seed data**
5. **Document common tasks**

### NEVER
1. **Require manual multi-step setup**
2. **Assume tools are installed**
3. **Hardcode local paths**
4. **Skip documentation for "obvious" things**
5. **Leave secrets in example configs**

#### Example
```json
// .devcontainer/devcontainer.json
{
  "name": "Project Dev Container",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "prisma.prisma"
      ],
      "settings": {
        "editor.formatOnSave": true,

---

## disaster-recovery

> Business continuity and disaster recovery: RPO/RTO, backup strategies, multi-region deployment, failover procedures, incident response playbooks. Trigger: When planning high availability or disaster r

### ALWAYS
1. **Define RPO and RTO first**
2. **Follow the 3-2-1 backup rule**
3. **Test recovery regularly**
4. **Automate failover when possible**
5. **Document everything**

### NEVER
1. **Assume backups work without testing**
2. **Store backups in same region as primary**
3. **Skip DR drills**
4. **Leave runbooks outdated**
5. **Have single points of failure in critical paths**

#### Example
````

┌─────────────────────────────────────────────┐
│ FULL BACKUP │
│ → Complete copy of all data │
│ → Slowest, largest, simplest restore │
│ → Weekly recommended │
├─────────────────────────────────────────────┤
│ INCREMENTAL BACKUP │
│ → Changes since last backup (any type) │
│ → Fastest, smallest, complex restore │
│ → Hourly/daily recommended │
├─────────────────────────────────────────────┤
│ DIFFERENTIAL BACKUP │
│ → Changes since last full backup │
│ → Middle ground │
│ → Daily recommended │
├─────────────────────────────────────────────┤
│ CONTINUOUS (WAL/Binlog) │
│ → Stream of all changes │
│ → Point-in-time recovery │
│ → For critical systems │
└─────────────────────────────────────────────┘

````

---

## documentation

> Documentation best practices: README structure, API docs, architecture decision records (ADRs), inline comments. Trigger: When writing README, API documentation, or ADRs.

### ALWAYS
1. **README.md Structure**
2. **API Documentation**
3. **Architecture Decision Records (ADRs)**
4. **Code Comments: WHY, not WHAT**
5. **Changelog**
6. **Document Edge Cases**

### NEVER
1. **Don't document outdated information**
2. **Don't write obvious comments**
3. **Don't leave TODO comments without context**

#### Example
```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
[What is the issue we're facing?]

## Decision
[What did we decide?]

## Consequences
- [Positive outcomes]
- [Negative outcomes]
````

---

## error-handling

> Error handling patterns: graceful degradation, retries, circuit breakers, fallback strategies, error recovery. Trigger: When implementing error handling, retries, or failure recovery.

### ALWAYS

1. **Structured Error Responses**
2. **Retry with Exponential Backoff**
3. **Circuit Breaker Pattern**
4. **Graceful Degradation**
5. **Contextual Error Logging**
6. **Define Custom Error Types**

### NEVER

1. **Don't catch generic Exception**
2. **Don't swallow errors silently**
3. **Don't expose internal errors to clients**

---

## feature-flags

> Feature flag patterns: A/B testing, gradual rollouts, kill switches, experimentation, targeting rules, flag lifecycle management. Trigger: When implementing feature flags, A/B tests, or controlled rol

### ALWAYS

1. **Separate deployment from release**
2. **Set flag defaults safely**
3. **Include flag metadata**
4. **Plan for flag removal**
5. **Log flag evaluations**

### NEVER

1. **Use feature flags for permanent configuration**
2. **Let flags accumulate without cleanup**
3. **Nest flag checks deeply**
4. **Skip logging flag evaluations**
5. **Use flags for access control (use permissions instead)**

#### Example

```typescript
interface FlagContext {
  userId?: string;
  email?: string;
  country?: string;
  plan?: string;
  percentile?: number;  // 0-100, stable per user
  attributes?: Record<string, any>;
}

interface FlagRule {
  conditions: Condition[];
  result: boolean | string;
}

interface Flag {
  key: string;
  enabled: boolean;
  rules?: FlagRule[];
  defaultValue: boolean | string;
}

class FeatureFlagService {
  private flags: Map<string, Flag> = new Map();

---

## finops

> FinOps and cloud cost optimization: cost monitoring, resource right-sizing, reserved instances, spot instances, budget alerts, cost allocation. Trigger: When optimizing cloud costs or implementing Fin

### ALWAYS
1. **Tag all resources**
2. **Set budget alerts**
3. **Review costs regularly**
4. **Implement auto-scaling**
5. **Use appropriate storage tiers**

### NEVER
1. **Leave unused resources running**
2. **Skip resource tagging**
3. **Over-provision "just in case"**
4. **Ignore cost anomalies**
5. **Use on-demand for predictable workloads**

#### Example
```

┌─────────────────────────────────────────────┐
│ COMPUTE COST HIERARCHY │
├─────────────────────────────────────────────┤
│ MOST EXPENSIVE │
│ ↓ On-Demand Instances │
│ ↓ Savings Plans (1-3 year) │
│ ↓ Reserved Instances (1-3 year) │
│ ↓ Spot Instances (up to 90% off) │
│ LEAST EXPENSIVE │
│ │
│ STRATEGY: │
│ - Base load: Reserved/Savings Plans │
│ - Variable load: Auto-scaling + Spot │
│ - Burst: On-Demand │
└─────────────────────────────────────────────┘

````

---

## frontend

> Universal frontend patterns: component architecture, state management, accessibility, responsive design, performance optimization. Trigger: When creating UI components, managing state, or optimizing f

### ALWAYS
1. **Components should be small and focused**
2. **Prop drilling = consider context/state management**
3. **Accessibility first**
4. **Mobile-first responsive design**
5. **Handle loading and error states**
6. **Optimize images**
7. **Debounce user input**

### NEVER
1. **Don't mutate props/state directly**
2. **Don't hardcode strings (i18n)**
3. **Don't ignore TypeScript/types**
4. **Don't nest components too deep**
5. **Don't use `any`**

#### Example
```typescript
// MyComponent.tsx
interface MyComponentProps {
  title: string;
  onSave: (data: Data) => void;
}

export function MyComponent({ title, onSave }: MyComponentProps) {
  // 1. State
  const [data, setData] = useState<Data>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    fetchData().then(setData);
  }, []);

  // 3. Handlers
  const handleSave = async () => {
    setIsLoading(true);
    await onSave(data);
    setIsLoading(false);
  };

  // 4. Render

---

## git-workflow

> Git best practices: conventional commits, branching strategies, PR templates, code review standards, conflict resolution. Trigger: When committing code, creating PRs, reviewing code, or resolving merg

### ALWAYS
1. **Conventional Commits**
2. **Branch naming**
3. **Branch Protection Rules**
4. **Meaningful PR titles**
5. **Fill PR template completely**
6. **Keep PRs small**
7. **Code Review Guidelines**

### NEVER
1. **Don't commit directly to main**
2. **Don't commit secrets**
3. **Don't merge without review**
4. **Don't leave WIP commits**

#### Example
````

main
↑
└── feature/add-login (PR)
↑
└── feature/add-signup (PR)

```

---

## i18n

> Internationalization and localization: multi-language support, RTL layouts, date/time/currency formatting, pluralization, translation workflows. Trigger: When implementing multi-language support or lo

### ALWAYS
1. **Externalize ALL user-facing strings**
2. **Use ICU MessageFormat for complex strings**
3. **Use Intl APIs for formatting**
4. **Design UI for text expansion**
5. **Detect and handle RTL languages**

### NEVER
1. **Concatenate strings for translations**
2. **Assume date/number formats**
3. **Hardcode currency symbols**
4. **Assume left-to-right text direction**
5. **Split sentences across multiple keys**
6. **Use flags to represent languages**

#### Example
```

locales/
├── en/
│ ├── common.json # Shared strings
│ ├── auth.json # Auth-related
│ ├── dashboard.json # Dashboard page
│ └── errors.json # Error messages
├── es/
│ ├── common.json
│ ├── auth.json
│ └── ...
├── ar/ # RTL language
│ └── ...
└── zh-CN/ # Chinese Simplified
└── ...

```

---

## infrastructure

> Infrastructure as Code patterns: Terraform, Kubernetes, Docker, GitOps. Cloud architecture, service mesh, container security, IaC best practices. Trigger: When provisioning infrastructure or managing

### ALWAYS
1. **Infrastructure as Code (IaC)**
2. **Immutable infrastructure**
3. **Least privilege for all resources**
4. **Tag everything**
5. **Use private subnets for workloads**

### NEVER
1. **Hardcode secrets in IaC**
2. **Use default VPC for production**
3. **Allow 0.0.0.0/0 to sensitive ports**
4. **Skip state locking**
5. **Apply without plan review**
6. **Use latest tag for containers**

#### Example
```

infrastructure/
├── modules/
│ ├── vpc/
│ │ ├── main.tf
│ │ ├── variables.tf
│ │ └── outputs.tf
│ ├── eks/
│ └── rds/
├── environments/
│ ├── dev/
│ │ ├── main.tf
│ │ ├── variables.tf
│ │ ├── terraform.tfvars
│ │ └── backend.tf
│ ├── staging/
│ └── production/
└── shared/
└── s3-backend/

````

---

## logging

> Structured logging patterns: log levels, correlation IDs, log aggregation,  monitoring and alerting. Trigger: When adding logging, setting up monitoring, or debugging production issues.

### ALWAYS
1. **Structured Logging**
2. **Log Levels**
3. **Correlation IDs**
4. **Sanitize Sensitive Data**
5. **Context in Logs**
6. **Log Aggregation**

### NEVER
1. **Don't log in production at DEBUG level**
2. **Don't log sensitive data**
3. **Don't use print() for logging**
4. **Don't ignore errors in logs**

#### Example
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno
        }
        if hasattr(record, 'extra'):
            log_data.update(record.extra)
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_data)

logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),

---

## mobile

> Mobile development patterns for iOS, Android, React Native, Flutter. Offline-first, push notifications, app store guidelines, mobile security. Trigger: When building mobile apps or responsive mobile e

### ALWAYS
1. **Design for offline-first**
2. **Optimize for battery and data**
3. **Handle all network states**
4. **Respect platform guidelines**
5. **Implement proper deep linking**
6. **Secure local storage**

### NEVER
1. **Store sensitive data in plain text**
2. **Ignore memory management (leaks)**
3. **Block the main/UI thread**
4. **Skip testing on real devices**
5. **Ignore platform-specific behaviors**
6. **Hardcode API endpoints**
7. **Request unnecessary permissions**

#### Example
````

┌─────────────────────────────────────────────┐
│ PRESENTATION │
│ (UI, ViewModels, State Management) │
├─────────────────────────────────────────────┤
│ DOMAIN │
│ (Use Cases, Entities, Repository Intf) │
├─────────────────────────────────────────────┤
│ DATA │
│ (Repository Impl, API, Local DB) │
└─────────────────────────────────────────────┘

````

---

## observability

> Complete observability: distributed tracing, metrics, APM, alerting. SLIs/SLOs/SLAs, OpenTelemetry, Prometheus, Grafana, incident response. Trigger: When implementing monitoring, tracing, or defining

### ALWAYS
1. **Three Pillars of Observability**
2. **Implement all health check types**
3. **Use correlation IDs everywhere**
4. **Define SLIs before SLOs**
5. **Alert on symptoms, not causes**

### NEVER
1. **Alert on every error**
2. **Skip trace context propagation**
3. **Use high-cardinality labels in metrics**
4. **Ignore metric aggregation costs**
5. **Create dashboards without clear purpose**

#### Example
```yaml
# SLO Configuration
slos:
  - name: api_availability
    description: "API should be available"
    sli: success_rate
    target: 99.9%
    window: 30d

  - name: api_latency
    description: "API should be fast"
    sli: latency_p99
    target: 99%
    threshold: 200ms
    window: 30d

  - name: api_error_rate
    description: "Low error rate"
    sli: error_rate
    target: 99%
    threshold: 0.1%
    window: 30d
````

---

## performance

> Performance optimization patterns: caching, lazy loading, database optimization, profiling, bundle optimization. Trigger: When optimizing slow operations, reducing latency, or improving throughput.

### ALWAYS

1. **Measure Before Optimizing**
2. **Caching Strategy**
3. **Database Indexing**
4. **Lazy Loading**
5. **Pagination**
6. **Frontend Code Splitting**
7. **Compression**
8. **Connection Pooling**

### NEVER

1. **Don't optimize without measuring**
2. **Don't cache everything**
3. **Don't ignore N+1 queries**
4. **Don't fetch more data than needed**

---

## realtime

> Real-time communication patterns: WebSockets, Server-Sent Events, presence, live sync, notifications, collaborative editing, pub/sub architecture. Trigger: When implementing real-time features like ch

### ALWAYS

1. **Implement heartbeat/ping-pong**
2. **Handle reconnection gracefully**
3. **Use message queues for reliability**
4. **Implement proper authentication**
5. **Rate limit messages**

### NEVER

1. **Trust client-sent data without validation**
2. **Broadcast sensitive data to all clients**
3. **Keep connections without timeout**
4. **Skip message acknowledgments for critical data**
5. **Use WebSockets for simple request-response**

#### Example

```
WEBSOCKETS:
✓ Chat applications
✓ Real-time games
✓ Collaborative editing
✓ High-frequency bidirectional data

SERVER-SENT EVENTS (SSE):
✓ Live notifications
✓ News feeds
✓ Stock tickers
✓ Server-only updates

LONG POLLING:
✓ Fallback when WebSocket blocked
✓ Simple one-way updates
✓ Legacy browser support
```

---

## scalability

> Scalability patterns: horizontal scaling, load balancing, queues, microservices, data partitioning. Trigger: When planning system architecture for growth or handling increased load.

### ALWAYS

1. **Stateless Applications**
2. **Load Balancing**
3. **Horizontal > Vertical Scaling**
4. **Database Replication**
5. **Caching Layer**
6. **Message Queues for Async Work**
7. **Data Partitioning**
8. **Rate Limiting**
9. **Auto-scaling**

### NEVER

1. **Don't assume single-instance deployment**
2. **Don't create monolithic services**
3. **Don't ignore database connection limits**
4. **Don't use synchronous HTTP for long tasks**

#### Example

```
                        ┌─────────────────┐
                        │   Load Balancer │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    Auto-scaling Group   │
                    │  [App1, App2, App3...]   │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼──────┐
        │    Redis     │ │   Queue   │ │  Database  │
        │   (Cache)    │ │ (Worker)  │ │ (Primary)  │
        └───────────────┘ └───────────┘ └─────┬──────┘
                                           │
                                    ┌──────┴──────┐
                                    │ Replicas    │
                                    │ (Read-only) │
                                    └─────────────┘
```

---

## security

> Critical security patterns for any application: OWASP Top 10, authentication, authorization, secrets management, XSS/CSRF prevention, SQL injection prevention, Zero Trust, supply chain security, moder

### ALWAYS

1. **Validate input on BOTH sides**
2. **Use parameterized queries**
3. **Hash passwords with bcrypt/argon2**
4. **Use HTTPS in production**
5. **Implement rate limiting**
6. **Sanitize output**
7. **Use CSRF tokens for state-changing operations**
8. **Principle of least privilege**
9. **Implement security headers**

### NEVER

1. **Commit secrets to git**
2. **Trust client-side validation**
3. **Roll your own crypto**
4. **Expose internal IDs**
5. **Return raw error messages to clients**

#### Example

```
┌─────────────────────────────────────────────┐
│ ZERO TRUST PRINCIPLES                       │
│                                             │
│ 1. Never trust, always verify              │
│ 2. Assume breach                            │
│ 3. Verify explicitly                        │
│ 4. Use least privilege access               │
│ 5. Inspect and log all traffic              │
└─────────────────────────────────────────────┘
```

---

## testing

> Strategic testing patterns: Test Pyramid, TDD, mocking, integration tests, E2E testing, coverage goals, edge cases. Trigger: When writing tests, reviewing test coverage, or setting up test infrastruct

### ALWAYS

1. **Follow the Test Pyramid**
2. **Use Arrange-Act-Assert (AAA) pattern**
3. **Test behavior, not implementation**
4. **Mock external dependencies**
5. **Test edge cases**
6. **Use descriptive test names**
7. **Each test should be independent**

### NEVER

1. **Don't test third-party code**
2. **Don't test trivial code**
3. **Don't write fragile tests**
4. **Don't ignore failing tests**
5. **Don't write tests without assertions**

#### Example

```
1. RED    → Write failing test
2. GREEN  → Write minimal code to pass
3. REFACTOR → Clean up while tests pass
```

---

## Universal Patterns

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
  age: z.number().min(0).max(150),
});

const result = schema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### API Response Pattern

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...' } }

// Paginated
{ success: true, data: [...], pagination: { page: 1, limit: 20, total: 100 } }
```

### Database Query Pattern

```sql
-- Always use parameterized queries
SELECT * FROM users WHERE id = $1 AND status = $2;

-- Use transactions for multiple operations
BEGIN;
  UPDATE accounts SET balance = balance - $1 WHERE id = $2;
  UPDATE accounts SET balance = balance + $1 WHERE id = $3;
COMMIT;
```

---

## Compliance Quick Reference

| Regulation  | Key Requirements                                               |
| ----------- | -------------------------------------------------------------- |
| **GDPR**    | Consent, data portability, right to erasure, 72h breach notice |
| **HIPAA**   | PHI encryption, audit logs, BAA with vendors                   |
| **PCI-DSS** | No card storage, encryption in transit, quarterly scans        |
| **SOC 2**   | Security controls, annual audit, incident response             |

---

## Commands Quick Reference

```bash
# Git
git commit -m "feat(scope): description"
git rebase -i HEAD~3

# Testing
npm test -- --coverage --watchAll=false
pytest -v --cov=src

# Docker
docker build -t app:latest .
docker-compose up -d --build

# Kubernetes
kubectl apply -f k8s/
kubectl rollout status deployment/app

# Database
npm run db:migrate
npm run db:seed
```

---

**Skills source:** `SKILLS/`
**Total skills:** 40

_Generated automatically. Do not edit manually._
