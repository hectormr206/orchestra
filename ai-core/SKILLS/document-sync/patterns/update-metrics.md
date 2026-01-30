# Patrón: Actualizar Métricas en README.md

## Objetivo

Mantener las métricas en README.md sincronizadas con el estado actual del proyecto (número de skills, workflows, tests, etc.).

---

## Detectar Cambios

### 1. Verificar Métricas Actuales en README.md

**Leer README.md:**
```yaml
Action: Read
File: README.md
Search Patterns:
  - "Skills totales:"
  - "skills" (en contexto de conteo)
  - "workflows" (en contexto de conteo)
  - Números seguidos de "+" (ej. "35+")
```

**Ejemplo de lo que buscar:**
```markdown
Enterprise-ready: **35+ skills** cubriendo GDPR, HIPAA, SOC 2...
CI/CD workflow configurado (11 workflows)
```

### 2. Calcular Métricas Reales

**Skills totales:**
```bash
ls -1 SKILLS/ | grep -v "^[.]" | wc -l
# Resultado esperado: 38
```

**Workflows CI/CD:**
```bash
ls -1 .github/workflows/*.yml 2>/dev/null | wc -l
# Resultado esperado: 11
```

**Tests de skills:**
```bash
ls -1 tests/skills/*.test.md 2>/dev/null | wc -l
# Resultado esperado: 25
```

**ADRs creadas:**
```bash
ls -1 docs/adr/*.md 2>/dev/null | wc -l
# Resultado esperado: 12
```

**Subagentes:**
```bash
ls -1 SUBAGENTS/universal/*.md 2>/dev/null | wc -l
# Resultado esperado: 2 (master-orchestrator, actor-critic-learner)
```

### 3. Comparar y Detectar Diferencias

| Métrica | README.md | Real | Diferencia | Acción |
|---------|-----------|------|------------|--------|
| Skills | 35+ | 38 | +3 | Actualizar |
| Workflows | 11 | 11 | 0 | No acción |
| Tests | - | 25 | - | Considerar agregar |

---

## Proceso de Actualización

### Paso 1: Leer README.md Completo

```yaml
Action: Read
File: README.md
Extract:
  - Todas las líneas con números de métricas
  - Contexto de cada métrica
  - Ubicación exacta en el archivo
```

### Paso 2: Identificar Patrones de Métricas

**Patrones comunes en README.md:**
```yaml
Patrón 1: "**N+ skills**"
  Ejemplo: "**35+ skills**"
  Nuevo: "**38 skills**" (si es exacto)

Patrón 2: "(N workflows)"
  Ejemplo: "(11 workflows)"
  Nuevo: "(11 workflows)" (sin cambios)

Patrón 3: Tablas de conteo
  Ejemplo: "| Skills | 35 |"
  Nuevo: "| Skills | 38 |"
```

### Paso 3: Actualizar Cada Métrica

#### Actualización de Skills Totales

**Buscar:**
```yaml
Pattern: /(\*{0,2})(\d+|\d+\+)\s+skills/gi
Matches:
  - "**35+ skills**"
  - "35+ skills"
  - "**skills** 35+"
```

**Reemplazar:**
```yaml
Old: "**35+ skills**"
New: "**38 skills**"

Rationale:
  - Si el número es exacto, usar número exacto (38)
  - Si hay skills en desarrollo, usar "38+"
  - Mantener formato (negrita, paréntesis, etc.)
```

**Ejemplos:**
```markdown
Antes:
Enterprise-ready: **35+ skills** cubriendo...

Después:
Enterprise-ready: **38 skills** cubriendo...
```

#### Actualización de Workflows

**Buscar:**
```yaml
Pattern: /(\d+)\s+workflows/gi
Matches:
  - "(11 workflows)"
  - "11 workflows"
```

**Reemplazar:**
```yaml
Si cambió:
  Old: "(11 workflows)"
  New: "(12 workflows)"

Si no cambió:
  - No modificar
  - Verificar que sea correcto
```

#### Actualización de Otras Métricas

**Tests de skills:**
```yaml
Si README.md tiene sección de tests:
  Buscar: "tests:" o "Tests:"
  Actualizar número

Si README.md no tiene sección de tests:
  Considerar agregar nueva sección:
  ```markdown
  ## 📊 Métricas de Tests

  - Skills con tests: 25/38 (66%)
  ```
```

**Subagentes:**
```yaml
Si se menciona número de subagentes:
  Actualizar con conteo real de SUBAGENTS/universal/
```

### Paso 4: Verificar Consistencia

**Verificar contra otros archivos:**
```yaml
README.md vs NEXT_STEPS.md:
  - Skills totales debe coincidir
  - Métricas deben ser consistentes

README.md vs CHANGELOG.md:
  - Última versión debe coincidir si está en README
  - Fecha de última actualización

README.md vs CLAUDE.md:
  - Número de skills listados en tabla debe coincidir
  - Links a skills deben ser correctos
```

