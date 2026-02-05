# Orchestra Learning System

**Reinforcement Learning para Optimización de Orquestación**

El Learning System de Orchestra utiliza aprendizaje por refuerzo (Actor-Critic) para mejorar continuamente la selección de recursos y estrategias de ejecución basándose en experiencias pasadas.

---

## 🎯 Objetivo

Optimizar automáticamente la orquestación aprendiendo de cada ejecución:
- Selección óptima de agentes (Architect, Executor, Auditor, Consultant)
- Estrategia de ejecución ideal (secuencial, paralela, pipeline)
- Predicción de tiempo y recursos necesarios
- Reducción de errores y mejora de calidad

---

## 🏗️ Arquitectura

### Ciclo Diseño-Construcción-Prueba-Aprendizaje

```
┌─────────────┐
│   Diseño    │ → Architect: Crea plan de implementación
│  (Architect) │
└──────┬──────┘
       ↓
┌─────────────┐
│ Construcción│ → Executor: Genera código
│  (Executor)  │
└──────┬──────┘
       ↓
┌─────────────┐
│   Prueba    │ → Auditor: Revisa código + Tests automáticos
│  (Auditor)   │
└──────┬──────┘
       ↓
┌─────────────┐
│ Aprendizaje │ → Experience Collection + Reward Calculation
│  (Learning)  │ → Policy Update (Actor-Critic)
└─────────────┘
       ↓
    [Mejora continua]
```

### Componentes Principales

1. **ExperienceCollector** (`src/learning/ExperienceCollector.ts`)
   - Captura experiencias (state, action, reward) de cada ejecución
   - Almacena en buffer persistente (JSONL)
   - Normaliza features y computa rewards

2. **LearningManager** (`src/learning/LearningManager.ts`)
   - Gestiona modos de operación
   - Carga y despliega políticas aprendidas
   - Coordina colección y entrenamiento

3. **OrchestratorIntegration** (`src/learning/OrchestratorIntegration.ts`)
   - Integra Learning System con Orchestrator
   - Extrae contexto y métricas de ejecución
   - Infiere task type, domain, complexity, risk level

4. **CLI Commands** (`src/cli/learningCommands.ts`)
   - Comandos para controlar el sistema de aprendizaje
   - Visualización de estadísticas
   - Exportación de experiencias

---

## 📊 State Representation

### State Vector (~50-100 dims)

```yaml
Task Features:
  - task_type: one-hot(13)     # feature, bug, refactor, test, docs, etc.
  - domain: one-hot(9)          # frontend, backend, database, devops, etc.
  - complexity: ordinal(3)      # simple, medium, complex
  - risk_level: ordinal(3)      # low, medium, high

Context Features (normalized 0-1):
  - estimated_time: float       # Tiempo estimado normalizado
  - domain_diversity: float     # Número de dominios involucrados
  - skill_count: float          # Número de skills necesarios

Historical Features:
  - success_rate: float         # Tasa de éxito en tareas similares
  - time_accuracy: float        # Precisión de estimaciones de tiempo
  - resource_efficiency: float  # Eficiencia en uso de recursos

System State:
  - concurrent_tasks: float     # Tareas concurrentes
  - system_load: float          # Carga del sistema
  - agent_availability: dict    # Disponibilidad de agentes
```

### Action Vector

```yaml
Resources:
  - skills: list[str]           # Skills a usar
  - agents: list[str]           # Agentes a invocar

Strategy:
  - approach: enum              # direct, sequential, parallel, coordinated

Parameters:
  - timeout_multiplier: float   # [0.5, 2.0]
  - parallelism: int            # [1, 4]
  - retry_strategy: enum        # fail_fast, retry_with_backoff, fallback
  - safety_level: enum          # strict, balanced, permissive
```

---

## 💰 Reward Function (Enhanced with Cost Optimization)

Rango: [-100, +180]

