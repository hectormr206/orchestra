# LLM Compatibility Validation - AI-Core Skills

> Validate that all 40 skills are compatible with real LLMs (Claude, Gemini, GPT-4)

---

## Test Objectives

1. **Syntax Validation** - Skills parse correctly as markdown
2. **Structure Validation** - All required sections present
3. **Content Readability** - LLMs can understand and apply patterns
4. **Pattern Consistency** - ALWAYS/NEVER rules are clear
5. **Example Quality** - Examples are parseable by LLMs

---

## Test 1: Markdown Syntax Validation

### Objective
Ensure all SKILL.md files are valid markdown.

### Test
```bash
#!/bin/bash
echo "=== Markdown Syntax Validation ==="
echo ""

ERRORS=0

for skill in SKILLS/*/SKILL.md; do
  # Check for common markdown errors
  if grep -q "^#\s*$" "$skill"; then
    echo "⚠️  $(basename $(dirname $skill)): Empty heading"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for malformed code blocks
  if grep -q '```$' "$skill"; then
    if ! grep -q '^```[a-z]*' "$skill"; then
      echo "⚠️  $(basename $(dirname $skill)): Malformed code block"
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # Check for broken links
  if grep -q '\[.*\](\s*$' "$skill"; then
    echo "⚠️  $(basename $(dirname $skill)): Empty link"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "✅ All markdown files are valid"
else
  echo "❌ Found $ERRORS markdown errors"
fi
```

---

## Test 2: Required Sections Validation

### Objective
Ensure all skills have required sections for LLM understanding.

### Test
```bash
#!/bin/bash
echo "=== Required Sections Validation ==="
echo ""

ERRORS=0

for skill in SKILLS/*/SKILL.md; do
  SKILL_NAME=$(basename $(dirname $skill))

  # Check for required sections
  if ! grep -q "^## " "$skill"; then
    echo "❌ $SKILL_NAME: Missing level-2 headings"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for Examples section
  if ! grep -q "^## Examples" "$skill"; then
    echo "⚠️  $SKILL_NAME: Missing Examples section (recommended)"
  fi

  # Check for ALWAYS/NEVER rules
  if ! grep -q "ALWAYS" "$skill"; then
    echo "⚠️  $SKILL_NAME: No ALWAYS rules found"
  fi

  if ! grep -q "NEVER" "$skill"; then
    echo "⚠️  $SKILL_NAME: No NEVER rules found"
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "✅ All skills have required sections"
else
  echo "❌ Found $ERRORS missing sections"
fi
```

---

## Test 3: Pattern Clarity Validation

### Objective
Ensure ALWAYS/NEVER patterns are clear for LLMs to follow.

### Test
```bash
#!/bin/bash
echo "=== Pattern Clarity Validation ==="
echo ""

ERRORS=0

for skill in SKILLS/*/SKILL.md; do
  SKILL_NAME=$(basename $(dirname $skill))

  # Check for ALWAYS rules
  ALWAYS_COUNT=$(grep -c "ALWAYS:" "$skill" || echo "0")
  NEVER_COUNT=$(grep -c "NEVER:" "$skill" || echo "0")

  if [ $ALWAYS_COUNT -eq 0 ] && [ $NEVER_COUNT -eq 0 ]; then
    echo "⚠️  $SKILL_NAME: No clear patterns (ALWAYS:/NEVER:)"
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ $SKILL_NAME: $ALWAYS_COUNT ALWAYS, $NEVER_COUNT NEVER"
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All skills have clear patterns"
else
  echo "⚠️  $ERRORS skills need clearer patterns"
fi
```

---

## Test 4: LLM Readability Score

### Objective
Estimate how easily LLMs can parse and understand each skill.

### Test
```bash
#!/bin/bash
echo "=== LLM Readability Score ==="
echo ""

