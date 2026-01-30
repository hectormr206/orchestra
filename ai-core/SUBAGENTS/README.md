# AI-Core Subagents

> **Subagentes especializados** que aprovechan el ecosistema de SKILLS de ai-core.
> Compatibles con: Claude Code, OpenCode, Gemini CLI, GitHub Copilot

---

## Overview

Los **subagentes** son asistentes de IA especializados que se delegan para tareas específicas. Este directorio contiene una colección de subagentes pre-configurados que utilizan las SKILLS de ai-core como base de conocimiento.

### Plataformas Soportadas

| Plataforma | Formato | Estado | Compatibilidad |
|------------|---------|--------|----------------|
| **Claude Code** | Markdown + YAML | ✅ Stable | 100% |
| **OpenCode** | Markdown + YAML | ✅ Stable | 95% |
| **Gemini CLI** | Markdown + YAML | ⚠️ Experimental | 85% |
| **GitHub Copilot** | Markdown + YAML | 🔄 Public Preview | 80% |

---

## Estructura

```
SUBAGENTS/
├── README.md                    # Este archivo
├── PLATFORMS.md                 # Guía de configuración por plataforma
├── ROADMAP.md                   # Roadmap de desarrollo
├── AGENTS.md                    # Instrucciones para Codex/Antigravity
├── .cursorrules                 # Reglas para Cursor Editor
├── workflow/                    # Workflow Agents (orquestran flujos completos)
│   ├── project-scaffolder.md    # Crea proyectos completos desde cero
│   ├── bug-fixer.md             # Arregla bugs con pruebas de regresión
│   ├── feature-creator.md       # Automatiza 80% del desarrollo de features
│   ├── pr-reviewer.md           # Revisión automática de Pull Requests
│   ├── code-refactorer.md       # Refactoriza código mejorando calidad
│   ├── tech-lead.md             # Toma decisiones técnicas con análisis
│   └── onboarding-buddy.md      # Ayuda a nuevos developers a empezar
├── universal/                   # Specialist Agents (expertos técnicos)
│   ├── frontend-specialist.md
│   ├── backend-specialist.md
│   ├── security-specialist.md
│   ├── testing-specialist.md
│   ├── code-reviewer.md
│   ├── database-specialist.md
│   ├── devops-specialist.md
│   ├── performance-optimizer.md
│   ├── architecture-advisor.md
│   ├── ai-ml-engineer.md
│   ├── infrastructure-specialist.md
│   ├── documentation-writer.md
│   ├── api-designer.md
│   ├── data-engineer.md
│   ├── realtime-specialist.md
│   ├── mobile-specialist.md
│   ├── accessibility-auditor.md
│   ├── compliance-auditor.md
│   ├── migrations-specialist.md
│   └── dependency-auditor.md
└── .agents/                     # Configuraciones específicas por plataforma
    ├── claude-code/             # Agentes para Claude Code
    ├── opencode/                # Agentes para OpenCode
    ├── gemini/                  # Skills para Gemini CLI
    └── github-copilot/          # Custom agents para GitHub Copilot
```

---

## Tipos de Subagentes

### 🤖 Workflow Agents

Los **Workflow Agents** orquestan **flujos completos de trabajo** multi-paso. A diferencia de los Specialist Agents que son expertos en un área técnica, los Workflow Agents coordinan todo un proceso de principio a fin.

| Workflow Agent | Propósito | Impacto |
|----------------|----------|---------|
| **project-scaffolder** | Crea proyectos completos desde cero | 🔴 EXTREMO |
| **bug-fixer** | Arregla bugs con pruebas de regresión | 🔴 MUY ALTO |
| **feature-creator** | Automatiza 80% del desarrollo de features | 🔴 MUY ALTO |
| **pr-reviewer** | Revisión automática de Pull Requests | 🟡 MEDIO |
| **code-refactorer** | Refactoriza código manteniendo tests | 🟡 MEDIO |
| **tech-lead** | Toma decisiones técnicas con trade-offs | 🟡 MEDIO |
| **onboarding-buddy** | Ayuda a nuevos developers a empezar | 🟢 BAJO |

