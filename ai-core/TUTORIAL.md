# AI-Core Tutorial

> Guía paso a paso para usuarios nuevos de AI-Core

## 🎯 ¿Qué aprenderás?

En este tutorial aprenderás a:
1. Instalar AI-Core en tu proyecto
2. Usar los skills universales
3. Crear tus propios skills
4. Mantener todo sincronizado

---

## Paso 1: Instalación

### Opción A: En un proyecto existente

```bash
cd /path/to/tu-proyecto
git clone https://github.com/hectormr206/ai-core.git ai-core
cd ai-core
./run.sh
```

Esto creará:
- `AGENTS.md` - Guía maestra de tu proyecto
- `CLAUDE.md` - Configuración para Claude Code
- Links simbólicos a skills

### Opción B: Desarrollo en AI-Core

Ya estás aquí. Los skills están en `SKILLS/`.

---

## Paso 2: Usar Skills

### Ejemplo 1: Agregar Autenticación

Pídete a Claude:

> "Quiero agregar autenticación con OAuth2"

Claude automáticamente:
1. Lee CLAUDE.md
2. Identifica que necesita el skill `security`
3. Lee SKILLS/security/SKILL.md
4. Implementa OAuth2 con best practices

### Ejemplo 2: Crear Tests

> "Crea tests para el endpoint de login"

Claude usa el skill `testing`:
- Aplica Test Pyramid
- Crea unit tests, integration, E2E
- Sigue patrones TDD

---

## Paso 3: Crear tu Propio Skill

```bash
# 1. Crear directorio
mkdir -p SKILLS/my-skill/patterns

# 2. Crear SKILL.md
cat > SKILLS/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: My custom skill
license: Apache-2.0
---

## When to Use
- [Describe cuando usar este skill]

## Critical Patterns
### ALWAYS
- [Reglas importantes]
EOF
```

---

## Paso 4: Mantener Todo Actualizado

El skill `document-sync` mantiene automáticamente:
- NEXT_STEPS.md
- CHANGELOG.md
- README.md

Cuando completes una tarea, estos archivos se actualizan solos.

---

## ¿Necesitas Ayuda?

- `README.md` - Documentación principal
- `AGENTS.md` - Guía de agentes
- `NEXT_STEPS.md` - Tareas pendientes
