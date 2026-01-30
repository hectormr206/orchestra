# Platform-Specific Configuration

> Guía detallada de configuración de subagentes para cada plataforma soportada.

---

## Tabla de Contenidos

1. [Claude Code](#claude-code)
2. [OpenCode](#opencode)
3. [Gemini CLI](#gemini-cli)
4. [GitHub Copilot](#github-copilot)
5. [Migración entre Plataformas](#migración-entre-plataformas)

---

## Claude Code

### Estructura de Archivos

```
.claude/
├── agents/                    # Project agents (committed to repo)
│   ├── security-specialist.md
│   ├── frontend-specialist.md
│   └── backend-specialist.md
└── config.json                # Claude Code configuration
```

### Formato de Agente

```markdown
---
name: security-specialist
description: >
  Security expert specializing in OWASP Top 10, Zero Trust,
  authentication, and security audits.
tools: [Read,Edit,Write,Bash,Grep]
model: inherit
---

You are a security expert...

## When to Use

- Implementing authentication
- Fixing security vulnerabilities
- Conducting security audits

## Critical Patterns

### > **ALWAYS**
1. Validate input on server
2. Use parameterized queries
...
```

### Campos del Frontmatter

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ Sí | Identificador único (lowercase, guiones) |
| `description` | string | ✅ Sí | Descripción del agente (crítico para invocación automática) |
| `tools` | array | ❌ No | Lista de herramientas (omite para heredar todas) |
| `model` | string | ❌ No | `sonnet`, `opus`, `haiku`, o `inherit` |

### Herramientas Disponibles

```yaml
tools:
  - Read      # Leer archivos
  - Edit      # Editar archivos (existente)
  - Write     # Crear nuevos archivos
  - Bash      # Ejecutar comandos
  - Grep      # Buscar en archivos
  - Glob      # Buscar archivos por patrón
  - WebSearch # Búsqueda web
  - WebFetch  # Obtener URLs
```

### Instalación

```bash
# Usar el script de instalación
./ai-core/scripts/install-subagents.sh --platforms claude-code

# O manualmente
mkdir -p .claude/agents
cp ai-core/SUBAGENTS/universal/*.md .claude/agents/

# O con symlinks
ln -s $(pwd)/ai-core/SUBAGENTS/universal/*.md .claude/agents/
```

### Uso

```bash
# Ver todos los agentes
/agents

# Invocar agente específico
/security-specialist Help me implement OAuth2

# Invocación automática (Claude decide)
I need to add authentication to my API
# Claude invocará security-specialist automáticamente
```

### Prioridad de Agentes

```
1. Project agents (.claude/agents/)     ← Mayor prioridad
2. User agents (~/.claude/agents/)
3. Plugin agents                       ← Menor prioridad
```

---

## OpenCode

### Estructura de Archivos

```
.opencode/
├── agents/                    # Project agents
│   ├── security-specialist.md
│   └── frontend-specialist.md
└── config.json                # OpenCode configuration

~/.config/opencode/            # Global agents
└── agents/
    └── custom-agent.md
```

### Formato de Agente (Markdown + YAML)

```markdown
---
description: >
  Security expert specializing in OWASP Top 10,
  Zero Trust, and authentication.
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  read: true
  edit: true
  write: true
  bash: true
  grep: true
---

You are a security expert...

## When to Use

- Implementing authentication
- Fixing security vulnerabilities
...
```

### Campos Adicionales de OpenCode

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `mode` | string | `primary`, `subagent`, o `all` |
| `temperature` | number | 0.0 - 1.0 (creatividad) |
| `maxSteps` | number | Límite de iteraciones |
| `hidden` | boolean | Ocultar del menú `@` |
| `permission` | object | Permisos específicos por comando |

### Configuración de Permisos

```yaml
---
tools:
  read: true
  edit: true
  write: false
  bash:
    default: ask
    allow:
      - "git *"
      - "grep *"
    deny:
      - "rm -rf *"
      - "git push"
---
```

### MCP Servers

```yaml
---
mcp-servers:
  github:
    type: builtin
    tools:
      - github/issues
      - github/pull_requests

  custom-mcp:
    type: local
    command: node
    args: ["./my-mcp-server/index.js"]
    tools: ["*"]
    env:
      API_KEY: ${{ secrets.MY_API_KEY }}
---
```

### Instalación

```bash
# Usar el script de instalación
./ai-core/scripts/install-subagents.sh --platforms opencode

# O manualmente
mkdir -p .opencode/agents
cp ai-core/SUBAGENTS/.agents/opencode/*.md .opencode/agents/
```

### Uso

```bash
# Ver todos los agentes
/agents

# Invocar con @
@security-specialist Implement OAuth2 authentication

# Ver detalles del agente
/agents show security-specialist
```

---

## Gemini CLI

### Estructura de Archivos

```
.gemini/
└── skills/                    # Workspace skills (committed to repo)
    ├── security-specialist/
    │   ├── SKILL.md           # Required
    │   ├── scripts/           # Optional
    │   ├── references/        # Optional
    │   └── assets/            # Optional
    └── frontend-specialist/
        └── SKILL.md

~/.gemini/skills/              # User skills (global)
└── custom-skill/
    └── SKILL.md
```

### Formato de Skill

```markdown
---
name: security-specialist
description: >
  Expert in security reviews, OWASP Top 10, Zero Trust,
  and authentication. Use when user asks for "security",
  "review", "audit", or "vulnerabilities".
---

# Security Specialist

You are a security expert...

## Activation

This skill is automatically activated when:
- User asks for security review
- Implementing authentication
- Fixing security vulnerabilities

## Critical Patterns

### > **ALWAYS**
1. Validate input on server
2. Use parameterized queries
...
```

### Configuración Experimental

```bash
# Habilitar experimental skills
/settings
# Buscar "experimental.skills" y activar
```

### Comandos de Gestión

```bash
# Listar todas las skills
gemini skills list

# Instalar desde directorio local
gemini skills install ./ai-core/SUBAGENTS/.agents/gemini/security-specialist

# Instalar con scope
gemini skills install ./skill-dir --scope workspace

# Instalar desde Git
gemini skills install https://github.com/user/repo.git

# Habilitar/deshabilitar
gemini skills enable security-specialist
gemini skills disable security-specialist --scope workspace

# Recargar skills
gemini skills reload

# Eliminar skill
gemini skills uninstall security-specialist
```

### Directorio de Assets

```
security-specialist/
├── SKILL.md                    # Instrucciones principales
├── scripts/                    # Scripts ejecutables
│   ├── audit.sh
│   └── scan.py
├── references/                 # Documentación de referencia
│   ├── OWASP-Top-10.md
│   └── zero-trust.md
└── assets/                     # Archivos estáticos
    └── templates/
        └── security-checklist.md
```

### Instalación

```bash
# Usar el script de instalación
./ai-core/scripts/install-subagents.sh --platforms gemini

# O manualmente
mkdir -p .gemini/skills
for agent in ai-core/SUBAGENTS/universal/*.md; do
  name=$(basename "$agent" .md)
  mkdir -p ".gemini/skills/$name"
  cp "$agent" ".gemini/skills/$name/SKILL.md"
done
```

### Uso

```bash
# Gemini activará skills automáticamente
gemini "Review my code for security issues"
# Activa security-specialist

gemini "Help me create a React component"
# Activa frontend-specialist
```

---

## GitHub Copilot

### Estructura de Archivos

```
.github/
└── copilot-instructions.md    # Repository-level instructions

# Organization-level
# Configurado via GitHub admin console

# Enterprise-level
# Configurado via GitHub enterprise settings
```

### Formato de Custom Agent

```markdown
---
name: security-specialist
description: >
  Focuses on security reviews, OWASP Top 10 compliance,
  and Zero Trust architecture without modifying production code.
tools: ["read", "edit", "search"]
mcp-servers:
  github:
    type: builtin
---

You are a security specialist focused on ensuring code security and compliance.

## Responsibilities

- Analyze code for security vulnerabilities
- Review implementations for OWASP Top 10 compliance
- Suggest security improvements
- Ensure Zero Trust principles are followed

## When Invoked

Focus on:
- Code security and best practices
- Potential vulnerabilities (XSS, SQL injection, etc.)
- Authentication and authorization
- Secrets management
- Security headers and CORS
...
```

### Tool Aliases

| Alias | Compatible con |
|-------|----------------|
| `execute` | `shell`, `Bash`, `powershell` |
| `read` | `Read`, `NotebookRead` |
| `edit` | `Edit`, `MultiEdit`, `Write`, `NotebookEdit` |
| `search` | `Grep`, `Glob` |
| `agent` | `custom-agent`, `Task` |
| `web` | `WebSearch`, `WebFetch` |
| `todo` | `TodoWrite` |

### MCP Servers Incorporados

```yaml
---
mcp-servers:
  # GitHub MCP (read-only)
  github:
    type: builtin
    tools: ["github/*"]  # Todas las herramientas

  # Playwright MCP
  playwright:
    type: builtin
    tools: ["playwright/*"]

  # Custom MCP
  custom-mcp:
    type: local
    command: some-command
    args: [--arg1, --arg2]
    tools: ["*"]
    env:
      ENV_VAR: ${{ secrets.MY_SECRET }}
---
```

### Instalación

```bash
# Usar el script de instalación
./ai-core/scripts/install-subagents.sh --platforms github-copilot

# O manualmente
cat > .github/copilot-instructions.md << 'EOF'
# Custom Agents

<!-- Security Specialist -->
---
name: security-specialist
description: Security expert...
tools: ["read", "edit", "search"]
---

You are a security expert...
EOF
```

### Uso en VS Code

```bash
# Invocar agente en VS Code
@security-specialist Help me implement OAuth2

# Ver agentes disponibles
@<Ctrl+Space>  # Muestra lista de agentes
```

### Versioning

- Basado en **Git commit SHAs**
- Soporta branches/tags con diferentes versiones
- Interacciones en PRs usan la misma versión para consistencia

---

## Migración entre Plataformas

### Claude Code → OpenCode

```yaml
# Claude Code
---
tools: [Read,Edit,Write,Bash]
---

# OpenCode
---
tools:
  read: true
  edit: true
  write: true
  bash: true
---
```

### Claude Code → Gemini CLI

```bash
# 1. Renombrar archivo a SKILL.md
mv security-specialist.md security-specialist/SKILL.md

# 2. Ajustar description para activación automática
description: >
  Use when user asks for "security", "review", or "audit"

# 3. Agregar assets si es necesario
```

### Claude Code → GitHub Copilot

```yaml
# Claude Code
---
tools: [Read,Edit,Write,Bash,Grep]
---

# GitHub Copilot
---
tools: ["read", "edit", "execute", "search"]
---
```

### Script de Conversión

```bash
#!/bin/bash
# convert-agent.sh - Convierte agentes entre plataformas

INPUT_FILE="$1"
TARGET_PLATFORM="$2"

case $TARGET_PLATFORM in
  opencode)
    # Convert tools array to object
    sed 's/tools: \[\(.*\)\]/tools:\n    \1: true/g' "$INPUT_FILE"
    ;;
  gemini)
    # Create directory and rename to SKILL.md
    mkdir -p "${INPUT_FILE%.md}"
    mv "$INPUT_FILE" "${INPUT_FILE%.md}/SKILL.md"
    ;;
  github-copilot)
    # Convert tools to aliases
    sed 's/Read/read/g; s/Edit/edit/g; s/Bash/execute/g; s/Grep/search/g' "$INPUT_FILE"
    ;;
esac
```

---

## Comparativa Rápida

| Característica | Claude Code | OpenCode | Gemini CLI | GitHub Copilot |
|----------------|-------------|----------|------------|----------------|
| **Formato** | Markdown + YAML | Markdown + YAML | Markdown + YAML | Markdown + YAML |
| **Skills modulares** | ✅ | ✅ | ✅ | ❌ |
| **MCP support** | ✅ | ✅ | ⚠️ | ✅ |
| **Assets/scripts** | ❌ | ❌ | ✅ | ❌ |
| **Permisos granulares** | ❌ | ✅ | ❌ | ✅ |
| **Auto-invocación** | ✅ | ✅ | ✅ | ✅ |
| **Estado** | Stable | Stable | Experimental | Public Preview |

---

## Troubleshooting

### Los agentes no aparecen

```bash
# Claude Code
/agents reload

# OpenCode
/agents reload

# Gemini CLI
gemini skills reload

# GitHub Copilot
# Recargar ventana de VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

### Errores de sintaxis YAML

```bash
# Validar YAML
python -c "import yaml; yaml.safe_load(open('agent.md'))"

# O con yamllint
yamllint .claude/agents/*.md
```

### Conflictos con otros agentes

```bash
# Usar prefijo para evitar conflictos
./install-subagents.sh --prefix "ai-core-"
```

---

## Recursos

- [Claude Code Docs](https://code.claude.com/docs)
- [OpenCode Docs](https://opencode.ai/docs)
- [Gemini CLI Docs](https://geminicli.com/docs)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)

---

**EOF**