**Ejemplos de uso:**
```
# Crear proyecto completo
/project-scaffolder Create a SaaS with React + Node.js + PostgreSQL

# Arreglar bug automáticamente
/bug-fixer Login fails for users with special characters in password

# Crear feature completa
/feature-creator Add OAuth2 authentication with Google and GitHub

# Revisar PR
/pr-reviewer Review PR #123

# Refactorizar código
/code-refactorer Refactor user service to follow Repository pattern

# Decisión técnica
/tech-lead Should we use microservices or monolith for our MVP?

# Onboarding
/onboarding-buddy Help me get started with this project
```

### 👨‍💻 Specialist Agents

Los **Specialist Agents** son **expertos técnicos** en áreas específicas del desarrollo.

| Specialist Agent | Especialidad | SKILLS Utilizadas |
|------------------|--------------|-------------------|

---

## Subagentes Disponibles

### Core Development

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **frontend-specialist** | UI components, state management, a11y | frontend, accessibility, i18n |
| **backend-specialist** | APIs, validation, error handling | backend, api-design, error-handling |
| **security-specialist** | OWASP Top 10, Zero Trust, auth | security, compliance, audit-logging |
| **testing-specialist** | Test Pyramid, TDD, coverage | testing, performance |
| **code-reviewer** | Quality, security, maintainability | code-quality, security, testing |

### Database & DevOps

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **database-specialist** | Schema design, indexing, migrations | database, performance |
| **devops-specialist** | CI/CD, infrastructure, GitOps | ci-cd, infrastructure, git-workflow |
| **infrastructure-specialist** | Terraform, Kubernetes, AWS/GCP/Azure | infrastructure, finops, disaster-recovery |
| **migrations-specialist** | Zero-downtime migrations, schema evolution | database, ci-cd, disaster-recovery |

### Performance & Architecture

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **performance-optimizer** | Caching, profiling, optimization | performance, scalability, observability |
| **architecture-advisor** | DDD, CQRS, microservices | architecture, documentation, scalability |

### API & Data

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **api-designer** | REST/GraphQL, versioning, rate limiting | api-design, backend, documentation |
| **data-engineer** | ETL/ELT, pipelines, BI dashboards | data-analytics, database, observability |
| **realtime-specialist** | WebSockets, SSE, live collaboration | realtime, backend, scalability |

### Mobile & Accessibility

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **mobile-specialist** | React Native, Flutter, offline-first | mobile, frontend, realtime |
| **accessibility-auditor** | WCAG 2.1 AA, screen readers | accessibility, frontend, i18n |

### Compliance & Documentation

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **compliance-auditor** | GDPR, HIPAA, SOC 2, PCI-DSS | compliance, audit-logging, security |
| **documentation-writer** | README, API docs, ADRs | documentation, developer-experience |
| **dependency-auditor** | Vulnerability scanning, SBOM, licenses | dependency-management, security, code-quality |

### AI & ML

| Subagente | Especialidad | SKILLS Utilizadas |
|-----------|--------------|-------------------|
| **ai-ml-engineer** | LLMs, RAG, vector DBs, MLOps | ai-ml, data-analytics, realtime |

---

## Uso Rápido

### Claude Code

```bash
# Invocar un subagente específico
/frontend-specialist Create a React component with TypeScript

# O dejar que Claude decida cuándo usarlo
I need to add authentication to my API
# Claude invocará automáticamente security-specialist
```

### OpenCode

```bash
# Usar el agente con @
@backend-specialist Create a REST API endpoint for user management

# Ver todos los agentes disponibles
/agents
```

### Gemini CLI

```bash
# Instalar skills
gemini skills install ./ai-core/SUBAGENTS/.agents/gemini/

# Usar el skill
gemini "Review my code for security issues"
# Gemini activará security-specialist skill
```

### GitHub Copilot

```bash
# Copiar los agentes al repositorio
cp -r ./ai-core/SUBAGENTS/.agents/github-copilot/* .github/copilot-instructions.md

# Invocar en VS Code
@security-specialist Help me implement OAuth2
```

