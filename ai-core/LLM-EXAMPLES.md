# Ejemplos Prácticos - Evitar Creación Excesiva de Archivos

> **Casos reales de AI-Core** y cómo deberían haberse manejado.

---

## ❌ Caso 1: Documentar Progreso

### Lo que hizo el LLM (incorrecto):

```
Usuario: "Terminamos de crear 40 skills, documenta el logro"

LLM: ✅ Crea FINAL-ACHIEVEMENT.md
     ✅ Crea TASKS-COMPLETED.md
     ✅ Crea PROGRESS-REPORT.md
```

**Resultado:** 3 archivos redundantes que luego hubo que eliminar.

### Lo que DEBÍA hacer (correcto):

```
Usuario: "Terminamos de crear 40 skills, documenta el logro"

LLM: ✅ ACTUALIZA CHANGELOG.md con:
     ## [2.0.0] - 2025-01-23
     ### Added
     - 40 skills creados (100% coverage)
     - Tests de integración (10 tests)
```

**Resultado:** 1 archivo actualizado, información consolidada.

---

## ❌ Caso 2: Crear Reporte de Deuda Técnica

### Lo que hizo el LLM (incorrecto):

```
Usuario: "Revisa la deuda técnica del proyecto"

LLM: ✅ Crea GHOST-DEBT-REPORT.md
     ✅ Crea DEBT-TRACKING.md
     ✅ Crea TECHNICAL-DEBT-ANALYSIS.md
```

**Resultado:** 3 archivos con información duplicada/desactualizada.

### Lo que DEBÍA hacer (correcto):

```
Usuario: "Revisa la deuda técnica del proyecto"

LLM: ⚠️ "Voy a crear reportes de deuda técnica.
     Alternativas:
     1. Actualizar DEBT-TRACKING.md (ya existe)
     2. Crear GHOST-DEBT-REPORT.md (nuevo)

     ¿Qué prefieres?"

     Usuario: "Actualiza DEBT-TRACKING.md"

     LLM: ✅ ACTUALIZA DEBT-TRACKING.md
```

**Resultado:** 1 archivo mantenido, sin duplicación.

---

## ❌ Caso 3: Proponer Nueva Arquitectura

### Lo que hizo el LLM (incorrecto):

```
Usuario: "Necesitamos un orquestador central"

LLM: ✅ Crea ORCHESTRATOR-PROPOSAL.md
     ✅ Crea ORCHESTRATOR-DESIGN.md
     ✅ Crea ORCHESTRATOR-PLAN.md
```

**Resultado:** 3 archivos de propuesta que quedaron obsoletos cuando se implementó.

### Lo que DEBÍA hacer (correcto):

```
Usuario: "Necesitamos un orquestador central"

LLM: ✅ Crea docs/adr/002-master-orchestrator.md
     Con formato ADR:
     - Context
     - Decisión
     - Consecuencias
     - Estado: Accepted
```

**Resultado:** 1 ADR que documenta la decisión Y el resultado.

---

## ❌ Caso 4: Documentar Sistema de Symlinks

### Lo que hizo el LLM (incorrecto):

```
Usuario: "Documenta cómo funcionan los symlinks"

LLM: ✅ Crea SYMLINKS.md
     ✅ Crea SYMLINK-SETUP.md
     ✅ Crea SYMLINK-ARCHITECTURE.md
```

**Resultado:** 3 archivos fragmentados sobre un mismo tema.

### Lo que DEBÍA hacer (correcto):

```
Usuario: "Documenta cómo funcionan los symlinks"

LLM: ⚠️ "Puedo documentar symlinks de varias formas:
     1. Agregar sección a README.md (recomendado)
     2. Crear SYMLINKS.md (nuevo archivo)

     ¿Qué prefieres?"

     Usuario: "Agrégalo a README.md"

     LLM: ✅ ACTUALIZA README.md con sección "## Symlinks"
```

**Resultado:** Información consolidada en el archivo principal.

---

## ❌ Caso 5: Crear Guía de Aprendizaje

### Lo que hizo el LLM (incorrecto):

```
Usuario: "Explica cómo funciona el sistema de aprendizaje"

LLM: ✅ Crea LEARNING_GUIDE.md
     ✅ Crea LEARNING-SYSTEM.md
     ✅ Crea LEARNING-TUTORIAL.md
```

