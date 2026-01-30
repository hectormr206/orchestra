# ADR 006: Standard Skill Structure

## Status
Accepted

## Context
Los skills necesitan una estructura consistente para que LLMs los puedan leer y entender correctamente.

## Decision
Estructura estándar para todos los skills con frontmatter YAML obligatorio.

### Required Frontmatter

```yaml
---
name: skill-name
description: >
  Detailed description of what the skill does
  and when to use it. Can be multi-line.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]  # or [backend], [frontend], etc.
  auto_invoke:
    - "Trigger phrase 1"
    - "Trigger phrase 2"
  tags: [tag1, tag2, tag3]
allowed-tools: [Read, Write, Edit, Grep, Bash]
---
```

### Required Sections

1. **When to Use** - Cuándo invocar este skill
2. **Critical Patterns** - Reglas ALWAYS/NEVER
3. **Commands and Tools** - Herramientas disponibles
4. **Examples** - Ejemplos prácticos (OBLIGATORIO)
5. **Related Skills** - Skills relacionados

### Optional Sections

- Patterns (en subdirectory `patterns/`)
- Assets (en subdirectory `assets/`)
- Troubleshooting
- Best Practices

## Consequences

### Positives
- Consistencia entre todos los skills
- Fácil de leer para LLMs
- Meta-data estructurado

### Negatives
- Requiere más trabajo inicial
- Puede sentirse rígido

## Examples
See any skill in `SKILLS/` for examples.