```python
reward = (
    success * 100 +                          # Éxito/fallo (dominante)
    time_efficiency * 20 +                   # Velocidad de ejecución
    resource_efficiency * 10 +               # Eficiencia de recursos
    (zero_errors ? 15 : -errors*10) +        # Calidad (errores)
    user_satisfaction * 10 +                 # Modificaciones del usuario
    safety_adherence * 10 +                  # Cumplimiento de seguridad
    (tests_passed ? 5 : 0) +                 # Tests exitosos
    cost_efficiency_bonus +                  # NUEVO: Bonificación por bajo costo
    glm_usage_bonus +                        # NUEVO: Bonificación por uso de GLM
    expensive_model_penalty +                # NUEVO: Penalización por modelos caros
    fallback_penalty                         # NUEVO: Penalización por fallbacks
)
```

### Componentes del Reward

| Componente | Peso | Descripción |
|------------|------|-------------|
| Success | ±100 | Dominante: tarea completada vs fallida |
| Time Efficiency | +20 | Ratio estimado/real (<2x = mejor) |
| Resource Efficiency | ±10 | Uso mínimo de recursos |
| Quality | ±15 | Cero errores vs múltiples errores |
| User Satisfaction | ±10 | Sin modificaciones post-generación |
| Safety | +10/-50 | Cumplimiento vs violación de seguridad |
| Tests | +5 | Tests pasando exitosamente |
| **Cost Efficiency** | **+50** | **🆕 Sesión muy económica (< $0.10)** |
| **GLM Usage** | **+10/success** | **🆕 Bonificación por cada éxito con GLM-4.7** |
| **Expensive Models** | **-5/usage** | **🆕 Penalización por uso excesivo de modelos caros** |
| **Fallback Rotations** | **-10/rotation** | **🆕 Penalización por fallbacks** |

### Nuevo: Tracking de Modelos

El sistema ahora rastrea el rendimiento detallado de cada modelo:

```typescript
interface ModelUsage {
  modelId: string;                    // "glm-4.7", "kimi-k2.5", etc.
  provider: string;                   // "zai", "moonshot", "openai", etc.
  tokensUsed: number;                 // Tokens consumidos
  latencyMs: number;                  // Latencia en ms
  success: boolean;                   // ¿Exitoso?
  errorCode?: 'RATE_LIMIT_429' | 'CONTEXT_EXCEEDED' | 'TIMEOUT' | 'API_ERROR';
  errorMessage?: string;              // Mensaje de error
  timestamp: string;                  // ISO timestamp
  estimatedCost?: number;             // Costo estimado en USD
}
```

### Cálculo de Recompensas Optimizado

```typescript
private calculateReward(state: EnhancedSessionState): number {
  let reward = 0;

  // Base: éxito/fallo
  reward += state.phase === 'completed' ? 100 : -100;

  // 🆕 Eficiencia de costo
  if (state.globalMetrics.totalCostEstimate < 0.10) {
    reward += 50; // Muy económico
  } else if (state.globalMetrics.totalCostEstimate > 0.50) {
    reward -= 20; // Muy costoso
  }

  // 🆕 Bonificación por uso de GLM (económico)
  const glmSuccesses = state.workflow
    .flatMap(s => s.attempts)
    .filter(a => a.modelId.includes('glm') && a.success)
    .length;
  reward += glmSuccesses * 10;

  // 🆕 Penalización por uso excesivo de modelos caros (GPT-5.2-Codex)
  const expensiveUsages = state.workflow
    .flatMap(s => s.attempts)
    .filter(a => a.modelId.includes('gpt-5.2') || a.modelId.includes('opus'))
    .length;
  if (expensiveUsages > 3) {
    reward -= (expensiveUsages - 3) * 5; // -5 por cada uso extra
  }

  // 🆕 Penalización por fallback rotations
  reward -= state.globalMetrics.fallbackRotations * 10;

  // Eficiencia de tiempo
  const timeEfficiency = state.globalMetrics.avgLatencyMs < 30000 ? 1.0 : 0.5;
  reward += timeEfficiency * 20;

  // Calidad (sin errores)
  const errorCount = state.workflow.filter(s => s.status === 'failed').length;
  reward += errorCount === 0 ? 15 : -errorCount * 10;

  return reward;
}
```

