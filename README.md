# Orchestra 🎼

**Orchestra** is a Meta-Orchestrator for AI development tools that coordinates multiple AI agents (Claude, Codex, Gemini, GLM) to perform complex development tasks through intelligent task automation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

---

## Features

- 🤖 **Multi-Agent Orchestration** - Coordinates Architect, Executor, Auditor, and Consultant agents
- 🔄 **Automatic Fallback** - Seamless provider switching (Codex → Gemini → GLM)
- 🎨 **Dual Interface** - Both CLI and TUI (Terminal User Interface) modes
- 🔍 **Syntax Validation** - Multi-language support (Python, TypeScript, JavaScript, Go, Rust)
- 🧪 **Test Integration** - Auto-detection of test frameworks (pytest, jest, vitest, go test, cargo test)
- 💾 **Session Persistence** - Resume interrupted sessions with full state recovery
- ⚡ **Parallel Execution** - Concurrent file processing with configurable workers
- 🔧 **Recovery Mode** - Automatic error recovery with iterative fixes
- 📊 **Performance Metrics** - Built-in telemetry and monitoring
- 🎯 **Pipeline Mode** - Execute and audit simultaneously for faster feedback

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/orchestra.git
cd orchestra

# Install dependencies
npm install

# Build project
npm run build

# Set up API keys
export ZAI_API_KEY="your-api-key"        # Required for GLM
export GEMINI_API_KEY="your-key"         # Optional
export OPENAI_API_KEY="your-key"         # Optional

# Initialize configuration
npm run start -- init
```

---

## Quick Start

### CLI Mode

```bash
# Start a new orchestration task
orchestra start "Add user authentication to the API"

# Resume interrupted session
orchestra resume

# Pipeline execution (faster feedback)
orchestra pipeline "Refactor database queries"

# Watch mode (auto-reload on changes)
orchestra watch "Implement search feature"

# Dry-run (analyze without execution)
orchestra dry-run "Optimize performance"

# View current status
orchestra status

# View execution plan
orchestra plan

# View session history
orchestra history
```

### TUI Mode

```bash
# Launch Terminal User Interface
npm run tui
# or
orchestra tui
```

The TUI provides:
- 📊 **Dashboard** - Real-time overview and metrics
- ⚙️ **Execution Screen** - Live progress tracking
- 📝 **Plan Review** - Approve/edit execution plans
- 📈 **Metrics View** - Performance analytics
- 🔧 **Settings** - Configuration management
- 📜 **History** - Session history browser

---

## 🔄 Ciclo de Ejecución Interno / Internal Execution Cycle

Este es el flujo completo que Orchestra ejecuta internamente cuando procesas una tarea:

### 1️⃣ Inicialización de Sesión
```
Entrada: "Implementa autenticación de usuarios"
   ↓
Sistema crea:
- Session ID único
- State Manager (.orchestra/session.json)
- Metrics Collector
- Checkpoint inicial
```

**Componentes activados:**
- `StateManager` - Gestión de estado persistente
- `MetricsCollector` - Recolección de métricas de rendimiento
- `SessionHistory` - Registro histórico de sesiones

### 2️⃣ Fase de Planificación (Architect Agent)
```
Architect (con fallback: Codex → Gemini → GLM 4.7)
   ↓
Analiza:
- Complejidad de la tarea
- Archivos involucrados
- Dependencias del proyecto
- Riesgos potenciales
   ↓
Genera:
- Plan de implementación detallado
- Lista de archivos a modificar/crear
- Estimación de tiempo
- Estrategia de ejecución
   ↓
Guarda: .orchestra/plan.json
```

**Salida del Architect:**
```json
{
  "task": "Implementa autenticación de usuarios",
  "files": [
    {
      "path": "src/auth/AuthService.ts",
      "action": "create",
      "description": "Servicio de autenticación con JWT"
    },
    {
      "path": "src/middleware/authMiddleware.ts",
      "action": "create",
      "description": "Middleware de validación"
    }
  ],
  "dependencies": ["jsonwebtoken", "bcrypt"],
  "risks": ["Seguridad: almacenamiento de contraseñas"],
  "estimatedTime": "30 minutos"
}
```

### 3️⃣ Aprobación del Plan (Interactivo)
```
Usuario revisa plan
   ↓
