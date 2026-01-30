#!/bin/bash
# Performance Tests - AI-Core Skills
# Run all performance tests and generate report

set -e

REPORT_DIR="tests/performance/results"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +%Y-%m-%d)
REPORT_FILE="$REPORT_DIR/$TIMESTAMP-performance-report.md"

echo "=========================================="
echo "  AI-Core Performance Tests"
echo "=========================================="
echo ""
echo "Started: $(date)"
echo ""

# Test 1: Individual Skill Load Performance
echo "### Test 1: Individual Skill Load Performance ###"
echo ""

TOTAL_TIME=0
COUNT=0
SLOW_SKILLS=""

for skill in SKILLS/*/SKILL.md; do
  START=$(date +%s%N)
  content=$(cat "$skill")
  lines=$(echo "$content" | wc -l)
  END=$(date +%s%N)
  DURATION=$(( (END - START) / 1000000 ))

  TOTAL_TIME=$((TOTAL_TIME + DURATION))
  COUNT=$((COUNT + 1))

  if [ $DURATION -gt 100 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${DURATION}ms (slow)"
    SLOW_SKILLS="$SLOW_SKILLS$(basename $(dirname $skill)): ${DURATION}ms\n"
  else
    echo "✅ $(basename $(dirname $skill)): ${DURATION}ms"
  fi
done

AVG_TIME=$((TOTAL_TIME / COUNT))
echo ""
echo "Average load time: ${AVG_TIME}ms"
echo "Total skills tested: $COUNT"
echo ""

# Test 2: Bulk Load Performance
echo "### Test 2: Bulk Load Performance ###"
echo ""

START=$(date +%s%N)
for skill in SKILLS/*/SKILL.md; do
  cat "$skill" > /dev/null
done
END=$(date +%s%N)
BULK_DURATION=$(( (END - START) / 1000000 ))
AVG_BULK=$((BULK_DURATION / 40))

echo "Total time to load 40 skills: ${BULK_DURATION}ms"
echo "Average per skill: ${AVG_BULK}ms"

if [ $BULK_DURATION -lt 1000 ]; then
  BULK_RESULT="✅ Excellent: < 1 second"
elif [ $BULK_DURATION -lt 2000 ]; then
  BULK_RESULT="✅ Good: < 2 seconds"
else
  BULK_RESULT="⚠️  Needs optimization: > 2 seconds"
fi
echo "$BULK_RESULT"
echo ""

# Test 3: File Size Analysis
echo "### Test 3: File Size Analysis ###"
echo ""

TOTAL_SIZE=0
COUNT=0
LARGE_FILES=""

