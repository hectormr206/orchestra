#!/bin/bash
# ============================================================================
# AI-CORE - INSTALACIÓN EN UN SOLO PASO
# ============================================================================
# Ejecuta este script desde dentro de ai-core para instalar todo en el
# proyecto padre automáticamente.
#
# Uso:
#   cd /ruta/a/tu/proyecto/ai-core
#   ./run.sh
#
# ⚠️  IMPORTANTE: Este script NO debe ejecutarse dentro del repositorio ai-core.
# Debe ejecutarse cuando ai-core está clonado DENTRO de OTRO proyecto.
#
# Lo que hace:
#   - Verifica que NO estás en el repo ai-core (evita auto-instalación)
#   - Crea/actualiza AGENTS.md, CLAUDE.md, GEMINI.md en el proyecto padre
#   - Crea symlinks .claude/skills y .claude/agents
#   - Configura workflows de mantenimiento automático
#   - Registra el proyecto en ai-core para recibir actualizaciones
#   - Detecta automáticamente el directorio padre
#   - Funciona con symlinks (Linux/macOS) o copias (Windows)
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              AI-CORE - INSTALACIÓN AUTOMÁTICA                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# DETECTAR DIRECTORIO PADRE
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_CORE_DIR="$SCRIPT_DIR"

# Detectar si estamos en ai-core
if [[ ! -d "$AI_CORE_DIR/SKILLS" ]] || [[ ! -d "$AI_CORE_DIR/SUBAGENTS" ]]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde dentro de ai-core${NC}"
    echo -e "${YELLOW}Ubicación esperada: /ruta/a/tu/proyecto/ai-core/${NC}"
    exit 1
fi

# Detectar si estamos DENTRO del repositorio ai-core original (no en una copia/clon)
# Verificamos si el directorio actual tiene .git y si ese repo es ai-core
if [[ -d "$AI_CORE_DIR/.git" ]] && [[ -f "$AI_CORE_DIR/.git/config" ]]; then
    # Estamos en un repo git, verificar si es el repo ai-core original
    # leyendo el remote origin directamente del config de este repo
    REPO_ORIGIN=$(grep -A 2 'remote "origin"' "$AI_CORE_DIR/.git/config" 2>/dev/null | grep 'url = ' | head -1 | sed 's/.*url = //' || echo "")

    # Si el remote contiene "ai-core", probablemente estamos en el repo original
    if [[ -n "$REPO_ORIGIN" ]] && [[ "$REPO_ORIGIN" == *"ai-core"* ]]; then
        echo -e "${YELLOW}⚠️  Detectado: Estás ejecutando run.sh dentro del repositorio ai-core original${NC}"
        echo ""
        echo -e "${BLUE}ai-core está diseñado para ser clonado DENTRO de otros proyectos.${NC}"
        echo ""
        echo -e "${CYAN}Uso correcto:${NC}"
        echo "  1. Ve a tu proyecto:"
        echo -e "     ${YELLOW}cd /ruta/a/tu/proyecto${NC}"
        echo "  2. Clona ai-core (HTTPS o SSH):"
        echo -e "     ${YELLOW}git clone https://github.com/hectormr206/ai-core.git ai-core${NC}"
        echo -e "     ${YELLOW}# o con SSH:${NC}"
        echo -e "     ${YELLOW}git clone git@github.com:hectormr206/ai-core.git ai-core${NC}"
        echo "  3. Elimina .git (necesario para evitar el error):"
        echo -e "     ${YELLOW}cd ai-core && rm -rf .git${NC}"
        echo "  4. Ejecuta la instalación:"
        echo -e "     ${YELLOW}./run.sh${NC}"
        echo ""
        echo -e "${BLUE}Estructura esperada:${NC}"
        echo "  /ruta/a/tu/proyecto/"
        echo "  ├── ai-core/          ← Clonado aquí"
        echo "  │   ├── run.sh        ← Ejecutas este script"
        echo "  │   ├── SKILLS/"
        echo "  │   └── SUBAGENTS/"
        echo "  ├── src/             ← Tu código"
        echo "  └── package.json"
        echo ""
        echo -e "${BLUE}ℹ️  ¿Por qué eliminar .git?${NC}"
        echo -e "${BLUE}   - Convierte ai-core en una copia estática (no un submodule)${NC}"
        echo -e "${BLUE}   - Las actualizaciones automáticas usan GitHub Actions, NO git pull${NC}"
        echo -e "${BLUE}   - El workflow receive-ai-core-updates.yml hace rsync desde GitHub${NC}"
        echo ""
        echo -e "${RED}❌ No se puede ejecutar run.sh dentro del repositorio ai-core original${NC}"
        echo -e "${RED}   porque ya estás en ai-core, no en un proyecto que lo usa.${NC}"
        echo ""
        exit 1
    fi