Opciones:
✅ Aprobar → Continuar a ejecución
✏️  Editar → Modificar plan
❌ Rechazar → Cancelar operación
```

**En modo TUI:**
- Vista interactiva del plan
- Editor inline para modificaciones
- Visualización de riesgos y dependencias

### 4️⃣ Fase de Ejecución (Executor Agent)
```
Executor (GLM 4.7)
   ↓
Para cada archivo en el plan:
   1. Lee contexto del archivo (si existe)
   2. Genera código basado en el plan
   3. Aplica validación de sintaxis
   4. Crea checkpoint de estado
   ↓
Modos de ejecución:
- Sequential: Un archivo a la vez
- Parallel: Múltiples archivos (maxConcurrency: 3)
- Pipeline: Ejecución + auditoría simultánea
```

**Proceso por archivo:**
```typescript
ejecutar_archivo(plan.files[i]) {
  // 1. Leer contexto
  contexto = leer_archivo_si_existe(ruta)

  // 2. Generar código
  código = executor.generate({
    archivo: plan.files[i],
    contexto: contexto,
    plan_completo: plan
  })

  // 3. Validar sintaxis
  if (!validator.validate(código, lenguaje)) {
    registrar_error()
    return RETRY
  }

  // 4. Aplicar cambios
  escribir_archivo(ruta, código)

  // 5. Crear checkpoint
  checkpoint.save(estado_actual)
}
```

### 5️⃣ Fase de Auditoría (Auditor Agent)
```
Auditor (con fallback: Gemini → GLM 4.7)
   ↓
Revisa:
✓ Calidad del código
✓ Cumplimiento del plan
✓ Buenas prácticas
✓ Seguridad (OWASP Top 10)
✓ Completitud
   ↓
Resultado:
✅ APROBADO → Continuar
⚠️  ISSUES → Enviar a Consultant
```

**Criterios de auditoría:**
```typescript
audit_criteria = {
  code_quality: {
    - Estructura clara
    - Nombres descriptivos
    - Sin código duplicado
  },
  security: {
    - Sin inyecciones SQL
    - Validación de entrada
    - Sanitización de datos
  },
  completeness: {
    - Todas las funciones del plan
    - Manejo de errores
    - Logging apropiado
  }
}
```

### 6️⃣ Fase de Consultoría (Conditional - si hay issues)
```
SI (auditor encuentra problemas):
   ↓
Consultant (con fallback: Codex → Gemini → GLM 4.7)
   ↓
Analiza:
- Errores detectados por Auditor
- Problemas algorítmicos
- Optimizaciones necesarias
   ↓
Genera:
- Sugerencias de corrección
- Código corregido
- Explicación de cambios
   ↓
Executor aplica correcciones
   ↓
Volver a Auditoría
   ↓
[Loop hasta aprobación o max_iterations = 10]
```

**Ejemplo de consultoría:**
```
Issue detectado:
"Contraseña almacenada en texto plano"

Consultant recomienda:
1. Usar bcrypt para hashing
2. Agregar salt único por usuario
3. Implementar política de contraseñas fuertes

Código corregido:
await bcrypt.hash(password, SALT_ROUNDS)
```

### 7️⃣ Modo de Recuperación (Recovery Mode)
```
SI (fallan múltiples auditorías):
   ↓
Recovery Mode activado
   ↓
Intentos (max: 3):
   1. Validación exhaustiva de sintaxis
   2. Detección de código incompleto
   3. Regeneración completa si necesario
   4. Verificación de dependencias
   ↓
SI (falla recuperación):
   ↓
