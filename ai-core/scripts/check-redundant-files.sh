#!/bin/bash
# Script: check-redundant-files.sh
# Busca archivos .md potencialmente redundantes en el proyecto

set -euo pipefail

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Checking for Potentially Redundant .md Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Patrones prohibidos
FORBIDDEN_PATTERNS=(
    "PROGRESS-"
    "_REPORT"
    "ACHIEVEMENT"
    "TASKS-"
    "PROPOSAL-"
    "_FINAL"
)

# Archivos permitidos (excepciones)
ALLOWED_FILES=(
    "DEBT-TRACKING.md"
    "MAINTENANCE_PLAN.md"
)

FOUND=0

echo -e "${YELLOW}Checking root directory:${NC}"

# Check if there are any .md files
if ls *.md 1> /dev/null 2>&1; then
    for file in *.md; do
        # Skip si está en permitidos
        if [[ " ${ALLOWED_FILES[@]} " =~ " ${file} " ]]; then
            continue
        fi

        # Verificar patrones
        for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
            if echo "$file" | grep -q "$pattern"; then
                echo -e "  ${RED}⚠️  $file${NC} (contains: $pattern)"
                FOUND=1
            fi
        done
    done
fi

echo ""
echo -e "${YELLOW}Checking total .md files in root:${NC}"

# Count .md files safely
if ls *.md 1> /dev/null 2>&1; then
    MD_COUNT=$(ls -1 *.md | wc -l)
    echo "  Total: $MD_COUNT files"

    if [ $MD_COUNT -gt 15 ]; then
        echo -e "  ${RED}⚠️  Consider consolidating files (>15 is too many)${NC}"
    fi
else
    echo "  Total: 0 files"
fi

if [ $MD_COUNT -gt 15 ]; then
    echo -e "  ${RED}⚠️  Consider consolidating files (>15 is too many)${NC}"
fi

echo ""
echo -e "${YELLOW}Checking for obsolete files (>6 months old):${NC}"
SIX_MONTHS_AGO=$(date -d "6 months ago" +%s 2>/dev/null || date -v-6m +%s)
find . -maxdepth 1 -name "*.md" -type f -not -name "CHANGELOG.md" -not -name "README.md" 2>/dev/null | while read -r file; do
    if [ "$(uname)" = "Darwin" ]; then
        FILE_TIME=$(stat -f %m "$file")
    else
        FILE_TIME=$(stat -c %Y "$file")
    fi

    if [ "$FILE_TIME" -lt "$SIX_MONTHS_AGO" ]; then
        echo -e "  ${YELLOW}⚠️  $file${NC} (not modified in >6 months)"
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No redundant files found!${NC}"
else
    echo -e "${YELLOW}⚠️  Found potentially redundant files${NC}"
    echo ""
    echo "💡 Recommendations:"
    echo "   - Consolidate into CHANGELOG.md (for progress/achievements)"
    echo "   - Consolidate into TUTORIAL.md (for guides)"
    echo "   - Consolidate into ARCHITECTURE.md (for design)"
    echo "   - Use ADRs in docs/adr/ (for proposals)"
    echo ""
    echo "📖 See: LLM-FILE-CREATION-GUIDELINES.md"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit 0
