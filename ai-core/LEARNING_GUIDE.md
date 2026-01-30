# Guía de Inicio Rápido - Sistema de Aprendizaje AI-Core

> **Aprende automáticamente de la experiencia para optimizar decisiones**

---

## 🎯 ¿Qué es el Sistema de Aprendizaje?

El sistema de aprendizaje de AI-Core usa **Aprendizaje por Refuerzo (Actor-Critic)** para:
- Aprender qué skills y agentes usar para cada tarea
- Optimizar estrategias de ejecución basándose en experiencia real
- Mejorar continuamente con cada tarea ejecutada

**En resumen:** Entre más uses, mejor se vuelve.

---

## 🚀 Usar el Sistema de Aprendizaje

### Modo 1: Recolectar Experiencias (Sin Afectar Decisiones)

```bash
# Habilitar modo shadow (solo recolecta datos, no cambia decisiones)
export AI_CORE_LEARNING_MODE=shadow

# Usa ai-core normalmente
# Las experiencias se guardan automáticamente en data/experience_buffer/

# Verificar recolección
python SKILLS/learning/assets/monitor.py --data data/experience_buffer/experiences.jsonl
```

**Qué esperar:**
- ✅ AI-Core funciona **normalmente** (usa reglas)
- ✅ Experiencias se guardan automáticamente
- ✅ Sin riesgo en producción

### Modo 2: A/B Testing (Validar antes de usar)

```bash
# 10% usa aprendizaje, 90% usa reglas
export AI_CORE_LEARNING_MODE=ab_test

# Verificar performance
python SKILLS/learning/assets/compare_policies.py \
  --learned data/models/actor_checkpoint_v1.0.pt
```

**Qué esperar:**
- ✅ Testing seguro del modelo aprendido
- ✅ Comparación directa con reglas
- ✅ Métricas de mejora

### Modo 3: Producción (Uso completo)

```bash
# Usa política aprendida (con fallback a reglas si hay poca confianza)
export AI_CORE_LEARNING_MODE=production

# Umbral de confianza
export AI_CORE_CONFIDENCE_THRESHOLD=0.8
```

**Qué esperar:**
- ✅ Decisiones optimizadas automáticamente
- ✅ Fallback automático a reglas si no está seguro
- ✅ Monitoreo continuo de performance

---

## 📊 Cómo Funciona el Aprendizaje

### 1. Recolecta Experiencias

Cada vez que AI-Core ejecuta una tarea, guarda:

```yaml
Experiencia:
  estado:
    - Tipo de tarea (feature, bug, refactor, etc.)
    - Dominio (backend, frontend, database, etc.)
    - Complejidad (simple, medium, complex)
    - Contexto (tiempo estimado, recursos necesarios)

  acción:
    - Skills usados
    - Agents usados
    - Estrategia de ejecución

  resultado:
    - Recompensa: +100 (éxito) o -100 (fallo)
    - Tiempo real vs estimado
    - Errores
    - Recursos usados vs necesarios
```

### 2. Entrena el Modelo

```bash
# Entrenar con experiencias recolectadas
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/experiences.jsonl \
  --epochs 100 \
  --output-dir data/models
```

**Resultado:** Un modelo que predice la mejor acción para cada estado

### 3. Evalúa y Despliega

```bash
# Evaluar modelo
python SKILLS/learning/assets/evaluate.py \
  --model data/models/actor_checkpoint_v1.0.pt

# Si es mejor que reglas, desplegar
export AI_CORE_LEARNING_MODE=production
```

---

## 🧪 Probar el Sistema (Con Datos Sintéticos)

Si quieres probar sin esperar a recolectar datos reales:

```bash
# 1. Generar datos de prueba
python SKILLS/learning/assets/generate_test_data.py \
  --count 1000 \
  --output data/experience_buffer/test_experiences.jsonl

# 2. Entrenar modelo
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/test_experiences.jsonl \
  --epochs 50

# 3. Evaluar
python SKILLS/learning/assets/evaluate.py \
  --model data/models/actor_checkpoint_v1.0.pt \
  --test-data data/experience_buffer/test_experiences.jsonl
```

**Resultado:** Modelo entrenado que puedes usar inmediatamente

---

## 📈 Monitorear el Sistema

### Ver Dashboard en Tiempo Real

```bash
# Monitoreo one-time
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/experiences.jsonl

# Monitoreo continuo (refresca cada 30s)
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/experiences.jsonl \
  --watch
```

**Métricas que muestra:**
- Total de experiencias recolectadas
- Recompensa promedio
- Success rate
- Distribución por tipo de tarea
- Dominios con mejor performance
- Complejidades más difíciles

---

## 🎯 Casos de Uso Reales

### Ejemplo 1: Proyecto Nuevo

```bash
# 1. Instala ai-core
cd mi-proyecto
git clone https://github.com/hectormr206/ai-core.git ai-core
cd ai-core && ./run.sh

# 2. Habilita modo shadow para recolectar datos
export AI_CORE_LEARNING_MODE=shadow

# 3. Trabaja normalmente por 2 semanas
# Las experiencias se recolectan automáticamente

# 4. Entrena primer modelo
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/experiences.jsonl \
  --epochs 100

# 5. Evalúa y si es bueno, habilita ab_test
export AI_CORE_LEARNING_MODE=ab_test

# 6. Si mejora > 15%, habilita production
export AI_CORE_LEARNING_MODE=production
```

