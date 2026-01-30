# Performance Tests - AI-Core Skills

> Validate that all skills load efficiently and perform within acceptable limits

---

## Test Objectives

1. **Load Time Performance** - Skills should load quickly
2. **Script Performance** - Test scripts should run efficiently
3. **Memory Efficiency** - Skills should be memory-optimized
4. **Parse Time** - Markdown parsing should be fast

---

## Test 1: Individual Skill Load Performance

### Objective
Measure how long it takes to read and parse individual SKILL.md files.

### Test Script
```bash
#!/bin/bash
echo "=== Skill Load Performance Test ==="
echo ""

TOTAL_TIME=0
COUNT=0

for skill in SKILLS/*/SKILL.md; do
  START=$(date +%s%N)
  
  # Read and parse the skill file
  content=$(cat "$skill")
  lines=$(echo "$content" | wc -l)
  
  END=$(date +%s%N)
  DURATION=$(( (END - START) / 1000000 )) # Convert to milliseconds
  
  TOTAL_TIME=$((TOTAL_TIME + DURATION))
  COUNT=$((COUNT + 1))
  
  if [ $DURATION -gt 100 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${DURATION}ms (slow)"
  else
    echo "✅ $(basename $(dirname $skill)): ${DURATION}ms"
  fi
done

AVG_TIME=$((TOTAL_TIME / COUNT))
echo ""
echo "Average load time: ${AVG_TIME}ms"
echo "Total skills tested: $COUNT"
```

### Expected Results
- ✅ Individual skills: < 100ms per skill
- ✅ Average load time: < 50ms
- ⚠️  Warning threshold: 100ms

---

## Test 2: Bulk Load Performance

### Objective
Measure time to load all 40 skills at once.

### Test Script
```bash
#!/bin/bash
echo "=== Bulk Load Performance Test ==="
echo ""

START=$(date +%s%N)

# Load all skills
for skill in SKILLS/*/SKILL.md; do
  cat "$skill" > /dev/null
done

END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 )) # Convert to milliseconds

echo "Total time to load 40 skills: ${DURATION}ms"
AVG=$((DURATION / 40))

if [ $DURATION -lt 1000 ]; then
  echo "✅ Excellent: < 1 second"
elif [ $DURATION -lt 2000 ]; then
  echo "✅ Good: < 2 seconds"
else
  echo "⚠️  Needs optimization: > 2 seconds"
fi

echo "Average per skill: ${AVG}ms"
```

### Expected Results
- ✅ Excellent: < 1000ms (1 second)
- ✅ Good: < 2000ms (2 seconds)
- ⚠️  Needs optimization: > 2000ms

---

## Test 3: Test Script Performance

### Objective
Measure how long it takes to run validation scripts.

### Test Script
```bash
#!/bin/bash
echo "=== Test Script Performance ==="
echo ""

# Test 1: validate-skills.sh
echo "Testing: tests/validate-skills.sh"
START=$(date +%s%N)
bash tests/validate-skills.sh > /dev/null 2>&1
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "Duration: ${DURATION}ms"
echo ""

# Test 2: verify-symlinks.sh
echo "Testing: verify-symlinks.sh"
START=$(date +%s%N)
bash verify-symlinks.sh > /dev/null 2>&1
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "Duration: ${DURATION}ms"
echo ""

# Test 3: coverage-report.sh
echo "Testing: scripts/coverage-report.sh"
START=$(date +%s%N)
bash scripts/coverage-report.sh > /dev/null 2>&1
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
echo "Duration: ${DURATION}ms"
```

### Expected Results
- ✅ Individual scripts: < 5 seconds
- ✅ All validation: < 15 seconds total

---

## Test 4: File Size Optimization

### Objective
Ensure skill files are not bloated.

### Test Script
```bash
#!/bin/bash
echo "=== File Size Optimization Test ==="
echo ""

TOTAL_SIZE=0
COUNT=0

for skill in SKILLS/*/SKILL.md; do
  SIZE=$(wc -c < "$skill")
  TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
  COUNT=$((COUNT + 1))
  
  # Convert to KB
  SIZE_KB=$(echo "scale=2; $SIZE / 1024" | bc)
  
  if [ $SIZE -gt 51200 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${SIZE_KB}KB (large file > 50KB)"
  else
    echo "✅ $(basename $(dirname $skill)): ${SIZE_KB}KB"
  fi
done

AVG_SIZE=$((TOTAL_SIZE / COUNT))
AVG_KB=$(echo "scale=2; $AVG_SIZE / 1024" | bc)

echo ""
echo "Total size: $((TOTAL_SIZE / 1024))KB"
echo "Average size: ${AVG_KB}KB"
```

### Expected Results
- ✅ Individual skills: < 50KB
- ✅ Average size: < 20KB
- ⚠️  Warning threshold: 50KB

---

## Test 5: Line Count Efficiency

### Objective
Ensure skills are concise but comprehensive.

### Test Script
```bash
#!/bin/bash
echo "=== Line Count Efficiency Test ==="
echo ""

TOTAL_LINES=0
COUNT=0

for skill in SKILLS/*/SKILL.md; do
  LINES=$(wc -l < "$skill")
  TOTAL_LINES=$((TOTAL_LINES + LINES))
  COUNT=$((COUNT + 1))
  
  if [ $LINES -gt 1000 ]; then
    echo "⚠️  $(basename $(dirname $skill)): ${LINES} lines (very long)"
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
```

### Expected Results
- ✅ Ideal: 300-700 lines per skill
- ✅ Acceptable: < 1000 lines
- ⚠️  Review needed: > 1000 lines

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Needs Review |
|--------|--------|------------|-------------|
| Individual skill load | < 50ms | < 100ms | > 100ms |
| Bulk load (40 skills) | < 1s | < 2s | > 2s |
| Script execution | < 5s | < 10s | > 10s |
| File size | < 20KB | < 50KB | > 50KB |
| Line count | 300-700 | < 1000 | > 1000 |

---

## Running All Tests

```bash
# Run all performance tests
cd tests/performance
bash run-all-performance-tests.sh
```

---

## Results Documentation

After running tests, document results in:

```
tests/performance/results/YYYY-MM-DD-performance-report.md
```

Include:
- Timestamp
- System specs
- All test results
- Comparison with benchmarks
- Recommendations if needed

---