fi

# Obtener directorio padre
PROJECT_ROOT="$(dirname "$AI_CORE_DIR")"

echo -e "${BLUE}Detectando configuración...${NC}"
echo -e "  Directorio ai-core: ${CYAN}$AI_CORE_DIR${NC}"
echo -e "  Proyecto padre:    ${CYAN}$PROJECT_ROOT${NC}"
echo ""

# Confirmar con el usuario
echo -e "${YELLOW}Este script modificará el directorio:${NC}"
echo -e "  ${CYAN}$PROJECT_ROOT${NC}"
echo ""
echo -e "${YELLOW}Cambios que se realizarán:${NC}"
echo "  • Crear/actualizar AGENTS.md"
echo "  • Crear/actualizar CLAUDE.md"
echo "  • Crear/actualizar GEMINI.md"
echo "  • Crear directorios .claude/, .cursor/, .agent/, .codex/, .opencode/, .gemini/"
echo "  • Configurar symlinks a SKILLS/ y SUBAGENTS/ para cada herramienta"
echo "  • Crear .cursorrules para Cursor Editor"
echo "  • Configurar workflows de mantenimiento automático"
echo "  • Registrar proyecto en ai-core para recibir actualizaciones"
echo ""
read -p "¿Continuar? (y/N): " -r
echo ""

if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Instalación cancelada${NC}"
    exit 0
fi

# ============================================================================
# DETECTAR SISTEMA OPERATIVO Y MODO
# ============================================================================

USE_SYMLINKS=true

# Detectar Windows (Git Bash, MSYS, etc.)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
    echo -e "${YELLOW}⚠️  Detectado Windows: usando copia en lugar de symlinks${NC}"
    USE_SYMLINKS=false
fi

# Función para crear link o copiar
link_or_copy() {
    local source="$1"
    local target="$2"

    if [ "$USE_SYMLINKS" = true ]; then
        # Eliminar si existe
        [ -e "$target" ] && rm -rf "$target"
        ln -sf "$source" "$target"
    else
        # Copiar
        rm -rf "$target"
        cp -r "$source" "$target"
    fi
}

# ============================================================================
# COPIAR ARCHIVOS AL PROYECTO PADRE
# ============================================================================

echo -e "${BLUE}Instalando ai-core en $PROJECT_ROOT...${NC}"
echo ""

# Función para merge inteligente de archivos
# Si el archivo existe y no tiene header de ai-core, agrega header + contenido + footer
merge_ai_core_content() {
    local target_file="$1"
    local header_file="$2"
    local footer_file="$3"
    local template_file="$4"
    local file_name="$5"
    
    if [ ! -f "$target_file" ]; then
        # Archivo no existe: crear desde template completo
        cp "$template_file" "$target_file"
        echo -e "  ✓ ${GREEN}$file_name creado (desde plantilla)${NC}"
    elif grep -q "AI-CORE INTEGRATION" "$target_file" 2>/dev/null; then
        # Ya tiene integración de ai-core: no modificar
        echo -e "  ${YELLOW}⚠️  $file_name ya tiene ai-core integrado (sin cambios)${NC}"
    else
        # Archivo existe pero sin ai-core: hacer merge
        local temp_file=$(mktemp)
        cat "$header_file" > "$temp_file"
        cat "$target_file" >> "$temp_file"
        cat "$footer_file" >> "$temp_file"
        mv "$temp_file" "$target_file"
        echo -e "  ✓ ${GREEN}$file_name actualizado (header + contenido + footer)${NC}"
    fi
}