### Ejemplo 2: Proyecto Ya Existente

```bash
# 1. Ya tienes ai-core instalado
# 2. Habilita learning
export AI_CORE_LEARNING_MODE=shadow

# 3. Recolecta datos mientras trabajas normalmente
# (2-4 semanas recomendado)

# 4. Entrena cuando tengas 1000+ experiencias
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/experiences.jsonl

# 5. Despliega gradualmente
```

---

## 📊 Entender las Métricas

### Durante Entrenamiento

```
Epoch   0: Actor Loss=242.30, Reward=70.94,  Entropy=3.40
Epoch  10: Actor Loss=257.24, Reward=84.21, Entropy=3.39
Epoch  20: Actor Loss=186.92, Reward=83.25, Entropy=3.18
Epoch  30: Actor Loss=118.16, Reward=78.82, Entropy=2.53
Epoch  49: Actor Loss=100.65, Reward=79.48, Entropy=1.88
```

**Qué significa:**
- **Actor Loss↓**: Mejorando (debe disminuir)
- **Reward+:** Aprendiendo (debe ser positivo)
- **Entropy↓**: Más confiado (disminuye lentamente)

### Durante Evaluación

```
Accuracy: 75.3%         → Target: > 70% ✅
Success Rate: 85.2%      → Target: > 70% ✅
Mean Reward: +45.30       → Target: > 0 ✅
Correlation: 0.42         → Target: > 0.3 ✅
```

**Si todo está en ✅, el modelo está listo para producción.**

---

## 🛠️ Comandos Útiles

```bash
# Generar datos de prueba
python SKILLS/learning/assets/generate_test_data.py --count 1000

# Entrenar modelo
python SKILLS/learning/assets/train.py --epochs 100

# Evaluar modelo
python SKILLS/learning/assets/evaluate.py \
  --model data/models/actor_checkpoint_v1.0.pt

# Comparar con baseline
python SKILLS/learning/assets/compare_policies.py \
  --learned data/models/actor_checkpoint_v1.0.pt

# Monitorear
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/experiences.jsonl

# Test completo (end-to-end)
./SKILLS/learning/assets/test_pipeline.sh
```

---

## ⚠️ Problemas Comunes

### Problema: Modelo no aprende (Reward negativo)

**Causa:** Pocas experiencias o datos de mala calidad

**Solución:**
```bash
# 1. Recolecta más datos
export AI_CORE_LEARNING_MODE=shadow
# Usa ai-core normalmente por más tiempo

# 2. Verifica cantidad
wc -l data/experience_buffer/experiences.jsonl
# Mínimo recomendado: 1000

# 3. Verifica calidad
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/experiences.jsonl
```

### Problema: Performance baja después de desplegar

**Causa:** Modelo sobreajustado a datos de entrenamiento

**Solución:**
```bash
# 1. Aumenta umbral de confianza
export AI_CORE_CONFIDENCE_THRESHOLD=0.9

# 2. O vuelve a ab_test para validar
export AI_CORE_LEARNING_MODE=ab_test

# 3. Si persiste, vuelve a rules
export AI_CORE_LEARNING_MODE=disabled
```

### Problema: Quiero resetear el aprendizaje

**Solución:**
```bash
# 1. Deshabilita learning
export AI_CORE_LEARNING_MODE=disabled

# 2. Opcional: Borra experiencias
rm data/experience_buffer/experiences.jsonl

# 3. Opcional: Borra modelos
rm data/models/*.pt
```

---

## 📚 Documentación Adicional

- **SKILLS/learning/SKILL.md** - Documentación técnica completa
- **SKILLS/learning/patterns/actor-critic.md** - Algoritmos Actor-Critic
- **SKILLS/learning/assets/README.md** - Guía de scripts
- **SUBAGENTS/universal/actor-critic-learner.md** - Agente de aprendizaje

---

## 🎯 Checklist de Implementación

```yaml
[ ] Instalar ai-core en proyecto
[ ] Habilitar modo shadow (AI_CORE_LEARNING_MODE=shadow)
[ ] Recolectar 1000+ experiencias (2-4 semanas)
[ ] Entener primer modelo
[ ] Evaluar modelo (accuracy > 70%, reward > 0)
[ ] Comparar con baseline (mejora > 10%)
[ ] Habilitar ab_test (AI_CORE_LEARNING_MODE=ab_test)
[ ] Monitorear por 1 semana
[ ] Si mejora > 15%, habilitar production
[ ] Mantener monitoreo continuo
```

---

**¿Listo para empezar?** El sistema de aprendizaje es opcional. AI-Core funciona perfectamente sin él. Solo úsalo si quieres optimización automática basada en datos.

**¿Necesitas ayuda?** Ver la documentación técnica en `SKILLS/learning/SKILL.md` o crea un issue en GitHub.
