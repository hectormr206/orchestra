# Guía para Prevenir Creación Excesiva de Archivos por LLMs

> **Problema:** Los LLMs (Claude Code, Open Code, etc.) tienden a crear archivos innecesarios que luego quedan obsoletos y olvidados.
> **Solución:** Patrones y reglas para controlar qué archivos se crean y cuándo.

---

## 🔍 Análisis del Problema en AI-Core

### Archivos Creados que Resultaron Innecesarios

| Archivo | Por qué se creó | Destino final |
|---------|-----------------|---------------|
| `FINAL-ACHIEVEMENT.md` | Documentar logro | Eliminado (redundante) |
| `TASKS-COMPLETED.md` | Listar tareas completadas | Eliminado (redundante) |
| `PROGRESS-REPORT.md` | Reporte de progreso | Podría ser obsoleto |
| `GHOST-DEBT-REPORT.md` | Reporte de ghost debt | Eliminado (desactualizado) |
| `SCRIPTS_FINAL_STATE.md` | Documentar estado de scripts | Eliminado (histórico) |
| `ORCHESTRATOR_PROPOSAL.md` | Propuesta de orquestador | Eliminado (obsoleto) |
| `AI_MANIFEST.md` | Manifiesto universal | Posiblemente redundante con AGENTS.md |
| `LEARNING_GUIDE.md` | Guía de aprendizaje | Podría estar en TUTORIAL.md |
| `SYMLINKS.md` | Documentar symlinks | Podría estar en README.md |
| `SYNC.md` | Sistema de sincronización | Podría estar en ARCHITECTURE.md |
| `MAINTENANCE_PLAN.md` | Plan de mantenimiento | ¿Se usa realmente? |

**Problema:** 10+ archivos de documentación que podrían haberse evitado o consolidado.

---

## 🎯 Patrones Problemáticos Identificados

### 1. **Archivos de "Progreso" Transitorio**

```
PROGRESS-REPORT.md
TASKS-COMPLETED.md
FINAL-ACHIEVEMENT.md
```

**Problema:** Los LLMs crean estos archivos para documentar el progreso, pero:
- La información ya está en `CHANGELOG.md`
- La información ya está en `NEXT_STEPS.md`
- Quedan obsoletos rápidamente
- Se olvidan y no se actualizan

**Solución:** Usar `CHANGELOG.md` para todo el progreso.

### 2. **Archivos de "Reporte" Específicos**

```
GHOST-DEBT-REPORT.md
DEBT-TRACKING.md
SCRIPTS_FINAL_STATE.md
```

**Problema:** Reportes muy específicos que:
- Tienen datos que quedan obsoletos en días
- Se duplican entre sí
- Nadie los consulta después

**Solución:** Solo crear si hay un **proceso automatizado** que los actualice periódicamente.

### 3. **Archivos de "Propuesta"**

```
ORCHESTRATOR_PROPOSAL.md
PROPOSAL-*.md
```

**Problema:** Las propuestas se vuelven obsoletas cuando se implementa:
- La propuesta ya no es relevante
- La implementación real difiere
- Queda como "ruido" histórico

**Solución:** Usar ADRs (Architecture Decision Records) que se actualizan con el resultado.

### 4. **Archivos de "Guía" Fragmentados**

```
LEARNING_GUIDE.md
SYMLINKS.md
SYNC.md
MAINTENANCE_PLAN.md
```

**Problema:** Información fragmentada en muchos archivos pequeños:
- Difícil de encontrar
- Se olvida qué archivo contiene qué
- Sobrecarga cognitiva

**Solución:** Consolidar en archivos principales (TUTORIAL.md, ARCHITECTURE.md, README.md).

---

## ✅ Estrategias de Prevención

### Estrategia 1: Catálogo de Archivos Permitidos

Crear un archivo `.llm-file-catalog.md` que liste **SOLO** los archivos que los LLMs pueden crear:

```yaml
# .llm-file-catalog.md
allowed_files:
  documentation:
    - README.md
    - CHANGELOG.md
    - ARCHITECTURE.md
    - TUTORIAL.md
    - EXAMPLES.md

  never_create:
    - PROGRESS-*.md
    - *REPORT*.md
    - *ACHIEVEMENT*.md
    - *TASKS*.md
    - *PROPOSAL*.md

  require_approval:
    - SKILLS/*/
    - docs/adr/
    - tests/
```

### Estrategia 2: Reglas de Creación de Archivos

**Antes de crear cualquier archivo .md nuevo, el LLM DEBE:**