---

## Ejemplo Completo

### Estado Inicial (README.md - extracto)

```markdown
# ai-core

> **Universal orchestration patterns** - Enterprise-ready: **35+ skills** cubriendo GDPR, HIPAA, SOC 2, PCI-DSS, AI/ML, FinOps y más.

## Features

- **38+ Universal Skills** covering all enterprise patterns
- CI/CD workflow configured (11 workflows)
- Multi-agent orchestration with learning capabilities
- Automated technical debt tracking

## Metrics

| Metric | Count |
|--------|-------|
| Skills | 35+ |
| Workflows | 11 |
| ADRs | 10 |

_Last updated: 2025-01-22_
```

### Conteos Reales

```bash
Skills: 38
Workflows: 11
ADRs: 12
```

### Después de Actualización

```markdown
# ai-core

> **Universal orchestration patterns** - Enterprise-ready: **38 skills** cubriendo GDPR, HIPAA, SOC 2, PCI-DSS, AI/ML, FinOps y más.

## Features

- **38 Universal Skills** covering all enterprise patterns
- CI/CD workflow configured (11 workflows)
- Multi-agent orchestration with learning capabilities
- Automated technical debt tracking

## Metrics

| Metric | Count |
|--------|-------|
| Skills | 38 |
| Workflows | 11 |
| ADRs | 12 |

_Last updated: 2025-01-23_
```

---

## Comandos Útiles

```bash
# Contar skills
SKILLS_COUNT=$(ls -1 SKILLS/ | grep -v "^[.]" | wc -l)
echo "Skills: $SKILLS_COUNT"

# Contar workflows
WORKFLOWS_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)
echo "Workflows: $WORKFLOWS_COUNT"

# Contar ADRs
ADRS_COUNT=$(ls -1 docs/adr/*.md 2>/dev/null | wc -l)
echo "ADRs: $ADRS_COUNT"

# Contar tests
TESTS_COUNT=$(ls -1 tests/skills/*.test.md 2>/dev/null | wc -l)
echo "Tests: $TESTS_COUNT"

# Contar subagentes
SUBAGENTS_COUNT=$(ls -1 SUBAGENTS/universal/*.md 2>/dev/null | wc -l)
echo "Subagents: $SUBAGENTS_COUNT"

# Verificar métricas en README.md
grep -E "([0-9]+)\s+(skills|workflows|ADRs|tests)" README.md

# Verificar métricas en NEXT_STEPS.md
grep -E "([0-9]+)\s+(skills|workflows|ADRs|tests)" NEXT_STEPS.md
```

---

## Validación

### Después de Actualizar

1. **Verificar sintaxis markdown:**
   ```bash
   # No hay errores de markdown
   cat README.md | head -30
   ```

2. **Verificar que los números sean correctos:**
   ```yaml
   Skills:
     - Contar: ls SKILLS/ | wc -l
     - Verificar: grep "skills" README.md
     - Deben coincidir

   Workflows:
     - Contar: ls .github/workflows/*.yml | wc -l
     - Verificar: grep "workflows" README.md
     - Deben coincidir
   ```

3. **Verificar consistencia entre archivos:**
   ```yaml
   README.md == NEXT_STEPS.md:
     - Skills totales: mismo número
     - Workflows: mismo número
     - ADRs: mismo número

   README.md == CLAUDE.md:
     - Número de skills listados coincide
     - Links son correctos
   ```

4. **Verificar formato:**
   ```yaml
   - No hay números flotantes sin contexto
   - El formato es consistente (ej. siempre "**N skills**")
   - La negrita/itálica se aplica correctamente
   ```

---

## Edge Cases

### Caso 1: README.md Tiene "35+" Pero Real Son 38

**Situación:**
```yaml
README.md dice: "35+ skills"
Real son: 38 skills
```

**Solución:**
```yaml
Opción 1: Usar número exacto
  "**38 skills**" (más preciso)

Opción 2: Mantener "+" si hay skills en desarrollo
  "**38+ skills**" (si hay work-in-progress)

Opción 3: Usar rango
  "**35-40 skills**" (si es muy variable)

Recomendación: Opción 1 (número exacto) para mayor claridad
```

### Caso 2: Métricas en Múltiples Lugares

**Situación:** README.md tiene el número de skills en varios lugares.

**Solución:**
```yaml
1. Encontrar todas las ocurrencias:
   grep -n "skills" README.md

2. Actualizar todas:
   - Línea 5: "**35+ skills**" → "**38 skills**"
   - Línea 42: "| Skills | 35+ |" → "| Skills | 38 |"
   - Línea 100: "Total skills: 35+" → "Total skills: 38"

3. Mantener consistencia:
   - Todas las ocurrencias deben mostrar el mismo número
   - Usar mismo formato (con o sin "+")
```

