#!/bin/bash
# ============================================================================
# VERIFICACIÓN DE SYMLINKS DE AI-CORE
# ============================================================================
# Este script verifica que los symlinks de ai-core estén funcionando
# correctamente, tanto en desarrollo (en ai-core) como en instalación
# (en proyectos que usan ai-core).
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Detectar directorio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        VERIFICACIÓN DE SYMLINKS EN AI-CORE                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Función para verificar symlink o directorio
verify_path() {
    local path="$1"
    local name="$2"
    local expected_type="$3"  # 'skills', 'agents', etc.

    if [ -L "$path" ]; then
        target=$(readlink "$path")
        if [ -d "$path" ]; then
            count=$(ls -1 "$path/" 2>/dev/null | wc -l)
            echo -e "  ${GREEN}✓${NC} $name"
            echo -e "     Symlink: ${CYAN}$target${NC}"
            echo -e "     Contiene: ${GREEN}$count${NC} $expected_type"
            return 0
        else
            echo -e "  ${RED}✗${NC} $name - symlink roto"
            echo -e "     Apunta a: $target (no existe)"
            return 1
        fi
    elif [ -d "$path" ]; then
        count=$(ls -1 "$path/" 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✓${NC} $name"
        echo -e "     Tipo: ${YELLOW}Copia local${NC} (no symlink)"
        echo -e "     Contiene: ${GREEN}$count${NC} $expected_type"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name - no existe"
        return 1
    fi
}

# Verificar symlinks para Claude Code
echo -e "${BLUE}Symlinks para Claude Code:${NC}"
verify_path ".claude/skills" ".claude/skills" "skills" || true
verify_path ".claude/agents" ".claude/agents" "subagentes" || true
echo ""

# Verificar symlinks para Gemini
echo -e "${BLUE}Symlinks para Gemini:${NC}"
verify_path ".gemini/skills" ".gemini/skills" "skills" || true
echo ""

# Verificar carpetas visibles (si existen)
echo -e "${BLUE}Carpetas visibles (acceso de usuario):${NC}"
verify_path "claude/skills" "claude/skills" "skills" || true
verify_path "claude/agents" "claude/agents" "subagentes" || true
verify_path "gemini/skills" "gemini/skills" "skills" || true
echo ""

# Verificar acceso a skills específicos
echo -e "${BLUE}Verificación de acceso a skills:${NC}"
if [ -f ".claude/skills/security/SKILL.md" ] || [ -f "SKILLS/security/SKILL.md" ]; then
    echo -e "  ${GREEN}✓${NC} Skill 'security' accesible"
else
    echo -e "  ${RED}✗${NC} Skill 'security' no accesible"
fi

if [ -f ".claude/skills/testing/SKILL.md" ] || [ -f "SKILLS/testing/SKILL.md" ]; then
    echo -e "  ${GREEN}✓${NC} Skill 'testing' accesible"
else
    echo -e "  ${RED}✗${NC} Skill 'testing' no accesible"
fi
echo ""

# Resumen
echo -e "${CYAN}Resumen:${NC}"
total_skills=$(ls -1 SKILLS/ 2>/dev/null | wc -l)
total_agents=$(ls -1 SUBAGENTS/ 2>/dev/null | wc -l)
echo -e "  • Total de skills en ai-core: ${GREEN}$total_skills${NC}"
echo -e "  • Total de subagentes en ai-core: ${GREEN}$total_agents${NC}"
echo ""

# Verificar que Claude Code pueda leer
echo -e "${BLUE}Estado para Claude Code:${NC}"
if [ -d ".claude/skills" ] || [ -d "claude/skills" ]; then
    echo -e "  ${GREEN}✓${NC} Claude Code puede leer los skills"
    echo -e "     ${CYAN}Los skills están activos y disponibles${NC}"
else
    echo -e "  ${YELLOW}⚠${NC}  Claude Code podría no encontrar los skills"
    echo -e "     ${YELLOW}Verifica que .claude/skills o claude/skills existan${NC}"
fi
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ VERIFICACIÓN COMPLETADA                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