1. **Verificar si ya existe un archivo similar**
   ```bash
   # Buscar archivos con keywords similares
   ls -1 *.md | grep -i "similar_keyword"
   ```

2. **Preguntar al usuario** si el archivo es realmente necesario
   ```
   ⚠️ Voy a crear NOMBRE_ARCHIVO.md.
   ¿Este archivo es realmente necesario o podemos usar ARCHIVO_EXISTENTE.md?
   ```

3. **Consolidar si es posible**
   - ¿La información cabe en un archivo existente?
   - ¿Podemos actualizar un archivo en lugar de crear uno nuevo?

### Estrategia 3: Categorización de Archivos

**Archivos PERMANENTES (se crean una vez):**
- `README.md` - Documentación principal
- `ARCHITECTURE.md` - Arquitectura del sistema
- `TUTORIAL.md` - Guías de usuario
- `CHANGELOG.md` - Historial de cambios
- `.gitignore` - Archivos ignorados por git

**Archivos SEMESTRALES (se actualizan cada 3-6 meses):**
- `AGENTS.md` - Guía de agentes
- `CLAUDE.md` - Instrucciones específicas
- `DEBT-TRACKING.md` - Solo si se mantiene activamente

**Archivos TRANSITORIOS (NO crear):**
- ❌ `PROGRESS-*.md` - Usar CHANGELOG.md
- ❌ `TASKS-COMPLETED.md` - Usar CHANGELOG.md
- ❌ `*REPORT*.md` - Usar CHANGELOG.md
- ❌ `*ACHIEVEMENT.md` - Usar CHANGELOG.md
- ❌ `*PROPOSAL.md` - Usar ADRs

**Archivos AUTOMATIZADOS (solo si hay scripts que los actualizan):**
- `METRICS.md` - Solo si hay script que lo genera
- `STATUS.md` - Solo si hay script que lo actualiza

### Estrategia 4: Sobrescritura vs Creación

**Regla de oro:**
```
¿El archivo existe? → ACTUALIZARLO
¿El archivo NO existe? → PREGUNTAR SI ES NECESARIO
```

**Ejemplos:**

| Caso | Acción Correcta | Acción Incorrecta |
|------|----------------|-------------------|
| Documentar progreso | Actualizar `CHANGELOG.md` | Crear `PROGRESS-REPORT.md` |
| Documentar logro | Actualizar `CHANGELOG.md` | Crear `FINAL-ACHIEVEMENT.md` |
| Proponer cambio | Crear/actualizar `ADR` | Crear `PROPOSAL.md` |
| Explicar concepto | Agregar a `TUTORIAL.md` | Crear `CONCEPT-NAME.md` |
| Documentar setup | Agregar a `README.md` | Crear `SETUP.md` |

---

## 🛠️ Implementación en CLAUDE.md

Agregar a `CLAUDE.md` o crear reglas específicas:

```markdown
## REGLAS DE CREACIÓN DE ARCHIVOS

### Antes de crear cualquier archivo .md:

1. **VERIFICAR** si ya existe un archivo similar
   ```bash
   ls -1 *.md | grep -i "keyword"
   ```

2. **CONSOLIDAR** si es posible
   - ¿La información cabe en README.md?
   - ¿Es documentación de progreso? → Usar CHANGELOG.md
   - ¿Es una guía? → Usar TUTORIAL.md
   - ¿Es arquitectura? → Usar ARCHITECTURE.md

3. **PREGUNTAR** al usuario
   ```
   ⚠️ Voy a crear NOMBRE_ARCHIVO.md.
   Alternativas:
   - Agregar a ARCHIVO_EXISTENTE.md
   - No crear (información ya documentada)
   ¿Qué prefieres?
   ```

### Archivos PROHIBIDOS (crear solo con autorización explícita):

- ❌ PROGRESS-*.md
- ❌ *REPORT*.md (excepto si hay script automatizado)
- ❌ *ACHIEVEMENT*.md
- ❌ *TASKS*.md
- ❌ *PROPOSAL*.md (usar ADRs en su lugar)
- ❌ *FINAL*.md

### Archivos PERMITIDOS (sin preguntar):

- ✅ SKILLS/*/SKILL.md
- ✅ tests/skills/*.test.md
- ✅ docs/adr/*.md
- ✅ CHANGELOG.md (solo actualizar)

### Flujo de Decisión:

```
¿Necesitas crear un archivo .md?
│
├─ ¿Es un skill? → CREAR
├─ ¿Es un test? → CREAR
├─ ¿Es un ADR? → CREAR
│
├─ ¿Es documentación de progreso?
│  → ACTUALIZAR CHANGELOG.md
│
├─ ¿Es una guía/tutorial?
│  → ACTUALIZAR TUTORIAL.md
│
├─ ¿Es arquitectura?
│  → ACTUALIZAR ARCHITECTURE.md
│
└─ ¿Es otro tipo de documento?
   → PREGUNTAR AL USUARIO