**Resultado:** 3 archivos sobre aprendizaje, información fragmentada.

### Lo que DEBÍA hacer (correcto):

```
Usuario: "Explica cómo funciona el sistema de aprendizaje"

LLM: ✅ ACTUALIZA TUTORIAL.md con sección "## Sistema de Aprendizaje"
     O
     ✅ ACTUALIZA ARCHITECTURE.md si es arquitectura interna
```

**Resultado:** Información en el archivo correcto según el tipo.

---

## ✅ Patrones Correctos

### Patrón 1: Progreso/Logros

```
❌ NO CREAR:
   - PROGRESS-REPORT.md
   - FINAL-ACHIEVEMENT.md
   - TASKS-COMPLETED.md
   - MILESTONES.md

✅ CREAR/ACTUALIZAR:
   - CHANGELOG.md (único fuente de verdad para progreso)
```

### Patrón 2: Guías/Tutoriales

```
❌ NO CREAR:
   - LEARNING-GUIDE.md
   - GETTING-STARTED.md
   - QUICKSTART.md
   - USER-GUIDE.md

✅ CREAR/ACTUALIZAR:
   - TUTORIAL.md (todas las guías en un solo lugar)
```

### Patrón 3: Arquitectura

```
❌ NO CREAR:
   - SYSTEM-DESIGN.md
   - ORCHESTRATOR-DESIGN.md
   - ARCHITECTURE-OVERVIEW.md
   - TECHNICAL-ARCHITECTURE.md

✅ CREAR/ACTUALIZAR:
   - ARCHITECTURE.md (toda la arquitectura en un lugar)
   - docs/adr/*.md (para decisiones específicas)
```

### Patrón 4: Propuestas

```
❌ NO CREAR:
   - PROPOSAL-*.md
   - DESIGN-PROPOSAL.md
   - FEATURE-PROPOSAL.md

✅ CREAR/ACTUALIZAR:
   - docs/adr/NNN-title.md (Architecture Decision Records)
```

### Patrón 5: Reportes

```
❌ NO CREAR:
   - *REPORT.md
   - STATUS.md
   - METRICS.md (a menos que haya script automatizado)

✅ CREAR/ACTUALIZAR:
   - CHANGELOG.md (si es histórico)
   - README.md (si es estado actual)
```

---

## 🎯 Flujo de Decisión - Ejemplo Práctico

```
USUARIO: "Documenta X"

┌─ ¿Es un skill o test?
│  Sí → CREAR (SKILLS/*/SKILL.md o tests/*.test.md)
│  No  ↓
│
├─ ¿Es progreso/logro histórico?
│  Sí → ACTUALIZAR CHANGELOG.md
│  No  ↓
│
├─ ¿Es una guía para usuarios?
│  Sí → ACTUALIZAR TUTORIAL.md
│  No  ↓
│
├─ ¿Es arquitectura/diseño?
│  Sí → ACTUALIZAR ARCHITECTURE.md
│  No  ↓
│
├─ ¿Es una decisión arquitectónica?
│  Sí → CREAR docs/adr/NNN-title.md
│  No  ↓
│
└─ ¿Es algo más?
   → PREGUNTAR AL USUARIO
```

---

## 💬 Scripts Útiles para el Usuario

### Verificar si un archivo es necesario:

```bash
# Buscar archivos similares
ls -1 *.md | grep -i "keyword"

# Ver si el archivo ya existe
ls -1 *.md | xargs grep -l "similar content"

# Encontrar archivos obsoletos (sin commits en 6 meses)
find . -name "*.md" -mtime +180
```

### Limpiar archivos redundantes:

```bash
# Encontrar duplicados por contenido
fdupes ./*.md

# Ver tamaño de archivos .md
du -h *.md | sort -h
```

---

## 📊 Métricas de Archivos en AI-Core

### Antes (con demasiados archivos):

```
Archivos .md en root: 23
Archivos redundantes: 5+
Archivos obsoletos: 3+
```

### Después (cleanup):

```
Archivos .md en root: 18
Archivos redundantes: 0
Archivos obsoletos: 0
```

### Objetivo a futuro:

```
Archivos .md en root: < 15
Archivos obsoletos: 0
```

---

**Conclusión:** Menos archivos = Mejor organización = Documentación que se mantiene actualizada.

---

**Fecha:** 2025-01-24
**Lecciones aprendidas:** De archivos redundantes en AI-Core
