# AI Manifest (UNIVERSAL)

> **Kernel Methodology** - Metodología universal para cualquier proyecto.
> Enterprise-ready: **30 skills** cubriendo desarrollo, DevOps, compliance, AI/ML, FinOps y arquitectura.
>
> Compatible con [agentskills.io](https://agentskills.io) y [agents.md](https://agents.md).

---

## 1. PATRÓN ESTRUCTURAL (File System Logic)

```
/ai-core/
├── SKILLS/
│   ├── {skill-name}/
│   │   ├── SKILL.md          # YAML frontmatter + Markdown
│   │   ├── assets/           # Opcional: templates, scripts
│   │   └── references/       # Opcional: links a docs
│   │
│   ├── # === CORE DEVELOPMENT ===
│   ├── security/             # 🔒 OWASP, Zero Trust, auth, Passkeys
│   ├── testing/              # 🧪 Test Pyramid, TDD, mocks
│   ├── frontend/             # 🎨 Components, state, a11y
│   ├── backend/              # ⚙️ REST/GraphQL, validation
│   ├── mobile/               # 📱 iOS, Android, React Native, Flutter
│   ├── database/             # 🗄️ Schema, indexing, migrations
│   ├── api-design/           # 🌐 Versioning, docs, rate limiting
│   │
│   ├── # === DEVOPS & INFRASTRUCTURE ===
│   ├── git-workflow/         # 📦 Commits, branching, PRs
│   ├── ci-cd/                # 🚀 Pipelines, deployment
│   ├── infrastructure/       # ☁️ Terraform, K8s, Docker, GitOps
│   ├── disaster-recovery/    # 🆘 RPO/RTO, backups, failover
│   ├── finops/               # 💰 Cloud cost optimization
│   │
│   ├── # === OBSERVABILITY & RELIABILITY ===
│   ├── observability/        # 📊 Tracing, metrics, APM, SLIs/SLOs
│   ├── logging/              # 📋 Structured logs, correlation IDs
│   ├── error-handling/       # ⚠️ Retries, circuit breakers
│   ├── performance/          # ⚡ Caching, profiling
│   ├── scalability/          # 📈 Horizontal scaling, queues
│   │
│   ├── # === ENTERPRISE & COMPLIANCE ===
│   ├── compliance/           # ⚖️ GDPR, HIPAA, SOC 2, PCI-DSS
│   ├── audit-logging/        # 📝 Immutable trails, forensics
│   ├── accessibility/        # ♿ WCAG 2.1, ADA, Section 508
│   ├── i18n/                 # 🌍 Multi-language, RTL, formatting
│   │
│   ├── # === ARCHITECTURE & DESIGN ===
│   ├── architecture/         # 🏗️ Microservices, DDD, CQRS
│   ├── documentation/        # 📚 README, API docs, ADRs
│   ├── dependency-management/# 📦 SBOM, vulnerabilities, licenses
│   ├── realtime/             # ⚡ WebSockets, SSE, live sync
│   │
│   ├── # === AI & DATA ===
│   ├── ai-ml/                # 🤖 LLMs, RAG, embeddings, MLOps
│   ├── data-analytics/       # 📈 ETL/ELT, BI, event tracking
│   │
│   └── # === DEVELOPER EXPERIENCE ===
│       ├── code-quality/         # ✅ Linting, SonarQube, pre-commit
│       ├── developer-experience/ # 🛠️ Dev containers, onboarding
│       └── feature-flags/        # 🚩 A/B testing, gradual rollouts
│
├── AI_MANIFEST.md            # Este archivo
├── AGENTS.md                 # Guía maestra universal
└── run.sh                    # Instalación en un comando

# Symlinks creados en proyecto raíz:
/.claude/skills/   ────┐
/.codex/skills/    ────┤──> symlinks ──> /SKILLS/
/.gemini/skills/   ────┘
```

### ONE-LINE INSTALACIÓN
```bash
cd /path/to/project/ai-core && ./run.sh
```

---

## 2. ALGORITMO DE SKILLS (Lazy Loading)

```python
def load_skill(user_request):
    skill = inferir_skill(user_request)
    # Lee primero de ai-core/SKILLS (universal)
    universal_path = f"/SKILLS/{skill}/SKILL.md"
    if exists(universal_path):
        return read(universal_path)
    # Luego busca en project/SKILLS (específico)
    project_path = f"/skills/{skill}/SKILL.md"
    if exists(project_path):
        return read(project_path)
    return crear_skill(skill, user_request)
```

### [PLANTILLA_ESTÁNDAR]
```yaml
---
# === CAMPOS OBLIGATORIOS ===
name: {kebab-case-name}
description: >
  {One-liner}. Trigger: {cuándo cargar este skill}.

# === CAMPOS RECOMENDADOS ===
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: "{Action}"  # string o ["Action 1", "Action 2"]

# === CAMPOS OPCIONALES ===
# allowed-tools: [Read,Edit,Write,Glob,Grep,Bash,Task]
# tags: [frontend, testing, security]
---

## When to Use
- {casos de uso}

## Critical Patterns
> **ALWAYS**: {regla 1}
> **NEVER**: {regla 1}

## Example
```python
{ejemplo mínimo}
```

## Commands
```bash
{comandos}
```
```

---

## 3. PROTOCOLO DE INDEXACIÓN

### LECTURA POR PRIORIDAD
```
1. /ai-core/AGENTS.md           ← Universal primero
2. /AGENTS.md                   ← Específico del proyecto (override)
3. /SKILLS/{skill}/     ← Patrones universales
4. /SKILLS/{skill}/             ← Patrones específicos (override)

Precedencia: Proyecto > Universal
```

### AGREGAR NUEVO SKILL UNIVERSAL
```bash
mkdir -p SKILLS/{new-skill}
cat > SKILLS/{new-skill}/SKILL.md << 'EOF'
<usar plantilla arriba>
EOF

# Actualizar ai-core/AGENTS.md con nueva entrada
```

---

## 4. CLÁUSULA DE AUTO-MEJORA

```
IF discovers_optimization(proceso):
  NO solo memorizar_en_chat()
  ACTUALIZAR [PLANTILLA_ESTÁNDAR] en este archivo
  OBJETIVO: Futuros agentes heredan la optimización
```

---

## 5. META-DISEÑO

| Principio        | Regla                              |
|------------------|-------------------------------------|
| **Universal**    | Agnóstico al stack                 |
| **Conciso**      | <500 líneas/skill                   |
| **Progressive**  | Referenciar, no duplicar           |
| **Critical-first**| ALWAYS/NEVER al inicio             |
| **Override**     | Proyecto puede sobreescribir universal|
| **Enterprise**   | Compliance-ready desde el inicio   |

---

## 6. SKILLS UNIVERSALES (30 Total)

### Core Development (7)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `security`    | 🔒 Crítico    | OWASP Top 10, Zero Trust, Passkeys |
| `testing`     | 🧪 Crítico    | Test Pyramid, TDD, mocks       |
| `frontend`    | 🎨 UI/UX      | Componentes, state, a11y       |
| `backend`     | ⚙️ API        | REST, validation, errors       |
| `mobile`      | 📱 Mobile     | iOS, Android, RN, Flutter      |
| `database`    | 🗄️ Data       | Schema, indexing, migrations   |
| `api-design`  | 🌐 Integration | Versioning, docs, rate limit  |

### DevOps & Infrastructure (5)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `git-workflow`| 📦 VCS        | Commits, branching, PRs        |
| `ci-cd`       | 🚀 DevOps     | Pipelines, deployment          |
| `infrastructure`| ☁️ IaC      | Terraform, K8s, Docker, GitOps |
| `disaster-recovery`| 🆘 DR    | RPO/RTO, backups, failover     |
| `finops`      | 💰 FinOps     | Cloud cost optimization        |

### Observability & Reliability (5)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `observability`| 📊 Monitoring | Tracing, metrics, APM, SLOs   |
| `logging`     | 📋 Logs       | Structured logs, correlation   |
| `error-handling`| ⚠️ Reliability| Retries, circuit breakers     |
| `performance` | ⚡ Optimization| Caching, profiling           |
| `scalability` | 📈 Architecture| Horizontal scaling, queues  |

### Enterprise & Compliance (4)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `compliance`  | ⚖️ Legal      | GDPR, HIPAA, SOC 2, PCI-DSS    |
| `audit-logging`| 📝 Forensics | Immutable trails, compliance   |
| `accessibility`| ♿ A11y      | WCAG 2.1, ADA, Section 508     |
| `i18n`        | 🌍 Global     | Multi-language, RTL, formatting|

### Architecture & Design (4)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `architecture`| 🏗️ Design     | Microservices, DDD, CQRS       |
| `documentation`| 📚 Knowledge | README, API docs, ADRs         |
| `dependency-management`| 📦 Supply Chain | SBOM, vulnerabilities, licenses |
| `realtime`    | ⚡ Realtime   | WebSockets, SSE, live sync     |

### AI & Data (2)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `ai-ml`       | 🤖 AI/ML      | LLMs, RAG, embeddings, MLOps   |
| `data-analytics`| 📈 Data     | ETL/ELT, BI, event tracking    |

### Developer Experience (3)

| Skill         | Categoría     | Foco                           |
|---------------|---------------|--------------------------------|
| `code-quality`| ✅ Quality    | Linting, SonarQube, pre-commit |
| `developer-experience`| 🛠️ DX | Dev containers, onboarding     |
| `feature-flags`| 🚩 Release   | A/B testing, gradual rollouts  |

---

## 7. ESTÁNDARES COMPATIBLES

| Estándar         | Descripción                           |
|------------------|---------------------------------------|
| **[Agent Skills](https://agentskills.io)** | Formato abierto de Anthropic |
| **[AGENTS.md](https://agents.md)** | README para agentes (60k+ proyectos) |
| **[anthropics/skills](https://github.com/anthropics/skills)** | Repo de referencia |
| **OWASP** | Security standards |
| **WCAG 2.1** | Accessibility guidelines |
| **CycloneDX/SPDX** | SBOM formats |

---

## 8. ENTERPRISE COMPLIANCE MATRIX

| Regulation | Skill | Key Requirements |
|------------|-------|------------------|
| **GDPR** | `compliance` | Consent, DSAR, DPO, 72h breach notice |
| **HIPAA** | `compliance` | PHI protection, BAA, audit logs |
| **SOC 2** | `compliance`, `audit-logging` | Trust principles, annual audit |
| **PCI-DSS** | `compliance`, `security` | Card data security, quarterly scans |
| **ISO 27001** | `security`, `compliance` | ISMS, risk assessment |
| **ADA/Section 508** | `accessibility` | WCAG 2.1 AA compliance |
| **CCPA** | `compliance` | Opt-out, Do Not Sell |

---

**EOF**