Opciones:
- Auto-revert: Restaurar desde checkpoint
- Manual fix: Pausar para corrección manual
```

**Proceso de recuperación:**
```typescript
recovery_mode() {
  intentos = 0

  while (intentos < maxRecoveryAttempts) {
    // Validar sintaxis
    errores = validator.validate_all()

    // Detectar código incompleto
    if (detectar_codigo_incompleto()) {
      regenerar_archivo_completo()
    }

    // Verificar dependencias
    verificar_imports_exports()

    // Intentar auditoría de nuevo
    if (auditor.audit() === APROBADO) {
      return SUCCESS
    }

    intentos++
  }

  // Si todo falla
  if (config.autoRevertOnFailure) {
    checkpoint.restore(ultimo_estado_valido)
  }

  return FAILURE
}
```

### 8️⃣ Ejecución de Tests (Opcional)
```
SI (config.test.runAfterGeneration === true):
   ↓
Test Runner (auto-detección)
   ↓
Detecta framework:
- Python: pytest, unittest
- JavaScript/TypeScript: jest, vitest
- Go: go test
- Rust: cargo test
   ↓
Ejecuta tests:
npm test (o comando configurado)
   ↓
Resultados:
✅ Tests OK → Continuar
❌ Tests FAIL → Recovery Mode o notificar
```

**Auto-detección de frameworks:**
```typescript
detectar_framework() {
  if (existe('pytest.ini')) return 'pytest'
  if (existe('jest.config.js')) return 'jest'
  if (existe('vitest.config.ts')) return 'vitest'
  if (existe('*_test.go')) return 'go test'
  if (existe('Cargo.toml')) return 'cargo test'

  return config.test.command // Fallback manual
}
```

### 9️⃣ Git Commit (Opcional)
```
SI (config.git.autoCommit === true):
   ↓
Git Integration
   ↓
Proceso:
1. git add [archivos modificados]
2. Genera mensaje (conventional commits)
3. git commit -m "feat: implementa autenticación"
4. Agrega co-author: Claude Sonnet
   ↓
NO hace push automático (seguridad)
```

**Formato de commit:**
```bash
git commit -m "$(cat <<EOF
feat: implementa autenticación de usuarios

- Agrega AuthService con JWT
- Implementa middleware de validación
- Añade tests de integración

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 🔟 Sistema de Aprendizaje (Learning System)
```
Learning Manager (modos: disabled, shadow, ab_test, production)
   ↓
Recolecta experiencia:
- Estado inicial (contexto de la tarea)
- Acción tomada (estrategia, parámetros)
- Resultado (éxito, tiempo, errores)
- Recompensa calculada
   ↓
Experience Collector guarda: .orchestra/experiences.jsonl
   ↓
Entrenamiento periódico:
Actor-Critic Neural Network (TensorFlow.js)
   ↓
Optimiza futuras decisiones:
- Selección de agentes
- Estrategia de ejecución
- Paralelismo óptimo
- Timeout adaptativo
```

**Cálculo de recompensa:**
```typescript
compute_reward(outcome) {
  reward = 0

  // Éxito/Fracaso base
  reward += outcome.success ? +100 : -100

  // Eficiencia de tiempo
  time_efficiency = estimated_time / actual_time
  reward += time_efficiency * 20

  // Eficiencia de recursos
  if (resources_used <= minimum_needed) reward += 10
  else reward -= (resources_used - minimum_needed) * 5

  // Calidad (errores)
  reward -= outcome.error_count * 10

  // Satisfacción del usuario
  reward -= outcome.user_modifications * 5

  // Seguridad
  if (outcome.safety_violations) reward -= 50

  return reward
}
```

**Modos de aprendizaje:**
- **disabled**: No aprende, solo usa reglas heurísticas
- **shadow**: Aprende observando pero no usa política aprendida
- **ab_test**: 10% usa política aprendida, 90% reglas (A/B testing)
- **production**: 100% política aprendida con fallback a reglas

---

