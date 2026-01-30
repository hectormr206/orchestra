<!-- ============================================================================
     AI-CORE INTEGRATION - GEMINI CLI
     ============================================================================
     Este proyecto usa ai-core para patrones universales de desarrollo.

     CÓMO FUNCIONA:
     1. Lee primero ai-core/GEMINI.md para patrones universales de Gemini
     2. Luego aplica las instrucciones específicas de este archivo (abajo)
     3. Para skills específicos, consulta ai-core/SKILLS/{skill}/SKILL.md

     PRIORIDAD: Las instrucciones de este archivo tienen precedencia sobre ai-core
     ============================================================================ -->

> **Orden de lectura** para Gemini CLI:
>
> 1. `ai-core/GEMINI.md` ← Patrones universales para Gemini
> 2. Este archivo ← Instrucciones específicas de TU proyecto
>
> **Precedencia**: Este archivo > ai-core

---

# Instrucciones del Proyecto para Gemini CLI

<!--
  ╔════════════════════════════════════════════════════════════╗
  ║  AGREGA AQUÍ LAS INSTRUCCIONES ESPECÍFICAS DE TU PROYECTO  ║
  ╚════════════════════════════════════════════════════════════╝
-->

## Stack Tecnológico

<!-- Describe tu stack aquí -->

## Reglas del Proyecto

<!-- Agrega reglas específicas para Gemini -->

## Estructura del Proyecto

<!-- Describe la estructura de directorios -->

---

## Skills Disponibles (via ai-core)

Los skills están en: `.gemini/skills/` (symlink a `ai-core/SKILLS/`)

### Auto-Detección de Skills

Gemini detectará automáticamente qué skill usar según palabras clave:

| Si mencionas...      | Skill a usar |
| -------------------- | ------------ |
| auth, login, JWT     | `security`   |
| test, spec, mock     | `testing`    |
| API, endpoint, REST  | `backend`    |
| component, UI, React | `frontend`   |
| database, SQL, query | `database`   |

Para lista completa, ver `ai-core/GEMINI.md`.
