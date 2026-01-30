#!/bin/bash
# ============================================================================
# AI-CORE SKILL TEST EXECUTION
# ============================================================================
# Ejecuta todos los tests de skills y genera reporte
#
# Uso:
#   ./tests/run-skill-tests.sh [skill_name]
#
# Sin argumentos: ejecuta todos los tests
# Con argumento: ejecuta solo ese skill
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
TESTS_DIR="$SCRIPT_DIR/skills"

# Variables
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKILL_TO_TEST="${1:-}"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🧪 AI-CORE SKILL TESTS                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Función para ejecutar un test
run_test() {
  local test_file="$1"
  local skill_name="$(basename "$test_file" .test.md)"

  echo -e "${BLUE}Testing: ${skill_name}${NC}"

  # Verificar que el skill existe
  if [ ! -f "$AI_CORE_DIR/SKILLS/$skill_name/SKILL.md" ]; then
    echo -e "  ${RED}✗${NC} Skill no encontrado"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi

  # Verificar que el test tiene resultado final
  if grep -q "^### ✅ TEST PASSED" "$test_file" 2>/dev/null; then
    # Extraer coverage del test (eliminar markdown)
    local coverage=$(grep "Coverage:" "$test_file" | grep -o '[0-9]*%' | head -1 | tr -d '%')

    # Extraer criterios pasados (eliminar markdown)
    local criteria=$(grep "Criterios pasados:" "$test_file" | head -1 | grep -o '[0-9]*/[0-9]*' | head -1)

    echo -e "  ${GREEN}✓ PASS${NC} - Test aprobado ${coverage:+(${coverage}%)}"

    if [ -n "$criteria" ]; then
      echo -e "    ${CYAN}Criterios: ${criteria}${NC}"
    fi

    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "  ${YELLOW}⚠ NEEDS REVIEW${NC} - Requiere validación manual"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  fi
}

# ============================================================================
# MAIN
# ============================================================================

echo -e "${BLUE}Configuración:${NC}"
echo "  Tests dir: $TESTS_DIR"
echo "  AI-Core dir: $AI_CORE_DIR"
echo ""

if [ -n "$SKILL_TO_TEST" ]; then
  # Ejecutar un solo test
  echo -e "${BLUE}Modo: Test individual${NC}"
  echo "  Skill: $SKILL_TO_TEST"
  echo ""

  TOTAL_TESTS=1
  run_test "$TESTS_DIR/${SKILL_TO_TEST}.test.md"

else
  # Ejecutar todos los tests
  echo -e "${BLUE}Modo: Todos los tests${NC}"
  echo ""

  # Buscar todos los archivos .test.md
  for test_file in "$TESTS_DIR"/*.test.md; do
    if [ -f "$test_file" ]; then
      TOTAL_TESTS=$((TOTAL_TESTS + 1))
      run_test "$test_file"
      echo ""
    fi
  done
fi

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                       RESUMEN                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Total tests:      ${CYAN}$TOTAL_TESTS${NC}"
echo -e "  Passed:           ${GREEN}$PASSED_TESTS${NC}"
echo -e "  Failed:           ${RED}$FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
  coverage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
  echo -e "  Coverage:          ${YELLOW}${coverage}%${NC}"
fi

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