## 📊 Resumen del Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ USUARIO: "Implementa autenticación de usuarios"            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. INICIALIZACIÓN                                           │
│    - Crear sesión                                           │
│    - State Manager                                          │
│    - Metrics Collector                                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PLANIFICACIÓN (Architect)                               │
│    - Analizar tarea                                         │
│    - Generar plan                                           │
│    - Estimar recursos                                       │
│    Fallback: Codex → Gemini → GLM                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. APROBACIÓN                                               │
│    Usuario: ✅ Aprobar / ✏️  Editar / ❌ Rechazar           │
└────────────────────┬────────────────────────────────────────┘
                     ↓ (si aprobado)
┌─────────────────────────────────────────────────────────────┐
│ 4. EJECUCIÓN (Executor - GLM 4.7)                          │
│    - Generar código                                         │
│    - Validar sintaxis                                       │
│    - Aplicar cambios                                        │
│    Modo: Sequential / Parallel / Pipeline                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. AUDITORÍA (Auditor)                                     │
│    - Revisar calidad                                        │
│    - Verificar seguridad                                    │
│    - Validar completitud                                    │
│    Fallback: Gemini → GLM                                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
                ¿Issues?
                     ↓
            ┌────────┴────────┐
            ↓                 ↓
         ✅ NO              ⚠️  SÍ
            ↓                 ↓
            │    ┌────────────────────────────────┐
            │    │ 6. CONSULTORÍA (Consultant)    │
            │    │    - Analizar errores          │
            │    │    - Sugerir correcciones      │
            │    │    - Regenerar código          │
            │    │    Fallback: Codex→Gemini→GLM  │
            │    └────────────┬───────────────────┘
            │                 ↓
            │         Volver a Executor
            │         (Loop max 10 veces)
            │                 ↓
            │         ¿Sigue fallando?
            │                 ↓
            │                SÍ
            │                 ↓
            │    ┌────────────────────────────────┐
            │    │ 7. RECOVERY MODE               │
            │    │    - Validación exhaustiva     │
            │    │    - Regeneración completa     │
            │    │    - Auto-revert si falla      │
            │    │    (Max 3 intentos)            │
            │    └────────────┬───────────────────┘
            │                 ↓
            └─────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. TESTS (Opcional)                                         │
│    - Auto-detectar framework                                │
│    - Ejecutar tests                                         │
│    - Verificar resultados                                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. GIT COMMIT (Opcional)                                    │
│    - git add archivos                                       │
│    - Conventional commits                                   │
│    - Co-authored by Claude                                  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. LEARNING SYSTEM                                         │
│     - Recolectar experiencia                                │
│     - Calcular recompensa                                   │
│     - Entrenar política (offline)                           │
│     - Optimizar futuras decisiones                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ TAREA COMPLETADA                                         │
│    - Archivos creados/modificados                           │
│    - Tests ejecutados                                       │
│    - Commit creado                                          │
│    - Métricas recolectadas                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Agent Workflow - Optimized Model Hierarchy

**Cost-Optimized Multi-Model Strategy:** Orchestra uses an intelligent model hierarchy designed to minimize costs while maximizing quality. Each agent has a primary model (chosen for cost-efficiency) and automatic fallbacks.

