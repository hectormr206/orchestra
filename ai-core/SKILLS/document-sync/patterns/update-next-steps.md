# Patrón: Actualizar NEXT_STEPS.md

## Objetivo

Mantener NEXT_STEPS.md sincronizado con el estado actual del proyecto, marcando tareas completadas y actualizando métricas.

---

## Detectar Cambios

### 1. Identificar Tareas Completadas

**Usar TaskList:**
```yaml
Action: TaskList
Filter: status == "completed"
Result: Lista de tareas completadas recientemente
```

**Verificar en NEXT_STEPS.md:**
```markdown
Buscar:
- [ ] Nombre de tarea

Debe ser:
- [x] Nombre de tarea
```

### 2. Detectar Métricas Desactualizadas

**Contar skills actuales:**
```bash
ls -1 SKILLS/ | grep -v "^[.]" | wc -l
```

**Comparar con NEXT_STEPS.md:**
```markdown
En NEXT_STEPS.md buscar:
**Skills totales:** 35+

Si el conteo real es diferente, actualizar.
```

**Verificar otras métricas:**
```bash
# Tests de skills
ls -1 tests/skills/*.test.md 2>/dev/null | wc -l

# ADRs creadas
ls -1 docs/adr/*.md 2>/dev/null | wc -l
```

---

## Proceso de Actualización

### Paso 1: Marcar Tareas Completadas

**Leer NEXT_STEPS.md:**
```yaml
Action: Read
File: NEXT_STEPS.md
```

**Buscar tareas pendientes:**
```yaml
Pattern: /- \[ \] (.+)/
Matches: Lista de tareas sin completar
```

**Verificar contra TaskList:**
```yaml
Action: TaskGet (por cada tarea)
Condition: status == "completed"
```

**Actualizar marcador:**
```markdown
Antes:
- [ ] Crear CHANGELOG.md

Después:
- [x] Crear CHANGELOG.md
```

### Paso 2: Actualizar Métricas

**Estructura de métricas en NEXT_STEPS.md:**
```markdown
## 📊 Métricas del Proyecto

- **Skills totales:** 38 (de 35+ objetivo)
- **Skills con tests:** 25 (65%)
- **ADRs creadas:** 12
- **Deuda técnica:** 8 items (Alta: 3, Media: 3, Baja: 2)
- **Workflows CI/CD:** 11

**Última actualización:** 2025-01-23
```

**Calcular nuevas métricas:**
```yaml
Skills totales:
  Command: ls -1 SKILLS/ | grep -v "^[.]" | wc -l
  Example: 38

Skills con tests:
  Command: ls -1 tests/skills/*.test.md 2>/dev/null | wc -l
  Example: 25
  Percentage: (25 / 38) * 100 = 65%

ADRs creadas:
  Command: ls -1 docs/adr/*.md 2>/dev/null | wc -l
  Example: 12

Deuda técnica:
  Source: DEBT-TRACKING.md
  Count: [ ] items por prioridad
  Example:
    Alta: contar items con "(Alta)"
    Media: contar items con "(Media)"
    Baja: contar items con "(Baja)"

Workflows CI/CD:
  Command: ls -1 .github/workflows/*.yml 2>/dev/null | wc -l
  Example: 11
```

**Actualizar fecha:**
```yaml
Format: **Última actualización:** YYYY-MM-DD
Today: 2025-01-23
Comment: (opcional) describir brevemente qué se actualizó
```

---

## Ejemplo Completo

### Estado Inicial (NEXT_STEPS.md)

```markdown
## 🎯 Próximos Pasos

### Prioridad Alta

- [ ] Crear CHANGELOG.md
- [ ] Implementar skill document-sync
- [ ] Actualizar CLAUDE.md con nuevos skills

### 📊 Métricas del Proyecto

- **Skills totales:** 35+
- **Skills con tests:** 22
- **ADRs creadas:** 10
- **Deuda técnica:** 10 items
- **Workflows CI/CD:** 11

**Última actualización:** 2025-01-22
```

### Después de Actualización

```markdown
## 🎯 Próximos Pasos

### ✅ Completado

- [x] Crear CHANGELOG.md (2025-01-23)
- [x] Implementar skill document-sync (2025-01-23)

### Prioridad Alta

- [ ] Actualizar CLAUDE.md con nuevos skills

### 📊 Métricas del Proyecto

- **Skills totales:** 38 (de 35+ objetivo)
- **Skills con tests:** 25 (66%)
- **ADRs creadas:** 12
- **Deuda técnica:** 8 items (Alta: 3, Media: 3, Baja: 2)
- **Workflows CI/CD:** 11

**Última actualización:** 2025-01-23 (document-sync implementado)
```

---

## Comandos Útiles

```bash
# Ver tareas completadas en TaskList
TaskList | grep "completed"

# Contar skills
ls -1 SKILLS/ | grep -v "^[.]" | wc -l

# Contar tests de skills
find tests/skills -name "*.test.md" | wc -l

# Contar ADRs
find docs/adr -name "*.md" | wc -l

# Ver commits recientes que pueden indicar tareas completadas
git log --oneline -5

# Verificar fecha de última actualización
grep "Última actualización" NEXT_STEPS.md
```

---

## Validación

### Después de Actualizar

1. **Verificar sintaxis markdown:**
   ```bash
   # No hay errores de markdown
   cat NEXT_STEPS.md | head -20
   ```

2. **Verificar consistencia:**
   ```yaml
   - Todos los [x] corresponden a tareas completadas en TaskList
   - Métricas coinciden con conteos reales
   - Fecha está actualizada
   - No hay duplicados
   ```

3. **Verificar con otros archivos:**
   ```yaml
   - Métricas en NEXT_STEPS.md == README.md
   - Tareas completadas == CHANGELOG.md
   - Deuda técnica == DEBT-TRACKING.md
   ```

---

## Edge Cases

### Caso 1: Tarea Reabierta

**Situación:** Una tarea marcada [x] fue reabierta.

**Solución:**
```markdown
Antes:
- [x] Implementar feature X

Después (si TaskList indica que está pending):
- [ ] Implementar feature X (reabierta)
```

### Caso 2: Métricas No Disponibles

**Situación:** Un directorio no existe (ej. docs/adr/).

**Solución:**
```yaml
ADRs creadas:
  Si directorio no existe:
    Command: ls -1 docs/adr/*.md 2>/dev/null | wc -l
    Result: 0 (no error)
    Display: **ADRs creadas:** 0 (próximamente)
```

### Caso 3: Conflicto con Edición Manual

**Situación:** El usuario está editando NEXT_STEPS.md.

**Solución:**
```yaml
1. Detectar edición activa:
   - Verificar timestamp de modificación
   - Si hace < 5 minutos, preguntar al usuario

2. Preservar ediciones manuales:
   - Leer contenido actual
   - Identificar secciones modificadas manualmente
   - No sobrescribir contenido custom

3. Pedir confirmación si hay conflicto:
   "Detecté que NEXT_STEPS.md fue modificado manualmente.
    ¿Deseas sobrescribir con las métricas calculadas?"
```

---

## Integración con Flujo Completo

Este patrón se integra con el workflow general de document-sync:

```yaml
1. document-sync invocado
   ↓
2. Detectar cambios (TaskList + git log)
   ↓
3. Este patrón: update-next-steps.md
   ↓
4. update-changelog.md (próximo patrón)
   ↓
5. update-metrics.md (README.md)
   ↓
6. Sincronización completa
```

---

**EOF**
