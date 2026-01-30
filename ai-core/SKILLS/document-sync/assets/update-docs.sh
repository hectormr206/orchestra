#!/bin/bash
# Script helper para document-sync
# Actualiza métricas de forma masiva

set -euo pipefail

# Default to ai-core directory
AI_CORE_PATH="${AI_CORE_PATH:-/home/hectormr/personalProjects/gama/ai-core}"
cd "$AI_CORE_PATH" 2>/dev/null || {
    echo "❌ Error: Cannot access $AI_CORE_PATH"
    exit 1
}

echo "🔍 Calculando métricas actuales de ai-core..."
echo ""

# Contar skills (excluyendo ocultos)
SKILLS_COUNT=$(ls -1 SKILLS/ 2>/dev/null | grep -v "^[.]" | wc -l | tr -d ' ' || echo "0")
echo "✅ Skills totales: $SKILLS_COUNT"

# Contar tests
TESTS_COUNT=$(ls -1 tests/skills/*.test.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Tests de skills: $TESTS_COUNT"

# Contar ADRs
ADRS_COUNT=$(ls -1 docs/adr/*.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ ADRs creadas: $ADRS_COUNT"

# Contar workflows
WORKFLOWS_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Workflows CI/CD: $WORKFLOWS_COUNT"

# Contar subagentes
SUBAGENTS_COUNT=$(ls -1 SUBAGENTS/universal/*.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Subagentes universales: $SUBAGENTS_COUNT"

# Contar patrones (si existen)
PATTERNS_COUNT=$(find SKILLS -name "patterns" -type d 2>/dev/null | wc -l | tr -d ' ' || echo "0")
echo "✅ Skills con patrones: $PATTERNS_COUNT"

# Calcular porcentaje de skills con tests
if [ "$SKILLS_COUNT" -gt 0 ]; then
    TEST_PERCENTAGE=$((TESTS_COUNT * 100 / SKILLS_COUNT))
else
    TEST_PERCENTAGE=0
fi

echo ""
echo "📊 Resumen de métricas:"
echo "═══════════════════════════════════════"
printf "  %-20s %5s\n" "Skills:" "$SKILLS_COUNT"
printf "  %-20s %5s\n" "Tests:" "$TESTS_COUNT ($TEST_PERCENTAGE%%)"
printf "  %-20s %5s\n" "ADRs:" "$ADRS_COUNT"
printf "  %-20s %5s\n" "Workflows:" "$WORKFLOWS_COUNT"
printf "  %-20s %5s\n" "Subagents:" "$SUBAGENTS_COUNT"
printf "  %-20s %5s\n" "Skills con patrones:" "$PATTERNS_COUNT"
echo "═══════════════════════════════════════"
echo ""
echo "💡 Usa estas métricas para actualizar:"
echo "   - README.md"
echo "   - NEXT_STEPS.md"
echo "   - CLAUDE.md"
echo ""

# Verificar si las métricas en los archivos coinciden
echo "🔍 Verificando consistencia..."

# Verificar README.md
if [ -f "README.md" ]; then
    README_SKILLS=$(grep -oP '\d+\+?\s+skills' README.md 2>/dev/null | grep -oP '\d+' | head -1 || echo "")
    if [ -n "$README_SKILLS" ]; then
        if [ "$README_SKILLS" != "$SKILLS_COUNT" ]; then
            echo "⚠️  README.md dice $README_SKILLS skills, pero son $SKILLS_COUNT"
        else
            echo "✅ README.md está actualizado ($SKILLS_COUNT skills)"
        fi
    fi
fi

# Verificar NEXT_STEPS.md
if [ -f "NEXT_STEPS.md" ]; then
    NEXT_STEPS_SKILLS=$(grep -oP 'Skills totales:.\s*\d+\+?' NEXT_STEPS.md 2>/dev/null | grep -oP '\d+' | head -1 || echo "")
    if [ -n "$NEXT_STEPS_SKILLS" ]; then
        if [ "$NEXT_STEPS_SKILLS" != "$SKILLS_COUNT" ]; then
            echo "⚠️  NEXT_STEPS.md dice $NEXT_STEPS_SKILLS skills, pero son $SKILLS_COUNT"
        else
            echo "✅ NEXT_STEPS.md está actualizado ($SKILLS_COUNT skills)"
        fi
    fi
fi

echo ""
echo "✨ Métricas calculadas exitosamente"