```
User Request
    ↓
🏗️  Architect (Kimi k2.5 → Gemini 3 Pro)
    → Agent Swarm for complex planning
    → Investigates dependencies and risks
    → Creates detailed implementation plan
    Cost: $0.001-0.002 per 1K tokens
    ↓
[Plan Approval - User Review]
    ↓
⚡ Executor (GLM 4.7 → Kimi k2.5)
    → Most economical model for code generation
    → Handles 80% of boilerplate code
    → Falls back to Kimi for complex logic
    Cost: ~$0.0005 per 1K tokens (cheapest)
    ↓
🔍 Auditor (Gemini 3 Pro → GPT-5.2-Codex)
    → Massive context window (2M tokens)
    → Reviews entire project for consistency
    → Checks security (OWASP Top 10)
    Cost: ~$0.001 per 1K tokens
    ↓
❓ [Issues Found?]
    ↓ YES (Algorithmic Problems)
    ↓
🎯 Consultant (GPT-5.2-Codex → Kimi k2.5)
    → "Surgical" usage for complex algorithms only
    → Reserved for problems GLM can't solve
    → Expensive but precise
    Cost: ~$0.01 per 1K tokens (use sparingly)
    ↓
[Loop until approved or max 10 iterations]
    ↓
🧪 [Optional] Tests (pytest, jest, vitest, go test, cargo test)
    ↓
📦 [Optional] Git commit (conventional commits)
    ↓
🧠 Learning System (tracks performance and optimizes)
```

**Model Selection Rationale:**

| Agent | Primary Model | Why | Fallback | Cost Priority |
|-------|---------------|-----|----------|---------------|
| **Architect** | Kimi k2.5 | Agent Swarm capabilities, 200K context | Gemini 3 Pro | Medium |
| **Executor** | GLM-4.7 | Most economical, sufficient for 80% of code | Kimi k2.5 | **Lowest** |
| **Auditor** | Gemini 3 Pro | 2M context window, sees entire codebase | GPT-5.2-Codex | Medium |
| **Consultant** | GPT-5.2-Codex | Best for complex algorithms (use rarely) | Kimi k2.5 | **Highest** |

**Automatic Fallback Triggers:**
- `RATE_LIMIT_429` - API quota exceeded
- `CONTEXT_EXCEEDED` - Input too large for model
- `TIMEOUT` - Model took too long to respond
- `API_ERROR` - General API failure

**Cost Optimization Strategy:**
- ✅ Use GLM-4.7 for most code generation (cheapest)
- ✅ Use Kimi k2.5 for planning (Agent Swarm advantage)
- ✅ Use Gemini 3 Pro for auditing (massive context)
- ⚠️  Use GPT-5.2-Codex **only** when absolutely necessary
- 🎯 Learning System penalizes excessive expensive model usage

### Directory Structure

```
src/
├── adapters/          # AI provider adapters (Codex, Gemini, GLM, etc.)
├── cli/               # CLI command definitions
├── orchestrator/      # Main orchestration engine
├── prompts/           # Agent prompt templates
├── tui/               # Terminal UI (React + Ink)
│   ├── screens/       # TUI screens
│   ├── components/    # UI components
│   └── hooks/         # React hooks
├── utils/             # Utilities (StateManager, validators, etc.)
├── plugins/           # Plugin system
├── server/            # HTTP/WebSocket server
├── client/            # Client SDK
├── marketplace/       # Plugin marketplace
└── web/               # Web UI (React + Vite)
```

---

## Configuration

Create `.orchestrarc.json` in your project root:

```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3,
    "maxIterations": 10,
    "timeout": 300000
  },
  "test": {
    "command": "npm test",
    "runAfterGeneration": true,
    "timeout": 120000
  },
  "git": {
    "autoCommit": true,
    "commitMessageTemplate": "feat: {task}"
  },
  "languages": ["typescript", "javascript"],
  "tui": {
    "autoApprove": false,
    "notifications": true,
    "cacheEnabled": true,
    "maxRecoveryAttempts": 3,
    "recoveryTimeoutMinutes": 10,
    "autoRevertOnFailure": true
  }
}
```

Generate default config:
```bash
orchestra init
```

---

## Commands

| Command | Description |
|---------|-------------|
| `start <task>` | Begin new orchestration |
| `resume` | Resume interrupted session |
| `pipeline <task>` | Pipeline execution mode |
| `watch <task>` | Watch mode with auto-reload |
| `status` | Show current session status |
| `plan` | View current execution plan |
| `clean` | Clear session data |
| `doctor` | Verify setup and dependencies |
| `validate` | Validate syntax of generated code |
| `init` | Create `.orchestrarc.json` config |
| `dry-run <task>` | Analyze without execution |
| `export` | Export session data |
| `history` | Show session history |
| `tui` | Launch Terminal UI |

