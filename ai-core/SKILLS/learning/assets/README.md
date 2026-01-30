# Actor-Critic Training Scripts

Mínimo viable para validar que el sistema Actor-Critic funciona en ai-core.

## 🧪 QUICK START (Test with Synthetic Data)

Want to test the pipeline immediately without waiting for real data?

```bash
# Run complete end-to-end test
./SKILLS/learning/assets/test_pipeline.sh
```

This will:
1. ✅ Generate 1000 synthetic test experiences
2. ✅ Train Actor-Critic model (50 epochs)
3. ✅ Evaluate model performance
4. ✅ Compare with rule-based baseline
5. ✅ Generate monitoring reports

**Expected results:**
- Model learns from synthetic data
- Mean reward becomes positive
- Success rate > 70%
- Some improvement over baseline

**Manual testing:**

```bash
# 1. Generate test data
python SKILLS/learning/assets/generate_test_data.py \
  --count 1000 \
  --output data/experience_buffer/test_experiences.jsonl

# 2. Train model
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/test_experiences.jsonl \
  --epochs 50

# 3. Evaluate
python SKILLS/learning/assets/evaluate.py \
  --model data/models/actor_checkpoint_v1.0.pt \
  --test-data data/experience_buffer/test_experiences.jsonl

# 4. Monitor
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/test_experiences.jsonl
```

---

## 📁 Scripts Disponibles

### 1. `models.py`
Implementación de redes neuronales PyTorch:
- `ActorNetwork`: Red de política (state → action probabilities)
- `CriticNetwork`: Red de valor (state → V(s))
- `ActorCriticAgent`: Agente combinado
- `train_a2c()`: Algoritmo de entrenamiento A2C
- `save_checkpoint()` / `load_checkpoint()`: Guardar/cargar modelos

### 2. `train.py`
Entrena modelo Actor-Critic sobre experiencias recolectadas.

```bash
python train.py --data data/experience_buffer/experiences.jsonl
```

**Opciones:**
- `--data`: Ruta a experiencias (default: `data/experience_buffer/experiences.jsonl`)
- `--epochs`: Número de epochs (default: 100)
- `--batch-size`: Tamaño de batch (default: 64)
- `--learning-rate`: Learning rate (default: 1e-4)
- `--state-dim`: Dimensión del estado (default: 50)
- `--action-dim`: Dimensión de la acción (default: 30)
- `--output-dir`: Directorio de salida (default: `data/models`)

**Salida:**
- `data/models/actor_checkpoint_v1.0.pt`: Modelo final
- `data/models/actor_checkpoint_best.pt`: Mejor modelo (validación)
- `data/models/training_history.json`: Historial de entrenamiento

### 3. `evaluate.py`
Evalúa modelo entrenado en conjunto de prueba.

```bash
python evaluate.py --model data/models/actor_checkpoint_v1.0.pt
```

**Opciones:**
- `--model`: Ruta al modelo entrenado (requerido)
- `--test-data`: Ruta a datos de prueba
- `--output`: Ruta para guardar reporte (JSON)

**Métricas:**
- Accuracy de predicción
- Recompensa media
- Success rate
- Correlación con valores reales
- Análisis por tipo de tarea

### 4. `monitor.py`
Monitorea experiencias recolectadas en tiempo real.

```bash
python monitor.py --data data/experience_buffer/experiences.jsonl
```

**Opciones:**
- `--data`: Ruta a experiencias
- `--output`: Guardar reporte a JSON
- `--watch`: Modo watch (refresca cada 30s)
- `--interval`: Intervalo de refresco (segundos)

**Dashboard muestra:**
- Estadísticas generales
- Análisis por tipo de tarea
- Análisis por dominio
- Análisis por complejidad
- Health check
- Recomendaciones

### 5. `compare_policies.py`
Compara política aprendida con baseline basado en reglas.

```bash
python compare_policies.py --learned data/models/actor_checkpoint_v1.0.pt
```

**Opciones:**
- `--learned`: Ruta a modelo aprendido (requerido)
- `--test-data`: Ruta a datos de prueba
- `--output`: Guardar reporte a JSON

**Compara:**
- Recompensas medias
- Success rates
- Patrones de decisión
- Porcentaje de acuerdo

### 6. `generate_test_data.py`
Genera datos de prueba sintéticos realistas.

```bash
python generate_test_data.py --count 1000 --output data/experience_buffer/test.jsonl
```

**Opciones:**
- `--count`: Número de experiencias (default: 1000)
- `--output`: Archivo de salida
- `--seed`: Semilla aleatoria para reproducibilidad

**Genera:**
- Experiencias con todos los tipos de tareas
- Distribución realista de dominios
- Complejidades variadas
- Recompensas realistas

### 7. `test_pipeline.sh`
Script completo de prueba end-to-end.

```bash
./test_pipeline.sh
```

**Ejecuta todos los pasos:**
1. Genera datos de prueba
2. Entrena modelo
3. Evalúa modelo
4. Compara con baseline
5. Genera reportes

---

## 🚀 Flujo de Trabajo Completo

### Paso 1: Recolectar Experiencias

```bash
# Habilitar modo shadow
export AI_CORE_LEARNING_MODE=shadow

# Usar ai-core normalmente
# Las experiencias se recolectan automáticamente

# Verificar recolección
python -m learning.assets.monitor --data data/experience_buffer/experiences.jsonl
```