for skill in SKILLS/*/SKILL.md; do
  SIZE=$(wc -c < "$skill")
  TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
  COUNT=$((COUNT + 1))

  SIZE_KB=$(awk "BEGIN {printf \"%.2f\", $SIZE/1024}")

  if [ $SIZE -gt 51200 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${SIZE_KB}KB (large file > 50KB)"
    LARGE_FILES="$LARGE_FILES$(basename $(dirname $skill)): ${SIZE_KB}KB\n"
  else
    echo "✅ $(basename $(dirname $skill)): ${SIZE_KB}KB"
  fi
done

AVG_SIZE=$((TOTAL_SIZE / COUNT))
AVG_KB=$(awk "BEGIN {printf \"%.2f\", $AVG_SIZE/1024}")

echo ""
echo "Total size: $((TOTAL_SIZE / 1024))KB"
echo "Average size: ${AVG_KB}KB"
echo ""

# Test 4: Line Count Efficiency
echo "### Test 4: Line Count Efficiency ###"
echo ""

TOTAL_LINES=0
COUNT=0
LONG_FILES=""

for skill in SKILLS/*/SKILL.md; do
  LINES=$(wc -l < "$skill")
  TOTAL_LINES=$((TOTAL_LINES + LINES))
  COUNT=$((COUNT + 1))

  if [ $LINES -gt 1000 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${LINES} lines (very long)"
    LONG_FILES="$LONG_FILES$(basename $(dirname $skill)): ${LINES} lines\n"
  elif [ $LINES -gt 700 ]; then
    echo "✅ $(basename $(dirname $skill)): ${LINES} lines (long but comprehensive)"
  else
    echo "✅ $(basename $(dirname $skill)): ${LINES} lines"
  fi
done

AVG_LINES=$((TOTAL_LINES / COUNT))
echo ""
echo "Total lines: $TOTAL_LINES"
echo "Average lines per skill: $AVG_LINES"
echo ""

# Test 5: Test Script Performance
echo "### Test 5: Test Script Performance ###"
echo ""

if [ -f "tests/validate-skills.sh" ]; then
  echo "Testing: tests/validate-skills.sh"
  START=$(date +%s%N)
  bash tests/validate-skills.sh > /dev/null 2>&1
  END=$(date +%s%N)
  VAL_DURATION=$(( (END - START) / 1000000 ))
  echo "Duration: ${VAL_DURATION}ms"
  echo ""
fi

# Generate Report
cat > "$REPORT_FILE" << EOF
# AI-Core Performance Test Report

**Date:** $(date +%Y-%m-%d)
**Time:** $(date +%H:%M:%S)
**System:** $(uname -s) $(uname -r)

---

## Test Results

### Test 1: Individual Skill Load Performance

- **Average load time:** ${AVG_TIME}ms
- **Total skills tested:** $COUNT
- **Status:** $([ $AVG_TIME -lt 50 ] && echo "✅ Excellent" || ([ $AVG_TIME -lt 100 ] && echo "✅ Good" || echo "⚠️  Needs review"))

$([ -n "$SLOW_SKILLS" ] && echo "#### Slow Skills:
$SLOW_SKILLS")

---

### Test 2: Bulk Load Performance

- **Total time to load 40 skills:** ${BULK_DURATION}ms
- **Average per skill:** ${AVG_BULK}ms
- **Status:** $BULK_RESULT

---

### Test 3: File Size Analysis

- **Total size:** $((TOTAL_SIZE / 1024))KB
- **Average size:** ${AVG_KB}KB
- **Status:** $([ $AVG_SIZE -lt 20480 ] && echo "✅ Excellent" || ([ $AVG_SIZE -lt 51200 ] && echo "✅ Good" || echo "⚠️  Needs review"))

$([ -n "$LARGE_FILES" ] && echo "#### Large Files (> 50KB):
$LARGE_FILES")

---

### Test 4: Line Count Efficiency

- **Total lines:** $TOTAL_LINES
- **Average lines per skill:** $AVG_LINES
- **Status:** $([ $AVG_LINES -lt 700 ] && echo "✅ Excellent" || ([ $AVG_LINES -lt 1000 ] && echo "✅ Good" || echo "⚠️  Needs review"))

$([ -n "$LONG_FILES" ] && echo "#### Long Files (> 1000 lines):
$LONG_FILES")

---

### Test 5: Test Script Performance

$([ -f "tests/validate-skills.sh" ] && echo "- **validate-skills.sh:** ${VAL_DURATION}ms")

---

## Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Individual skill load | ${AVG_TIME}ms | < 50ms | $([ $AVG_TIME -lt 50 ] && echo "✅ Pass" || "⚠️  Review") |
| Bulk load (40 skills) | ${BULK_DURATION}ms | < 1000ms | $([ $BULK_DURATION -lt 1000 ] && echo "✅ Pass" || "⚠️  Review") |
| Average file size | ${AVG_KB}KB | < 20KB | $([ $AVG_SIZE -lt 20480 ] && echo "✅ Pass" || "⚠️  Review") |
| Average line count | $AVG_LINES | < 700 | $([ $AVG_LINES -lt 700 ] && echo "✅ Pass" || "⚠️  Review") |

---

## Recommendations

$([ $AVG_TIME -gt 50 ] && echo "- Consider optimizing skill file structure for faster loading")
$([ $BULK_DURATION -gt 1000 ] && echo "- Consider implementing lazy loading for skills")
$([ $AVG_SIZE -gt 20480 ] && echo "- Some skills are large, consider splitting or compressing")
$([ $AVG_LINES -gt 700 ] && echo "- Some skills are verbose, consider condensing examples")

$([ $AVG_TIME -lt 50 ] && [ $BULK_DURATION -lt 1000 ] && [ $AVG_SIZE -lt 20480 ] && [ $AVG_LINES -lt 700 ] && echo "✅ All performance metrics within target ranges. No optimizations needed.")

---

**Generated by:** AI-Core Performance Test Suite
EOF

echo "=========================================="
echo "  Performance Tests Complete"
echo "=========================================="
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "Finished: $(date)"