### 🆕 Global Metrics Tracking

El sistema ahora mantiene métricas globales de cada sesión para optimización de costos:

```typescript
interface GlobalMetrics {
  totalCostEstimate: number;          // Costo total estimado en USD
  startTime: number;                  // Timestamp de inicio
  endTime?: number;                   // Timestamp de fin
  totalTokens: number;                // Total de tokens consumidos
  totalAttempts: number;              // Total de intentos realizados
  successfulAttempts: number;         // Intentos exitosos
  failedAttempts: number;             // Intentos fallidos
  fallbackRotations: number;          // Número de rotaciones de fallback
  avgLatencyMs: number;               // Latencia promedio en ms
}
```

**Beneficios:**
- **Visibilidad de costos**: Tracking en tiempo real del costo de cada sesión
- **Optimización automática**: El sistema aprende a minimizar costos usando modelos económicos
- **Detección de problemas**: Identifica patrones de fallbacks excesivos o errores repetidos
- **Análisis de rendimiento**: Compara latencia y eficiencia entre modelos

### 🆕 Workflow Step Tracking

Cada paso del workflow se rastrea con detalle completo:

```typescript
interface TaskStep {
  id: string;                         // Identificador único
  agentRole: 'architect' | 'executor' | 'auditor' | 'consultant';
  status: 'pending' | 'running' | 'completed' | 'failed';
  filePath?: string;                  // Archivo afectado
  attempts: ModelUsage[];             // Historial de intentos
  outputHash?: string;                // Hash del output (para deduplicación)
  startTime?: string;                 // ISO timestamp de inicio
  endTime?: string;                   // ISO timestamp de fin
  duration?: number;                  // Duración en ms
}
```

**Ejemplo de workflow completo:**

```json
{
  "workflow": [
    {
      "id": "step-1",
      "agentRole": "architect",
      "status": "completed",
      "attempts": [
        {
          "modelId": "kimi-k2.5",
          "provider": "moonshot",
          "tokensUsed": 1500,
          "latencyMs": 4500,
          "success": true,
          "estimatedCost": 0.045
        }
      ],
      "duration": 4500
    },
    {
      "id": "step-2",
      "agentRole": "executor",
      "status": "completed",
      "filePath": "src/auth/login.ts",
      "attempts": [
        {
          "modelId": "glm-4.7",
          "provider": "zai",
          "tokensUsed": 2000,
          "latencyMs": 3000,
          "success": true,
          "estimatedCost": 0.010
        }
      ],
      "duration": 3000
    }
  ],
  "globalMetrics": {
    "totalCostEstimate": 0.055,
    "totalTokens": 3500,
    "totalAttempts": 2,
    "successfulAttempts": 2,
    "failedAttempts": 0,
    "fallbackRotations": 0,
    "avgLatencyMs": 3750
  }
}
```

---

## 🔧 Modos de Operación

### 1. Disabled (Default)
```bash
export ORCHESTRA_LEARNING_MODE=disabled
```
- **Comportamiento**: Sin aprendizaje, solo reglas
- **Uso**: Cuando no quieres usar learning
- **Colección**: No colecta experiencias

### 2. Shadow Mode
```bash
export ORCHESTRA_LEARNING_MODE=shadow
```
- **Comportamiento**: Colecta experiencias, usa reglas
- **Uso**: Fase inicial para construir dataset
- **Colección**: ✅ Activa
- **Política**: No usa aprendida, solo reglas

**Recomendado para comenzar:**
```bash
# 1. Activar shadow mode
export ORCHESTRA_LEARNING_MODE=shadow

# 2. Ejecutar tareas normalmente
orchestra start "Add authentication"
orchestra start "Fix database query bug"
orchestra start "Refactor user service"

# 3. Ver estadísticas
orchestra learning-stats

# 4. Exportar para entrenamiento (cuando tengas suficientes)
orchestra learning-export -o experiences.json
```

