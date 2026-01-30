#!/bin/bash
# Code Coverage Report Generator

echo "=== AI-Core Coverage Report ==="
echo ""

# Count skills with examples
EXAMPLES_COUNT=$(grep -l "## Examples" SKILLS/*/SKILL.md 2>/dev/null | wc -l)
TOTAL_SKILLS=$(ls -1 SKILLS/ | grep -v "^[.]" | wc -l)

echo "📊 Skills with Examples:"
echo "   $EXAMPLES_COUNT / $TOTAL_SKILLS"
echo ""

# Count ADRs
ADRS_COUNT=$(ls -1 docs/adr/*.md 2>/dev/null | wc -l)
echo "📚 ADRs Created:"
echo "   $ADRS_COUNT total"
echo ""

# Count test files
TEST_COUNT=$(find tests -name "*.test.md" 2>/dev/null | wc -l)
echo "🧪 Test Files:"
echo "   $TEST_COUNT files"
echo ""

# Technical debt items (excluding educational examples)
DEBT_COUNT=$(grep -r "FIXME\|TODO\|HACK\|XXX" SKILLS/ 2>/dev/null | grep -v "EXAMPLE:" | wc -l)
echo "🔧 Technical Debt Items:"
echo "   $DEBT_COUNT total"
echo ""

echo "=== Coverage Summary ==="
printf "%-20s %10s\n" "Category" "Total"
printf "%-20s %10s\n" "---------" "-----"
printf "%-20s %10s\n" "Skills" "$TOTAL_SKILLS"
printf "%-20s %10s\n" "Skills w/ Examples" "$EXAMPLES_COUNT"
printf "%-20s %10s\n" "ADRs" "$ADRS_COUNT"
printf "%-20s %10s\n" "Test Files" "$TEST_COUNT"
printf "%-20s %10s\n" "Tech Debt Items" "$DEBT_COUNT"
echo ""