**Mínimo recomendado:** 100 experiencias
**Ideal:** 1,000+ experiencias

### Paso 2: Entrenar Modelo

```bash
# Entrenar con opciones por defecto
python SKILLS/learning/assets/train.py \
  --data data/experience_buffer/experiences.jsonl \
  --epochs 100 \
  --output-dir data/models
```

**Qué esperar:**
- Epoch 0-30: Actor/Critic loss disminuyen
- Epoch 30-70: Recompensa mejora gradualmente
- Epoch 70-100: Convergencia

**Indicadores de éxito:**
- ✅ Mean reward > 0
- ✅ Actor loss disminuye
- ✅ Critic loss converge
- ✅ Entropy > 0.1

### Paso 3: Evaluar Modelo

```bash
# Evaluar en conjunto de prueba
python SKILLS/learning/assets/evaluate.py \
  --model data/models/actor_checkpoint_v1.0.pt \
  --test-data data/experience_buffer/experiences.jsonl \
  --output data/metrics/evaluation_report.json
```

**Criterios de éxito:**
- ✅ Accuracy > 70%
- ✅ Success rate > 85%
- ✅ Mean reward > 0
- ✅ Correlación > 0.3

### Paso 4: Comparar con Baseline

```bash
# Comparar con reglas
python SKILLS/learning/assets/compare_policies.py \
  --learned data/models/actor_checkpoint_v1.0.pt \
  --output data/metrics/comparison_report.json
```

**Qué buscar:**
- ✅ Improvement > 5%
- ⚠️  Improvement > 0% (marginal)
- ❌ Improvement < 0% (empeorar)

### Paso 5: Monitoreo Continuo

```bash
# Monitoreo one-time
python SKILLS/learning/assets/monitor.py --data data/experience_buffer/experiences.jsonl

# Monitoreo continuo
python SKILLS/learning/assets/monitor.py \
  --data data/experience_buffer/experiences.jsonl \
  --watch \
  --interval 30
```

---

## 📊 Interpretación de Resultados

### Entrenamiento Exitoso

```
Epoch  90: Actor Loss=0.0234, Critic Loss=0.0156, Train Reward=45.30, Val Reward=42.10, Entropy=0.3456

✅ FINAL METRICS:
  Actor Loss: 0.0234 (bajo)
  Critic Loss: 0.0156 (convergido)
  Mean Reward: 45.30 (positivo ✅)
  Entropy: 0.3456 (exploración suficiente ✅)

✅ SUCCESS: Model learned positive reward policy
```

### Entrenamiento Problemático

```
Epoch  90: Actor Loss=0.5234, Critic Loss=0.8156, Train Reward=-35.30, Val Reward=-38.10, Entropy=0.0156

❌ FINAL METRICS:
  Actor Loss: 0.5234 (alto ❌)
  Critic Loss: 0.8156 (no converge ❌)
  Mean Reward: -35.30 (negativo ❌)
  Entropy: 0.0156 (sin exploración ❌)

❌ FAILED: Model did not learn effectively
```

---

## 🛠️ Troubleshooting

### Error: "No experiences found"

```bash
# Verificar que hay experiencias
wc -l data/experience_buffer/experiences.jsonl

# Si está vacío, ejecutar en shadow mode
export AI_CORE_LEARNING_MODE=shadow
# Usar ai-core para generar experiencias
```

### Error: "Model did not learn"

**Causas posibles:**
1. Pocas experiencias (< 100)
   - Solución: Recolectar más datos

2. Función de reward mal diseñada
   - Solución: Revisar `compute_reward()` en `train.py`

3. Hiperparámetros inadecuados
   - Solución: Ajustar `--learning-rate` o `--epochs`

4. Datos de baja calidad
   - Solución: Revisar experiencias recolectadas

### Warning: "Low experience count"

```bash
# Continuar recolectando más datos
export AI_CORE_LEARNING_MODE=shadow
# Usar ai-core normalmente
```

---

## 📈 Próximos Pasos

### Si el modelo funciona bien:

1. **A/B Testing**
   ```bash
   export AI_CORE_LEARNING_MODE=ab_test
   # El sistema usará learned policy 10% del tiempo
   ```

2. **Producción Gradual**
   ```bash
   export AI_CORE_LEARNING_MODE=production
   # Usar learned policy con fallback a reglas
   ```

3. **Continuous Learning**
   - Reentrenar periódicamente con nuevas experiencias
   - Monitorear performance en producción
   - A/B test contra nuevas versiones

### Si el modelo necesita mejora:

1. **Más Datos**
   - Recolectar 1000+ experiencias
   - Asegurar cobertura de todos los tipos de tareas

2. **Ingeniería de Features**
   - Mejorar representación del estado
   - Agregar más contexto histórico

3. **Hiperparámetros**
   - Probar diferentes learning rates
   - Ajustar arquitectura de la red
   - Cambiar batch size

4. **Reward Function**
   - Revisar pesos de componentes
   - Agregar nuevas señales de reward
   - Balancear objetivos múltiples

---

## 📚 Referencias

- `../SKILL.md`: Documentación principal del skill learning
- `../patterns/actor-critic.md`: Detalles del algoritmo
- `../patterns/reinforcement-learning.md`: Fundamentos de RL
- `../../../SUBAGENTS/universal/actor-critic-learner.md`: Agente de aprendizaje

---

**EOF**