---

## Instalación

### Opción 1: Instalar Todos los Subagentes

```bash
# Desde tu proyecto
cd /path/to/your/project

# Clonar o copiar ai-core
git clone https://github.com/hectormr206/ai-core.git ./ai-core

# Ejecutar el script de instalación
cd ai-core && ./run.sh
```

### Opción 2: Instalar Subagentes Específicos

```bash
# Copiar solo los subagentes que necesites
cp ./ai-core/SUBAGENTS/universal/security-specialist.md .claude/agents/

# O crear un symlink
ln -s ./ai-core/SUBAGENTS/universal/security-specialist.md .claude/agents/
```

### Opción 3: Multi-Plataforma

```bash
# run.sh instala automáticamente todo para todas las plataformas soportadas
cd ai-core && ./run.sh

# Los subagentes quedan accesibles vía symlink en:
# .claude/agents → ai-core/SUBAGENTS/
```

---

## Crear Subagentes Personalizados

Basándote en los SKILLS de ai-core, puedes crear tus propios subagentes:

```markdown
---
name: my-custom-agent
description: >
  Expert in [your specialty]. Use when working on [specific tasks].
tools: [Read,Edit,Write,Grep,Bash]
model: inherit
platforms:
  claude-code: true
  opencode: true
  gemini-cli: true
  github-copilot: true
---

# My Custom Agent

You are an expert in [your specialty].

## When to Use

- [Specific scenario 1]
- [Specific scenario 2]

## Skills to Reference

- `ai-core/SKILLS/related-skill-1/SKILL.md`
- `ai-core/SKILLS/related-skill-2/SKILL.md`

## Critical Patterns

### > **ALWAYS**

1. Pattern one
2. Pattern two

### > **NEVER**

1. Anti-pattern one
2. Anti-pattern two

## Examples

### Example 1: Title

\`\`\`language
code here
\`\`\`
```

---

## Automatización

El script `run.sh` automatiza la instalación completa:

1. **Detección de plataforma**: Detecta automáticamente qué plataformas estás usando
2. **Instalación inteligente**: Crea symlinks automáticamente (o copias en Windows)
3. **Conversión de formato**: Los agentes ya tienen formato compatible con todas las plataformas
4. **Validación**: Verifica que SKILLS y SUBAGENTS existan
5. **Actualización**: Re-ejecutar `run.sh` actualiza la instalación

```bash
# Instalar o actualizar
cd ai-core && ./run.sh
```

---

## Compatibilidad de Formatos

### Herramientas

| Claude Code | OpenCode | Gemini | GitHub Copilot |
|-------------|----------|--------|----------------|
| `Read` | `read: true` | ✅ | `read` |
| `Edit` | `edit: true` | ✅ | `edit` |
| `Write` | `write: true` | ✅ | `edit` |
| `Bash` | `bash: true` | ✅ | `execute` |
| `Grep` | `grep: true` | ✅ | `search` |
| `Glob` | `glob: true` | ✅ | `search` |

### Metadatos

```yaml
# Universal (compatible con todas)
---
name: agent-name
description: Agent description
tools: [Read,Edit,Write,Bash,Grep]
platforms:
  claude-code: true
  opencode: true
  gemini-cli: true
  github-copilot: true
---
```

---

## Troubleshooting

### Los subagentes no aparecen

```bash
# Verificar instalación
ls -la .claude/agents/
ls -la .opencode/agents/

# Recargar Claude Code
/agents reload
```

### Errores de sintaxis

```bash
# Validar formato YAML
./ai-core/scripts/validate-subagents.sh
```

### Conflictos con otros agentes

---

## Contribuir

Para añadir un nuevo subagente:

1. Crear el archivo en `SUBAGENTS/universal/` o `SUBAGENTS/workflow/`
2. Seguir el formato universal de Claude Code
3. Añadir la entrada al README
4. Ejecutar `run.sh` para actualizar la instalación
5. Probar en todas las plataformas soportadas

---

## Licencia

Apache-2.0 - Ver [LICENSE](../LICENSE)

---

**EOF**