### 3. A/B Test Mode
```bash
export ORCHESTRA_LEARNING_MODE=ab_test
```
- **Comportamiento**: 10% política aprendida, 90% reglas
- **Uso**: Testing de política entrenada
- **Colección**: ✅ Activa
- **Política**: Usa aprendida probabilísticamente

### 4. Production Mode
```bash
export ORCHESTRA_LEARNING_MODE=production
```
- **Comportamiento**: 100% política aprendida con fallback
- **Uso**: Deployment final
- **Colección**: ✅ Activa
- **Política**: Usa aprendida con fallback a reglas

---

## 📁 Estructura de Archivos

```
src/learning/
├── types.ts                      # Tipos TypeScript
├── ExperienceCollector.ts        # Colección de experiencias
├── LearningManager.ts            # Manager principal
├── OrchestratorIntegration.ts    # Integración con Orchestrator
└── index.ts                      # Exports

src/cli/
└── learningCommands.ts           # Comandos CLI

data/
├── experience_buffer/
│   └── experiences.jsonl         # Buffer persistente (JSONL)
├── models/                       # Modelos entrenados (futuro)
└── metrics/                      # Métricas de entrenamiento
```

---

## 🚀 Guía de Uso

### Paso 1: Activar Shadow Mode

```bash
# Configurar modo
export ORCHESTRA_LEARNING_MODE=shadow

# O agregar a tu shell profile
echo 'export ORCHESTRA_LEARNING_MODE=shadow' >> ~/.bashrc
source ~/.bashrc
```

### Paso 2: Ejecutar Tareas

```bash
# Ejecutar tareas normalmente
orchestra start "Add user authentication API"
orchestra start "Refactor database queries for performance"
orchestra start "Fix memory leak in backend service"
orchestra start "Add unit tests for user controller"
```

### Paso 3: Monitorear Estadísticas

```bash
# Ver estado del learning system
orchestra learning

# Ver estadísticas detalladas
orchestra learning-stats

# Salida ejemplo:
# ═══════════════════════════════════════════════════════════
#             LEARNING SYSTEM STATISTICS
# ═══════════════════════════════════════════════════════════
#
# Mode: SHADOW
# Policy Loaded: No
#
# Experience Buffer:
#   Total experiences: 127
#   Mean reward: 85.3
#   Success rate: 92.1%
#
# By Task Type:
#   feature         45
#   bug             32
#   refactor        28
#   test            22
#
# By Domain:
#   backend         67
#   frontend        34
#   database        26
```

### Paso 4: Exportar Experiencias

```bash
# Exportar para entrenamiento
orchestra learning-export -o training-data.json

# Salida:
# → Exporting experiences...
# ✓ Experiences exported to: training-data.json
#
# Statistics:
#   Total experiences: 127
#   Mean reward: 85.3
#   Success rate: 92.1%
```

### Paso 5: Entrenar Política (Futuro)

```bash
# Entrenar política con Actor-Critic
orchestra learning-train --data training-data.json --epochs 100 --output models/

# ⚠ Training not yet implemented
# The Actor-Critic policy training will be available in a future update.
```

### Paso 6: Desplegar (Futuro)

```bash
# Cambiar a A/B test mode
orchestra learning-mode ab_test

# Si va bien, cambiar a production
orchestra learning-mode production
```

---

## 📈 Métricas y Monitoring

### Métricas de Experience Buffer

```bash
orchestra learning-stats
```

- **Total experiences**: Número de ejecuciones capturadas
- **Mean reward**: Reward promedio (objetivo: >80)
- **Success rate**: Tasa de éxito (objetivo: >85%)
- **By task type**: Distribución por tipo de tarea
- **By domain**: Distribución por dominio

### Métricas de Policy (Futuro)