# 1. AGENTS.md
echo -e "${CYAN}[1/6]${NC} Configurando ${GREEN}AGENTS.md${NC}..."
merge_ai_core_content \
    "$PROJECT_ROOT/AGENTS.md" \
    "$AI_CORE_DIR/templates/partials/AGENTS.header.md" \
    "$AI_CORE_DIR/templates/partials/AGENTS.footer.md" \
    "$AI_CORE_DIR/templates/AGENTS.template.md" \
    "AGENTS.md"

# 2. CLAUDE.md
echo -e "${CYAN}[2/6]${NC} Configurando ${GREEN}CLAUDE.md${NC}..."
merge_ai_core_content \
    "$PROJECT_ROOT/CLAUDE.md" \
    "$AI_CORE_DIR/templates/partials/CLAUDE.header.md" \
    "$AI_CORE_DIR/templates/partials/CLAUDE.footer.md" \
    "$AI_CORE_DIR/templates/CLAUDE.template.md" \
    "CLAUDE.md"

# 3. GEMINI.md
echo -e "${CYAN}[3/6]${NC} Configurando ${GREEN}GEMINI.md${NC}..."
merge_ai_core_content \
    "$PROJECT_ROOT/GEMINI.md" \
    "$AI_CORE_DIR/templates/partials/GEMINI.header.md" \
    "$AI_CORE_DIR/templates/partials/GEMINI.footer.md" \
    "$AI_CORE_DIR/templates/GEMINI.template.md" \
    "GEMINI.md"

# 4. .github/copilot-instructions.md
echo -e "${CYAN}[4/6]${NC} Configurando ${GREEN}.github/copilot-instructions.md${NC}..."
mkdir -p "$PROJECT_ROOT/.github"
merge_ai_core_content \
    "$PROJECT_ROOT/.github/copilot-instructions.md" \
    "$AI_CORE_DIR/templates/partials/copilot.header.md" \
    "$AI_CORE_DIR/templates/partials/copilot.footer.md" \
    "$AI_CORE_DIR/templates/copilot-instructions.template.md" \
    "copilot-instructions.md"

# 5. .claude/skills (symlink)
echo -e "${CYAN}[5/20]${NC} Creando ${GREEN}.claude/skills → ai-core/SKILLS/${NC}..."
mkdir -p "$PROJECT_ROOT/.claude"
link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.claude/skills"
if [ "$USE_SYMLINKS" = true ]; then
    echo -e "  ✓ ${GREEN}Symlink creado${NC}"
else
    echo -e "  ✓ ${GREEN}Copia creada${NC}"
fi

# 6. .claude/agents (symlink)
echo -e "${CYAN}[6/20]${NC} Creando ${GREEN}.claude/agents → ai-core/SUBAGENTS/${NC}..."
link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.claude/agents"
if [ "$USE_SYMLINKS" = true ]; then
    echo -e "  ✓ ${GREEN}Symlink creado${NC}"
else
    echo -e "  ✓ ${GREEN}Copia creada${NC}"
fi

# ============================================================================
# INSTALACIÓN DE HERRAMIENTAS DE IA
# ============================================================================

echo ""
echo -e "${BLUE}Instalando soporte para herramientas de IA...${NC}"

# 7. .cursor/skills (Cursor Editor)
echo -e "${CYAN}[7/20]${NC} Creando ${GREEN}.cursor/skills → ai-core/SKILLS/${NC}..."
mkdir -p "$PROJECT_ROOT/.cursor"
link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.cursor/skills"
echo -e "  ✓ ${GREEN}.cursor/skills creado${NC}"

# 8. .cursorrules (Cursor Editor - solo si no existe)
echo -e "${CYAN}[8/20]${NC} Configurando ${GREEN}.cursorrules${NC}..."
if [ ! -f "$PROJECT_ROOT/.cursorrules" ]; then
    cp "$AI_CORE_DIR/templates/AGENTS.template.md" "$PROJECT_ROOT/.cursorrules"
    echo -e "  ✓ ${GREEN}.cursorrules creado (desde plantilla)${NC}"