for skill in SKILLS/*/SKILL.md; do
  SKILL_NAME=$(basename $(dirname $skill))

  # Count key readability factors
  HEADINGS=$(grep -c "^#" "$skill" || echo "0")
  CODE_BLOCKS=$(grep -c '^```' "$skill" || echo "0")
  LISTS=$(grep -c "^* \|^* \|^-" "$skill" || echo "0")
  TABLES=$(grep -c "^|" "$skill" || echo "0")

  # Calculate readability score (0-100)
  SCORE=0

  # Good structure (10-30 headings)
  if [ $HEADINGS -ge 10 ] && [ $HEADINGS -le 50 ]; then
    SCORE=$((SCORE + 25))
  fi

  # Examples present (2+ code blocks)
  if [ $CODE_BLOCKS -ge 4 ]; then
    SCORE=$((SCORE + 25))
  fi

  # Lists for clarity (20+ list items)
  if [ $LISTS -ge 20 ]; then
    SCORE=$((SCORE + 25))
  fi

  # Tables for quick reference (1+ tables)
  if [ $TABLES -ge 1 ]; then
    SCORE=$((SCORE + 25))
  fi

  if [ $SCORE -eq 100 ]; then
    echo "✅ $SKILL_NAME: ${SCORE}/100 (Excellent)"
  elif [ $SCORE -ge 75 ]; then
    echo "✅ $SKILL_NAME: ${SCORE}/100 (Good)"
  elif [ $SCORE -ge 50 ]; then
    echo "⚠️  $SKILL_NAME: ${SCORE}/100 (Acceptable)"
  else
    echo "❌ $SKILL_NAME: ${SCORE}/100 (Needs improvement)"
  fi
done
```

---

## Test 5: Real LLM Compatibility Test

### Objective
Test that skills work with actual LLM APIs.

### Claude Test
```python
import anthropic

client = anthropic.Anthropic()

# Test a few skills
test_skills = ["security", "backend", "testing"]

for skill in test_skills:
    with open(f"SKILLS/{skill}/SKILL.md", "r") as f:
        skill_content = f.read()

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Read this skill file and summarize the key ALWAYS/NEVER rules:

{skill_content}

Provide a concise summary of the rules."""
            }
        ]
    )

    print(f"\n{skill.upper()}:")
    print(message.content[0].text)
    print("✅ Compatible")
```

### Gemini Test
```python
import google.generativeai as genai

genai.configure(api_key='your-api-key')
model = genai.GenerativeModel('gemini-pro')

for skill in test_skills:
    with open(f"SKILLS/{skill}/SKILL.md", "r") as f:
        skill_content = f.read()

    prompt = f"""Read this skill file and summarize the key ALWAYS/NEVER rules:

{skill_content}

Provide a concise summary of the rules."""

    response = model.generate_content(prompt)
    print(f"\n{skill.upper()}:")
    print(response.text)
    print("✅ Compatible")
```

---

## Compatibility Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Needs Review |
|--------|--------|------------|-------------|
| Markdown syntax errors | 0 | < 3 | > 3 |
| Missing sections | 0 | < 2 | > 2 |
| Pattern clarity (ALWAYS/NEVER) | > 5 each | > 2 each | < 2 each |
| LLM readability score | > 90 | > 75 | < 75 |
| Real LLM test success | 100% | > 90% | < 90% |

---

## Running All Tests

```bash
# Run all LLM compatibility tests
cd tests/llm-compatibility
bash run-all-llm-tests.sh
```

---

## Expected Results

### ✅ Pass Criteria
- All 40 skills parse correctly
- All required sections present
- Clear ALWAYS/NEVER patterns
- Readability score > 75
- Real LLM tests pass

### ⚠️  Review Criteria
- Minor syntax errors that don't affect parsing
- Missing optional sections (Examples, etc.)
- Some patterns could be clearer
- Readability score 50-75

### ❌ Fail Criteria
- Major syntax errors blocking parsing
- Missing critical sections
- Unclear or missing patterns
- Readability score < 50
- Real LLM tests fail

---

## Results Documentation

After running tests, document results in:

```
tests/llm-compatibility/results/YYYY-MM-DD-llm-compatibility-report.md
```

Include:
- Timestamp
- LLM versions tested
- All test results
- Compatibility issues found
- Recommendations if needed

---

**Purpose:** Ensure AI-Core skills work seamlessly with Claude, Gemini, GPT-4, and other leading LLMs.
