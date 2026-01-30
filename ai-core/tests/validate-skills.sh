#!/bin/bash
# ============================================================================
# AI-CORE SKILL VALIDATION SCRIPT
# ============================================================================
# Valida todos los skills de ai-core contra criterios de calidad
#
# Uso:
#   ./tests/validate-skills.sh              # Validar todos
#   ./tests/validate-skills.sh security    # Validar uno
#   ./tests/validate-skills.sh --report    # Generar reporte
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_CORE_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$AI_CORE_DIR/SKILLS"
REPORT_DIR="$SCRIPT_DIR/reports"

# Crear directorio de reportes
mkdir -p "$REPORT_DIR"

# Variables
TOTAL_SKILLS=0
VALIDATED_SKILLS=0
FAILED_SKILLS=0
FAILED_DETAILS=()
SKILL_TO_VALIDATE=""

# Parse argumentos
if [ "$1" = "--report" ]; then
  GENERATE_REPORT=true
else
  GENERATE_REPORT=false
  if [ -n "$1" ] && [ "$1" != "--report" ]; then
    SKILL_TO_VALIDATE="$1"
  fi
fi

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           AI-CORE SKILL VALIDATION                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Función para validar un skill
validate_skill() {
  local skill_path="$1"
  local skill_name="$(basename "$skill_path")"
  local skill_file="$skill_path/SKILL.md"

  echo -e "${BLUE}Validando: ${skill_name}${NC}"

  local errors=0
  local warnings=0

  # Verificar que existe SKILL.md
  if [ ! -f "$skill_file" ]; then
    echo -e "  ${RED}✗${NC} No existe SKILL.md"
    ((errors++))
    return 1
  fi

  # Leer contenido
  local content
  content=$(cat "$skill_file")
  local lines=$(wc -l < "$skill_file")

  # 1. Validar metadata
  echo -e "  ${CYAN}Validando metadata...${NC}"

  if ! echo "$content" | grep -q "^name:"; then
    echo -e "    ${RED}✗${NC} Falta 'name'"
    ((errors++))
  else
    echo -e "    ${GREEN}✓${NC} name: $(echo "$content" | grep "^name:" | head -1)"
  fi

  if ! echo "$content" | grep -q "^description:"; then
    echo -e "    ${RED}✗${NC} Falta 'description'"
    ((errors++))
  else
    local desc=$(echo "$content" | grep "^description:" | head -1 | sed 's/^description: //' | sed 's/^ *//')
    local desc_len=${#desc}
    if [ $desc_len -lt 50 ]; then
      echo -e "    ${YELLOW}⚠${NC} description muy corta (${desc_len} < 50)"
      ((warnings++))
    else
      echo -e "    ${GREEN}✓${NC} description (${desc_len} chars)"
    fi
  fi

  if ! echo "$content" | grep -q "^license:"; then
    echo -e "    ${YELLOW}⚠${NC} Falta 'license'"
    ((warnings++))
  else
    echo -e "    ${GREEN}✓${NC} license: $(echo "$content" | grep "^license:" | head -1 | cut -d: -f2-)"
  fi

  if ! echo "$content" | grep -q "^version:"; then
    echo -e "    ${YELLOW}⚠${NC} Falta 'version'"
    ((warnings++))
  else
    echo -e "    ${GREEN}✓${NC} version: $(echo "$content" | grep "^version:" | head -1 | cut -d: -f2-)"
  fi

  # 2. Validar secciones requeridas
  echo -e "  ${CYAN}Validando secciones...${NC}"

  local required_sections=("## When to Use" "## Commands" "## Related Skills")
  for section in "${required_sections[@]}"; do
    if ! echo "$content" | grep -q "^$section"; then
      echo -e "    ${RED}✗${NC} Falta sección: $section"
      ((errors++))
    else
      echo -e "    ${GREEN}✓${NC} $section"
    fi
  done

  # 3. Validar calidad
  echo -e "  ${CYAN}Validando calidad...${NC}"

  if [ $lines -lt 200 ]; then
    echo -e "    ${YELLOW}⚠${NC} Muy corto (${lines} < 200 líneas)"
    ((warnings++))
  else
    echo -e "    ${GREEN}✓${NC} Longitud adecuada (${lines} líneas)"
  fi

  # Verificar secciones vacías
  local empty_sections=$(echo "$content" | grep -E "^##[^#]" -A 5 | grep -E "^[^#]" | wc -l)
  if [ $empty_sections -lt 10 ]; then
    echo -e "    ${YELLOW}⚠${NC} Posibles secciones vacías"
    ((warnings++))
  fi

  # 4. Validar formato
  echo -e "  ${CYAN}Validando formato...${NC}"

  # Verificar jerarquía de headers
  if echo "$content" | grep "^####[^#]" | grep -B1 "^#[^#]" | grep -q "^[^#]"; then
    echo -e "    ${RED}✗${NC} Salto de nivel en headers (## -> ####)"
    ((errors++))
  else
    echo -e "    ${GREEN}✓${NC} Headers jerárquicos correctos"
  fi

  # Resumen
  if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASS${NC} - Sin errores ni advertencias"
    ((VALIDATED_SKILLS++))
    return 0
  elif [ $errors -eq 0 ]; then
    echo -e "  ${YELLOW}⚠ PASS${NC} - Con $warnings advertencia(s)"
    ((VALIDATED_SKILLS++))
    return 0
  else
    echo -e "  ${RED}✗ FAIL${NC} - $errors error(es), $warnings advertencia(s)"
    ((FAILED_SKILLS++))
    FAILED_DETAILS+=("$skill_name: $errors errores, $warnings advertencias")
    return 1
  fi
}

# ============================================================================
# MAIN
# ============================================================================

echo -e "${BLUE}Configuración:${NC}"
echo "  AI-Core dir: $AI_CORE_DIR"
echo "  Skills dir: $SKILLS_DIR"
echo ""

if [ -n "$SKILL_TO_VALIDATE" ]; then
  # Validar un solo skill
  echo -e "${BLUE}Modo: Validar skill específico${NC}"
  echo "  Skill: $SKILL_TO_VALIDATE"
  echo ""

  TOTAL_SKILLS=1
  validate_skill "$SKILLS_DIR/$SKILL_TO_VALIDATE"

else
  # Validar todos los skills
  echo -e "${BLUE}Modo: Validar todos los skills${NC}"
  echo ""

  for skill_dir in "$SKILLS_DIR"/*; do
    if [ -d "$skill_dir" ]; then
      ((TOTAL_SKILLS++))
      validate_skill "$skill_dir"
      echo ""
    fi
  done
fi

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      RESUMEN                                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Total skills:      ${CYAN}$TOTAL_SKILLS${NC}"
echo -e "  Validados:         ${GREEN}$VALIDATED_SKILLS${NC}"
echo -e "  Fallidos:          ${RED}$FAILED_SKILLS${NC}"

if [ $TOTAL_SKILLS -gt 0 ]; then
  local coverage=$((VALIDATED_SKILLS * 100 / TOTAL_SKILLS))
  echo -e "  Coverage:          ${YELLOW}${coverage}%${NC}"
fi

echo ""

if [ $FAILED_SKILLS -gt 0 ]; then
  echo -e "${RED}Skills fallidos:${NC}"
  for detail in "${FAILED_DETAILS[@]}"; do
    echo -e "  ${RED}✗${NC} $detail"
  done
  echo ""
fi

# Generar reporte si se solicitó
if [ "$GENERATE_REPORT" = true ]; then
  local report_file="$REPORT_DIR/validation-report-$(date +%Y%m%d).md"

  cat > "$report_file" << REPORT
# AI-Core Validation Report

**Date:** $(date +%Y-%m-%d)
**Validated by:** ai-core/test-framework

## Summary

| Metric | Value |
|--------|-------|
| Total skills | $TOTAL_SKILLS |
| Validated | $VALIDATED_SKILLS |
| Failed | $FAILED_SKILLS |
| Coverage | $((VALIDATED_SKILLS * 100 / TOTAL_SKILLS))% |

## Failed Skills

REPORT

  if [ $FAILED_SKILLS -gt 0 ]; then
    for detail in "${FAILED_DETAILS[@]}"; do
      echo "- ❌ $detail" >> "$report_file"
    done
  else
    echo "None" >> "$report_file"
  fi

  echo "" >> "$report_file"
  echo "---" >> "$report_file"
  echo "" >> "$report_file"
  echo "**Generated by:** ai-core/tests/validate-skills.sh" >> "$report_file"

  echo -e "${GREEN}Reporte generado: ${report_file}${NC}"
fi

# Exit code
if [ $FAILED_SKILLS -gt 0 ]; then
  exit 1
else
  echo -e "${GREEN}✅ All validations passed!${NC}"
  exit 0
fi