else
    echo -e "  ${YELLOW}⚠️  .cursorrules ya existe (preservado)${NC}"
fi

# 9. .agent/skills (Antigravity)
echo -e "${CYAN}[9/20]${NC} Creando ${GREEN}.agent/skills → ai-core/SKILLS/${NC}..."
mkdir -p "$PROJECT_ROOT/.agent"
link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.agent/skills"
echo -e "  ✓ ${GREEN}.agent/skills creado${NC}"

# 10. .codex/skills (Codex)
echo -e "${CYAN}[10/20]${NC} Creando ${GREEN}.codex/skills → ai-core/SKILLS/${NC}..."
mkdir -p "$PROJECT_ROOT/.codex"
link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.codex/skills"
echo -e "  ✓ ${GREEN}.codex/skills creado${NC}"

# 11. .opencode/skills (OpenCode)
echo -e "${CYAN}[11/20]${NC} Creando ${GREEN}.opencode/skills → ai-core/SKILLS/${NC}..."
mkdir -p "$PROJECT_ROOT/.opencode"
link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.opencode/skills"
echo -e "  ✓ ${GREEN}.opencode/skills creado${NC}"

# 12. .gemini/skills (Gemini CLI)
echo -e "${CYAN}[12/20]${NC} Creando ${GREEN}.gemini/skills → ai-core/SKILLS/${NC}..."
if [ ! -d "$PROJECT_ROOT/.gemini" ]; then
    mkdir -p "$PROJECT_ROOT/.gemini"
    link_or_copy "$AI_CORE_DIR/SKILLS" "$PROJECT_ROOT/.gemini/skills"
    echo -e "  ✓ ${GREEN}.gemini/skills creado${NC}"
else
    echo -e "  ${YELLOW}⚠️  .gemini ya existe, omitiendo${NC}"
fi

# ============================================================================
# INSTALACIÓN DE SUBAGENTES PARA HERRAMIENTAS DE IA
# ============================================================================

echo ""
echo -e "${BLUE}Instalando subagentes para herramientas de IA...${NC}"

# 13. .cursor/agents (Cursor Editor)
echo -e "${CYAN}[13/20]${NC} Creando ${GREEN}.cursor/agents → ai-core/SUBAGENTS/${NC}..."
link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.cursor/agents"
echo -e "  ✓ ${GREEN}.cursor/agents creado${NC}"

# 14. .agent/agents (Antigravity)
echo -e "${CYAN}[14/20]${NC} Creando ${GREEN}.agent/agents → ai-core/SUBAGENTS/${NC}..."
link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.agent/agents"
echo -e "  ✓ ${GREEN}.agent/agents creado${NC}"

# 15. .codex/agents (Codex)
echo -e "${CYAN}[15/20]${NC} Creando ${GREEN}.codex/agents → ai-core/SUBAGENTS/${NC}..."
link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.codex/agents"
echo -e "  ✓ ${GREEN}.codex/agents creado${NC}"

# 16. .opencode/agents (OpenCode)
echo -e "${CYAN}[16/20]${NC} Creando ${GREEN}.opencode/agents → ai-core/SUBAGENTS/${NC}..."
link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.opencode/agents"
echo -e "  ✓ ${GREEN}.opencode/agents creado${NC}"

# 17. .gemini/agents (Gemini CLI)
echo -e "${CYAN}[17/20]${NC} Creando ${GREEN}.gemini/agents → ai-core/SUBAGENTS/${NC}..."
if [ ! -d "$PROJECT_ROOT/.gemini/agents" ]; then
    link_or_copy "$AI_CORE_DIR/SUBAGENTS" "$PROJECT_ROOT/.gemini/agents"
    echo -e "  ✓ ${GREEN}.gemini/agents creado${NC}"
else
    echo -e "  ${YELLOW}⚠️  .gemini/agents ya existe, omitiendo${NC}"
fi

# ============================================================================
# CONFIGURACIÓN DE MANTENIMIENTO AUTOMÁTICO
# ============================================================================

echo ""
echo -e "${BLUE}Configurando mantenimiento automático...${NC}"