```

---

## 📋 Plantillas de Respuesta del LLM

### Template 1: Antes de Crear Archivo

```markdown
## ⚠️ Solicitud de Confirmación

Voy a crear el archivo: **`NUEVO_ARCHIVO.md`**

**Propósito:** [Explicar propósito]

**Análisis de alternativas:**
- ✅ **Opción A:** Agregar a `ARCHIVO_EXISTENTE.md` (recomendado)
  - Razón: [Explicar por qué es mejor]
- ❌ **Opción B:** Crear nuevo archivo
  - Razón: [Explicar por qué podría ser necesario]

**¿Qué prefieres?**
1. Agregar a `ARCHIVO_EXISTENTE.md`
2. Crear `NUEVO_ARCHIVO.md`
3. No hacer nada (ya está documentado)
```

### Template 2: Al Actualizar Archivos

```markdown
## 📝 Actualizando Archivo Existente

**Archivo:** `ARCHIVO_EXISTENTE.md`
**Motivo:** [Explicar por qué no crear uno nuevo]

**Cambios:**
- [ ] Sección agregada/actualizada: [nombre]
- [ ] Información consolidada de: [fuentes]

Esto evita crear `NUEVO_ARCHIVO.md` redundante.
```

---

## 🎯 Checklist para el Usuario

### Antes de Pedirle al LLM que Cree Archivos:

- [ ] ¿El archivo realmente es necesario?
- [ ] ¿No existe ya un archivo similar?
- [ ] ¿La información no cabe en un archivo existente?
- [ ] ¿El archivo se mantendrá actualizado?
- [ ] ¿El archivo tiene un propósito claro a largo plazo?

### Si la respuesta es "NO" a cualquiera:

**No crear el archivo.** En su lugar:
- Actualizar un archivo existente
- Agregar a CHANGELOG.md
- No documentar (si no es necesario)

---

## 🔧 Implementación Técnica

### Opción 1: Agregar a CLAUDE.md

Agregar la sección "REGLAS DE CREACIÓN DE ARCHIVOS" al inicio de CLAUDE.md.

### Opción 2: Archivo Separado

Crear `.llm-guidelines.md` con las reglas y referenciarlo desde CLAUDE.md:

```markdown
<!-- CLAUDE.md -->
## Reglas Adicionales

Ver: `.llm-guidelines.md` para reglas de creación de archivos.
```

### Opción 3: Pre-commit Hook

Crear un script que verifique archivos antes de hacer commit:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Verificar archivos prohibidos
forbidden=("PROGRESS" "REPORT" "ACHIEVEMENT" "TASKS" "PROPOSAL")

for file in $(git diff --cached --name-only --diff-filter=ACM | grep '\.md$'); do
  for pattern in "${forbidden[@]}"; do
    if echo "$file" | grep -q "$pattern"; then
      echo "⚠️  Archivo posiblemente innecesario: $file"
      echo "   Contiene patrón prohibido: $pattern"
      echo "   Ver: .llm-guidelines.md"
      echo ""
      read -p "¿Continuar con el commit? (y/N) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    fi
  done
done
```

---

## 📊 Métricas de Éxito

### Objetivos:

| Métrica | Actual | Objetivo | Cómo medir |
|---------|--------|----------|------------|
| Archivos .md en root | 18 | < 15 | `ls -1 *.md \| wc -l` |
| Archivos redundantes | 0 | 0 | Revisión manual |
| Archivos obsoletos | 0 | 0 | Revisión mensual |
| Archivos sin actualizaciones > 6 meses | ? | 0 | `git log --oneline --all -- 'file.md'` |

### Monitoreo:

```bash
# Encontrar archivos obsoletos (sin commits en 6 meses)
find . -name "*.md" -mtime +180 -not -path "./.git/*" -not -path "./archive/*"
```

---

## 🎓 Conclusión

**Principio clave:**
> "Es mejor actualizar un archivo existente que crear uno nuevo. La documentación fragmentada es documentación olvidada."

**Regla de oro:**
> "Antes de crear, preguntar: ¿Realmente necesito este archivo o puedo usar uno existente?"

---

**Fecha:** 2025-01-24
**Creado por:** ai-core team
**Aplica a:** Claude Code, Open Code, Cursor, y otros LLMs basados en archivos
