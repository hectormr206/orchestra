# AI-Core Architecture

> Arquitectura y diseño del toolkit AI-Core

## 🏗️ Visión General

AI-Core es un toolkit de conocimiento universal que ayuda a LLMs a asistir mejor en desarrollo de software.

```
┌─────────────────────────────────────────────────────────┐
│                    AI-Core Toolkit                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Skills    │  │  Subagents  │  │   Patterns  │     │
│  │   (39)      │  │    (2)      │  │   (100+)    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Master Orchestrator                     │    │
│  │  (Analiza intento y selecciona recursos)        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Directorios

```
ai-core/
│
├── 📖 DOCUMENTACIÓN PRINCIPAL
│   ├── README.md              # Este archivo
│   ├── AGENTS.md              # Guía maestra
│   ├── CLAUDE.md              # Configuración Claude
│   ├── NEXT_STEPS.md          # Roadmap
│   ├── CHANGELOG.md           # Historial de cambios
│   │
│   ├── TUTORIAL.md            # Tutorial de usuario
│   └── ARCHITECTURE.md        # Este archivo
│
├── 🤖 SUBAGENTES
│   └── universal/
│       ├── master-orchestrator.md      # Orquestador central
│       ├── actor-critic-learner.md     # Sistema RL
│       └── permission-gatekeeper.md    # Guardián de seguridad
│
├── 🛠️ SKILLS (Conocimiento Universal)
│   ├── Core Development (7)
│   │   ├── security, testing, frontend
│   │   ├── backend, database, api-design
│   │   └── learning
│   │
│   ├── DevOps & Infrastructure (5)
│   │   ├── git-workflow, ci-cd
│   │   ├── infrastructure, disaster-recovery
│   │   └── finops
│   │
│   ├── Observability (5)
│   │   ├── observability, logging
│   │   ├── error-handling, performance
│   │   └── scalability
│   │
│   ├── Enterprise (4)
│   │   ├── compliance, audit-logging
│   │   ├── accessibility, i18n
│   │
│   └── [25+ más skills...]
│
├── 🧪 TESTING
│   ├── tests/skills/         # Tests de skills
│   └── tests/integration/    # Tests de integración
│
├── 📚 ADRs
│   └── docs/adr/             # Architecture Decision Records
│
└── 🔧 HERRAMIENTAS
    ├── run.sh                # Instalador
    └── .github/workflows/    # CI/CD
```

---

## 🔄 Flujo de Trabajo

### 1. Solicitud del Usuario

```
Usuario: "Agregar autenticación con OAuth2"
```

### 2. Análisis de Intento

```
Intent Analysis:
├─ Task Type: feature
├─ Domain: security + backend
└─ Complexity: medium
```

### 3. Selección de Recursos

```
Skills:
├─ security (OWASP, OAuth2 patterns)
├─ backend (API design)
└─ frontend (login UI)

Agent:
└─ feature-creator
```

### 4. Ejecución Coordinada

```
feature-creator:
├─ Design OAuth2 flow (security)
├─ Create backend endpoints (backend)
├─ Build login UI (frontend)
├─ Write tests (testing)
└─ Update docs (document-sync)
```

### 5. Resultado

```
✅ Complete authentication system
✅ Tests passing
✅ Documentation updated
```

---

## 🎯 Principios de Diseño

### 1. Universalidad
- Los skills aplican a CUALQUIER proyecto
- Independientes de tecnología específica
- Patrones agnósticos de stack

### 2. Componibilidad
- Los skills se combinan entre sí
- Los subagentes orquestan múltiples skills
- Resultados predecibles

### 3. Auto-mejora
- Sistema de aprendizaje RL
- Experiencia acumulada
- Mejora continua

### 4. Mantenibilidad
- Documentación clara
- Patrones consistentes
- Tests automáticos

---

## 📊 Estado Actual

| Métrica | Valor |
|---------|-------|
| Skills | 39 |
| Subagentes | 3 |
| Patterns | 150+ |
| ADRs | 4 |
| Tests | 37/39 (95%) |

---

## 🚀 Próximos Pasos

Ver `NEXT_STEPS.md` para el roadmap de desarrollo.