# 18. Create .github/workflows directory
echo -e "${CYAN}[18/20]${NC} Creando directorio ${GREEN}.github/workflows/${NC}..."
mkdir -p "$PROJECT_ROOT/.github/workflows"
echo -e "  ✓ ${GREEN}Directorio creado${NC}"

# 19. Copy maintenance workflows
echo -e "${CYAN}[19/20]${NC} Copiando workflows de mantenimiento..."

# List of workflows to copy
WORKFLOWS=(
    "receive-ai-core-updates.yml"
    "check-dependencies.yml"
    "security-scanning.yml"
    "metrics.yml"
    "weekly-report.yml"
)

WORKFLOWS_COPIED=0
for workflow in "${WORKFLOWS[@]}"; do
    SOURCE_FILE="$AI_CORE_DIR/.github/workflows/$workflow"
    if [ -f "$SOURCE_FILE" ]; then
        cp "$SOURCE_FILE" "$PROJECT_ROOT/.github/workflows/"
        echo -e "  ✓ ${GREEN}$workflow${NC}"
        WORKFLOWS_COPIED=$((WORKFLOWS_COPIED + 1))
    fi
done

if [ $WORKFLOWS_COPIED -eq 0 ]; then
    echo -e "  ${YELLOW}⚠️  No se encontraron workflows de mantenimiento${NC}"
else
    echo -e "  ✓ ${GREEN}$WORKFLOWS_COPIED workflows copiados${NC}"
fi

# Registro del proyecto se maneja implícitamente por el workflow
# No es necesario modificar el script de instalación para esta función

# ============================================================================
# VERIFICACIÓN DE INSTALACIÓN
# ============================================================================

echo ""
echo -e "${BLUE}Verificando instalación...${NC}"
echo ""

# Función para verificar symlinks
verify_symlink() {
    local path="$1"
    local name="$2"
    local expected_items="$3"

    if [ -L "$path" ]; then
        target=$(readlink "$path")
        count=$(ls -1 "$path/" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} $name"
        echo -e "     → $target"
        echo -e "     → Contiene: $count $expected_items"
        return 0
    elif [ -d "$path" ]; then
        count=$(ls -1 "$path/" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} $name"
        echo -e "     → (copia local)"
        echo -e "     → Contiene: $count $expected_items"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name no existe"
        return 1
    fi
}

# Verificar symlinks principales
verify_symlink "$PROJECT_ROOT/.claude/skills" ".claude/skills" "skills"
verify_symlink "$PROJECT_ROOT/.claude/agents" ".claude/agents" "subagentes"
verify_symlink "$PROJECT_ROOT/.gemini/skills" ".gemini/skills" "skills"

# Verificar symlinks de habilidades de herramientas adicionales
verify_symlink "$PROJECT_ROOT/.cursor/skills" ".cursor/skills" "skills"
verify_symlink "$PROJECT_ROOT/.agent/skills" ".agent/skills" "skills"
verify_symlink "$PROJECT_ROOT/.codex/skills" ".codex/skills" "skills"
verify_symlink "$PROJECT_ROOT/.opencode/skills" ".opencode/skills" "skills"

# Verificar symlinks de subagentes de herramientas adicionales
verify_symlink "$PROJECT_ROOT/.cursor/agents" ".cursor/agents" "subagentes"
verify_symlink "$PROJECT_ROOT/.agent/agents" ".agent/agents" "subagentes"
verify_symlink "$PROJECT_ROOT/.codex/agents" ".codex/agents" "subagentes"
verify_symlink "$PROJECT_ROOT/.opencode/agents" ".opencode/agents" "subagentes"
verify_symlink "$PROJECT_ROOT/.gemini/agents" ".gemini/agents" "subagentes"

echo ""
echo -e "${BLUE}Verificando archivos de configuración...${NC}"
if [ -f "$PROJECT_ROOT/AGENTS.md" ]; then
    echo -e "  ${GREEN}✓${NC} AGENTS.md creado"
else
    echo -e "  ${RED}✗${NC} AGENTS.md no encontrado"
fi

if [ -f "$PROJECT_ROOT/CLAUDE.md" ]; then
    echo -e "  ${GREEN}✓${NC} CLAUDE.md creado"