- **Accuracy**: Precisión de predicciones
- **Resource efficiency**: Eficiencia vs baseline
- **Time accuracy**: Precisión de estimaciones
- **Safety compliance**: Cumplimiento de seguridad

---

## 🎓 Mejores Prácticas

### 1. Colección de Datos

✅ **DO:**
- Ejecuta tareas diversas (features, bugs, refactors, tests)
- Cubre múltiples dominios (frontend, backend, database)
- Colecta al menos 100-200 experiencias antes de entrenar
- Mantén balanceo entre tareas simples y complejas

❌ **DON'T:**
- No entrenes con menos de 50 experiencias
- No colectes solo un tipo de tarea
- No ignores tareas fallidas (son valiosas)

### 2. Entrenamiento

✅ **DO:**
- Empieza con shadow mode
- Valida en test set antes de deployment
- Compara contra baseline de reglas
- Monitorea métricas continuamente

❌ **DON'T:**
- No pases directamente a production sin A/B testing
- No ignores safety violations
- No desactives fallback a reglas

### 3. Deployment

✅ **DO:**
- Usa A/B test mode primero (10% learned)
- Monitorea por 24-48 horas
- Incrementa gradualmente (25% → 50% → 100%)
- Mantén plan de rollback

❌ **DON'T:**
- No despliegues sin testing
- No remuevas fallback mechanisms
- No ignores anomalías

---

## 🔮 Futuro: Actor-Critic Networks

### Arquitectura Planificada

```
Estado (state_dim) → [Actor Network] → Acción (action_dim)
                        ↓
                   [Critic Network] → Value (V(s))
                        ↓
                   [Training Loop] → Policy Update
```

### Actor Network
- **Input**: State vector (~50-100 dims)
- **Hidden**: [256, 128] fully connected
- **Output**: Action probabilities (softmax)

### Critic Network
- **Input**: State vector (~50-100 dims)
- **Hidden**: [256, 128] fully connected
- **Output**: State value V(s) (scalar)

### Training Algorithm
- **A2C** (Advantage Actor-Critic)
- **Batch size**: 64-128
- **Learning rate**: 0.0001-0.001
- **Optimizer**: Adam
- **Loss**: Actor loss + Critic loss

---

## 🐛 Troubleshooting

### No se colectan experiencias

**Síntoma**: `orchestra learning-stats` muestra 0 experiencias

**Solución**:
```bash
# Verificar modo
orchestra learning-mode

# Activar shadow mode
export ORCHESTRA_LEARNING_MODE=shadow
orchestra learning-mode shadow
```

### Reward muy bajo

**Síntoma**: Mean reward < 0

**Causa posible**: Muchos fallos o errores

**Solución**:
- Revisa logs de ejecución
- Ajusta configuración de timeouts
- Mejora prompts de agentes

### Policy no carga

**Síntoma**: "Policy Loaded: No"

**Causa**: No hay modelo entrenado aún

**Solución**: Esto es normal. Training viene en futuras versiones.

---

## 📚 Referencias

- [ai-core Learning System](./ai-core/SKILLS/learning/SKILL.md)
- [ai-core Actor-Critic Learner](./ai-core/SUBAGENTS/universal/actor-critic-learner.md)
- [ADR 005: Learning System](./ai-core/docs/adr/005-learning-system.md)
- [Reinforcement Learning Patterns](./ai-core/SKILLS/learning/patterns/reinforcement-learning.md)

---

## 🤝 Contributing

El Learning System está en desarrollo activo. Contribuciones bienvenidas:

1. **Experience Collection**: Mejorar inferencia de features
2. **Reward Function**: Ajustar pesos y componentes
3. **Actor-Critic**: Implementar training con TensorFlow.js
4. **UI/UX**: Mejorar visualización de métricas

---

**Estado**: ✅ Experience Collection implementado, 🔄 Training en desarrollo

**Versión**: 1.0.0

**Última actualización**: 2026-02-05