---

## Execution Modes

### Sequential (Default)
Standard execution with one file at a time.

### Parallel
Process multiple files concurrently with configurable worker pool:
```json
{
  "execution": {
    "parallel": true,
    "maxConcurrency": 3
  }
}
```

### Pipeline
Execute and audit simultaneously for faster feedback:
```bash
orchestra pipeline "your task"
```

### Watch
Auto-reload on file changes with debouncing:
```bash
orchestra watch "your task"
```

---

## Recovery Mode

When the normal audit loop fails, Orchestra automatically enters Recovery Mode:

1. ✅ Validates syntax with language-specific parsers
2. ✅ Detects incomplete code blocks
3. ✅ Iterates up to `maxRecoveryAttempts` (default: 3)
4. ✅ Auto-reverts changes if recovery fails (configurable)
5. ✅ Timeout controlled by `recoveryTimeout` (default: 10 min)

Configure in `.orchestrarc.json`:
```json
{
  "tui": {
    "maxRecoveryAttempts": 5,
    "recoveryTimeoutMinutes": 15,
    "autoRevertOnFailure": true
  }
}
```

---

## Supported Languages

Orchestra validates syntax for:

- **Python** - Uses AST parser
- **JavaScript** - Uses Acorn parser
- **TypeScript** - Uses TypeScript compiler API
- **Go** - Uses go fmt validation
- **Rust** - Uses rustc --parse-only
- **JSON** - JSON.parse validation
- **YAML** - YAML parser validation

Auto-detection based on file extension.

---

## Development

```bash
# Compile TypeScript
npm run build

# Run in development mode
npm run dev

# Start TUI
npm run tui

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

---

## Test Frameworks

Orchestra auto-detects and runs tests using:

- **Python**: pytest, unittest
- **JavaScript/TypeScript**: jest, vitest
- **Go**: go test
- **Rust**: cargo test

Override with `test.command` in config.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAI_API_KEY` | ✅ Yes | API key for Zhipu AI (GLM) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key |
| `OPENAI_API_KEY` | Optional | OpenAI API key (Codex) |

---

## AI-Core Integration

Orchestra integrates with [ai-core](./ai-core/) for universal development patterns:

- 📖 **Central Reference**: `ai-core/SUBAGENTS/AGENTS.md`
- 🛠️ **45+ Skills**: Domain-specific patterns (testing, security, frontend, etc.)
- 🤖 **Specialized Subagents**: security-specialist, frontend-specialist, etc.

See [CLAUDE.md](./CLAUDE.md) for complete integration details.

---

## Project Status

**Status**: Development
**Test Coverage**: Target 100%
**Tech Stack**: TypeScript + React (Ink) + Node.js

See [ROADMAP.md](./ROADMAP.md) for upcoming features and milestones.

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Claude Code specific guidance
- [AGENTS.md](./AGENTS.md) - AI agent rules and ai-core integration
- [QUICKSTART.md](./QUICKSTART.md) - Getting started guide
- [TUTORIAL.md](./TUTORIAL.md) - Comprehensive tutorial
- [USER_GUIDE.md](./docs/USAGE_GUIDE.md) - Detailed usage guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture documentation
- [SCALING.md](./SCALING.md) - Scaling guidelines

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Troubleshooting

### Adapter Failures
- Verify `ZAI_API_KEY` is set correctly
- Check API quota and rate limits
- Verify network connectivity

### Recovery Mode Looping
- Increase `maxRecoveryAttempts` in config
- Increase `recoveryTimeout` for complex code
- Review and adjust agent prompts

### State Corruption
- Run `orchestra clean` to reset session
- Delete `.orchestra/` directory manually
- Use `orchestra resume` to continue from last checkpoint

---

**Built with ❤️ for efficient AI-powered development**