else
    echo -e "  ${RED}✗${NC} CLAUDE.md no encontrado"
fi

if [ -f "$PROJECT_ROOT/GEMINI.md" ]; then
    echo -e "  ${GREEN}✓${NC} GEMINI.md creado"
else
    echo -e "  ${RED}✗${NC} GEMINI.md no encontrado"
fi

if [ -f "$PROJECT_ROOT/.cursorrules" ]; then
    echo -e "  ${GREEN}✓${NC} .cursorrules creado"
else
    echo -e "  ${RED}✗${NC} .cursorrules no encontrado"
fi

if [ -f "$PROJECT_ROOT/.github/copilot-instructions.md" ]; then
    echo -e "  ${GREEN}✓${NC} copilot-instructions.md creado"
else
    echo -e "  ${RED}✗${NC} copilot-instructions.md no encontrado"
fi

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ INSTALACIÓN COMPLETADA                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Estructura creada en ${CYAN}$PROJECT_ROOT${NC}:${NC}"
echo ""
echo "  $PROJECT_ROOT/"
echo "  ├── AGENTS.md              ← Guía universal (referencia a ai-core)"
echo "  ├── CLAUDE.md              ← Para Claude Code"
echo "  ├── GEMINI.md              ← Para Gemini CLI"
echo "  ├── .cursorrules           ← Para Cursor Editor"
echo "  ├── .claude/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .cursor/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .agent/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .codex/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .opencode/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .gemini/"
if [ "$USE_SYMLINKS" = true ]; then
    echo "  │   ├── skills → ai-core/SKILLS/"
    echo "  │   └── agents → ai-core/SUBAGENTS/"
else
    echo "  │   ├── skills/ (copia de ai-core/SKILLS)"
    echo "  │   └── agents/ (copia de ai-core/SUBAGENTS)"
fi
echo "  ├── .github/"
echo "  │   └── workflows/         ← Workflows de mantenimiento"
echo "  └── ai-core/"
echo "      ├── SKILLS/ (40 skills)"
echo "      └── SUBAGENTS/ (subagentes)"
echo ""

echo -e "${GREEN}✅ ai-core listo para usar${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Reinicia tu editor/LLM para cargar los nuevos archivos"
echo "  2. Los skills están disponibles en: ${CYAN}ai-core/SKILLS/${NC}"
echo "  3. Los agentes están en: ${CYAN}ai-core/SUBAGENTS/${NC}"
echo "  4. Los workflows de mantenimiento están en: ${CYAN}.github/workflows/${NC}"
echo ""
echo -e "${BLUE}Para verificar la instalación en cualquier momento:${NC}"
echo -e "  ${CYAN}cd ai-core && ./verify-symlinks.sh${NC}"
echo ""
echo -e "${BLUE}Mantenimiento automático activado:${NC}"
echo "  • Actualizaciones de dependencias"
echo "  • Escaneos de seguridad"
echo "  • Métricas y reportes semanales"
echo "  • Sincronización con ai-core (vía GitHub Actions)"
echo ""
echo -e "${CYAN}ℹ️  Las actualizaciones de ai-core llegan automáticamente:${NC}"
echo -e "     ${CYAN}• No necesitas hacer 'git pull' en ai-core/${NC}"
echo -e "     ${CYAN}• El workflow .github/workflows/receive-ai-core-updates.yml${NC}"
echo -e "     ${CYAN}• Se ejecuta cada lunes o manualmente desde Actions${NC}"
echo -e "     ${CYAN}• Crea un PR con los cambios cuando hay actualizaciones${NC}"
echo ""
echo -e "${BLUE}¡Listo para usar Claude, Gemini, Cursor, Antigravity, Codex y OpenCode!${NC}"
echo ""
echo -e "${CYAN}Herramientas de IA soportadas:${NC}"
echo "  • Claude Code (.claude/skills)"
echo "  • Gemini CLI (.gemini/skills)"
echo "  • Cursor Editor (.cursor/skills + .cursorrules)"
echo "  • Antigravity (.agent/skills)"
echo "  • Codex (.codex/skills)"
echo "  • OpenCode (.opencode/skills)"
echo ""