### Caso 3: Métrica No Existe en README.md

**Situación:** Una métrica existe (ej. tests) pero README.md no la muestra.

**Solución:**
```yaml
Opción 1: No agregar (minimalista)
  - No agregar la métrica si no estaba antes
  - Solo actualizar las métricas existentes

Opción 2: Agregar si es importante
  - Si la métrica es valiosa para usuarios
  - Agregar en sección apropiada
  - Ejemplo: agregar sección "## 📊 Test Coverage"

Recomendación: Opción 1, a menos que usuario solicite explícitamente
```

### Caso 4: Conflicto con NEXT_STEPS.md

**Situación:** README.md dice "38 skills" pero NEXT_STEPS.md dice "35+ skills".

**Solución:**
```yaml
1. Verificar cuál es correcto:
   ls SKILLS/ | wc -l
   # Si resultado es 38, README.md está correcto

2. Actualizar NEXT_STEPS.md también:
   - Editar NEXT_STEPS.md
   - Cambiar "35+ skills" → "38 skills"

3. Asegurar consistencia:
   - Ambos archivos deben tener mismo número
   - Usar el conteo real como fuente de verdad
```

### Caso 5: README.md No Tiene Métricas Numéricas

**Situación:** README.md no muestra números, solo texto descriptivo.

**Solución:**
```yaml
Ejemplo actual:
  "Enterprise-ready skills covering GDPR, HIPAA..."

Opción 1: Agregar métricas numéricas
  "Enterprise-ready **38 skills** covering GDPR, HIPAA..."

Opción 2: Crear sección de métricas
  ## 📊 Project Metrics
  - **Skills**: 38
  - **Workflows**: 11

Recomendación: Preguntar al usuario si desea agregar métricas numéricas
```

---

## Integración con Flujo Completo

Este patrón se integra después de update-changelog.md:

```yaml
1. document-sync invocado
   ↓
2. Detectar cambios (TaskList + git log)
   ↓
3. update-next-steps.md
   ↓
4. update-changelog.md
   ↓
5. Este patrón: update-metrics.md (README.md)
   ↓
6. update-debt-tracking.md (opcional)
   ↓
7. Sincronización completa
```

---

## Best Practices

1. **Mantener precisión:**
   - Usar números exactos cuando sea posible
   - Evitar "N+" a menos que haya work-in-progress
   - Actualizar regularmente

2. **Mantener consistencia:**
   - Todas las métricas deben coincidir entre archivos
   - Usar mismo formato en todo el documento
   - No mezclar formatos (ej. "38" vs "38+")

3. **Mantener claridad:**
   - Las métricas deben ser entendibles por usuarios
   - Incluir contexto (ej. "38 skills" no solo "38")
   - Agrupar métricas relacionadas

4. **Mantener actualizado:**
   - Actualizar después de agregar/quitar skills
   - Actualizar después de modificar workflows
   - Verificar otras métricas mensualmente

---

## Script Helper

**Ubicación:** `SKILLS/document-sync/assets/update-docs.sh`

```bash
#!/bin/bash
# Helper script para actualizar métricas

set -euo pipefail

AI_CORE_PATH="${AI_CORE_PATH:-/home/hectormr/personalProjects/gama/ai-core}"
cd "$AI_CORE_PATH"

echo "🔍 Calculando métricas actuales..."
echo ""

# Contar skills
SKILLS_COUNT=$(ls -1 SKILLS/ | grep -v "^[.]" | wc -l | tr -d ' ')
echo "✅ Skills totales: $SKILLS_COUNT"

# Contar workflows
WORKFLOWS_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Workflows CI/CD: $WORKFLOWS_COUNT"

# Contar tests
TESTS_COUNT=$(ls -1 tests/skills/*.test.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Tests de skills: $TESTS_COUNT"

# Contar ADRs
ADRS_COUNT=$(ls -1 docs/adr/*.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ ADRs creadas: $ADRS_COUNT"

# Contar subagentes
SUBAGENTS_COUNT=$(ls -1 SUBAGENTS/universal/*.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Subagentes: $SUBAGENTS_COUNT"

echo ""
echo "📊 Resumen de métricas:"
echo "   Skills: $SKILLS_COUNT"
echo "   Workflows: $WORKFLOWS_COUNT"
echo "   Tests: $TESTS_COUNT"
echo "   ADRs: $ADRS_COUNT"
echo "   Subagents: $SUBAGENTS_COUNT"
echo ""
echo "💡 Usa estas métricas para actualizar README.md y NEXT_STEPS.md"
```

**Uso:**
```bash
chmod +x SKILLS/document-sync/assets/update-docs.sh
./SKILLS/document-sync/assets/update-docs.sh
```

---

**EOF**
