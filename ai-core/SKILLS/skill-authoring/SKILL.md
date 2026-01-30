---
name: skill-authoring
description: >
  Best practices and standards for creating new AI-Core skills following the
  established format and structure. Includes templates, validation, and publication process.
  Trigger: Creating new skills, updating existing skills, reviewing skill quality.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Create skill", "new skill", "write skill", "add skill to ai-core"]
  tags: [authoring, documentation, standards, skills, ai-core]
---

## When to Use

- Creating a new skill for ai-core
- Updating or improving existing skills
- Reviewing skill quality and completeness
- Standardizing skill format across projects
- Onboarding contributors to ai-core skill authoring

## Critical Patterns

> **ALWAYS**:
- Use the YAML frontmatter format with ALL required fields
- Follow the template structure exactly
- Include code examples for every pattern
- Keep skills under 500 lines when possible
- Test skill instructions work with actual LLMs
- Use kebab-case for skill names
- Provide actionable, specific instructions
- Include tables and structured formats for LLM parsing
- Link to related skills

> **NEVER**:
- Create skills without YAML frontmatter
- Write vague or theoretical instructions
- Skip the "Example" sections
- Mix multiple unrelated topics in one skill
- Create skills that overlap significantly with existing ones
- Use inconsistent formatting or structure
- Skip testing the skill with real scenarios
- Forget to update AGENTS.md when adding skills

## SKILL.md Template (Complete)

```markdown
---
name: <kebab-case-name>
description: >
  <One-liner describing what the skill does and when to use it>.
  Be specific and action-oriented. Include trigger conditions.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]  # or [frontend], [backend], etc.
  auto_invoke: "<Action>" or ["<Action 1>", "<Action 2>"]
  tags: [tag1, tag2, tag3]
---

## When to Use

- Use case 1
- Use case 2
- Use case 3

## Critical Patterns

> **ALWAYS**:
- Rule 1
- Rule 2
- Rule 3

> **NEVER**:
- Anti-pattern 1
- Anti-pattern 2
- Anti-pattern 3

## Pattern Name 1

### When to Apply
- Condition 1
- Condition 2

### Implementation
\`\`\`language
// Code example
\`\`\`

### Common Pitfalls
- ❌ Bad: Example of wrong approach
- ✅ Good: Example of correct approach

## Pattern Name 2

[Same structure as above]

## Commands

\`\`\`bash
# Command to do X
command --flag

# Command to verify
verify-command
\`\`\`

## Related Skills

- **related-skill**: How it relates
- **another-related**: Additional context

## Checklist

When using this skill, ensure:
- [ ] Check 1
- [ ] Check 2
- [ ] Check 3
```

## Skill Creation Workflow

### Step 1: Plan the Skill

```bash
# Check if skill already exists
ls ai-core/SKILLS/ | grep <topic>

# Search for related skills
grep -r "keyword" ai-core/SKILLS/*/SKILL.md

# Identify gaps
# - What's not covered?
# - What needs improvement?
# - What's too broad and should be split?
```

### Step 2: Create Directory Structure

```bash
# Create skill directory
mkdir -p ai-core/SKILLS/<skill-name>

# Create main file
touch ai-core/SKILLS/<skill-name>/SKILL.md

# Optional: Add examples
mkdir -p ai-core/SKILLS/<skill-name>/examples
touch ai-core/SKILLS/<skill-name>/examples/example-1.md

# Optional: Add scripts
mkdir -p ai-core/SKILLS/<skill-name>/scripts
touch ai-core/SKILLS/<skill-name>/scripts/helper.sh
```

### Step 3: Write SKILL.md

```bash
# Use the template above
# Ensure ALL fields are present in YAML frontmatter:
# - name (required)
# - description (required)
# - license (recommended)
# - metadata.author, version, scope (recommended)
# - metadata.auto_invoke (recommended)
# - metadata.tags (recommended)
```

### Step 4: Validate Quality

```bash
# Check YAML syntax
cat ai-core/SKILLS/<skill-name>/SKILL.md | head -20 | yamllint

# Verify required fields
grep -E "^name:|^description:|^license:|^metadata:" ai-core/SKILLS/<skill-name>/SKILL.md

# Check line count
wc -l ai-core/SKILLS/<skill-name>/SKILL.md
# Should be < 500 lines for most skills

# Test with LLM
# - Can an LLM understand and follow the instructions?
# - Are examples clear and copy-pasteable?
# - Is the structure parseable?
```

### Step 5: Register in Documentation

```bash
# Add to AGENTS.md
# In the appropriate category section

# Add to CLAUDE.md (if critical)
# In the "Universal Skills" table

# Add to GEMINI.md (if applicable)
```

### Step 6: Test and Iterate

```bash
# Test in real scenario
# - Create a test case that requires this skill
# - Verify LLM invokes it correctly
# - Check if instructions produce expected results

# Gather feedback
# - Ask users to try the skill
# - Review actual usage
# - Identify confusion points

# Iterate
# - Refine based on feedback
# - Add missing examples
# - Clarify ambiguous instructions
```

## Validation Checklist

Before publishing a skill, verify:

### YAML Frontmatter
- [ ] `name` uses kebab-case
- [ ] `description` is < 100 chars, ends with "Trigger:"
- [ ] `license` is present (use Apache-2.0)
- [ ] `metadata.version` follows semver (e.g., "1.0")
- [ ] `metadata.author` is "ai-core" or your name
- [ ] `metadata.scope` is appropriate ([root] for universal)
- [ ] `metadata.auto_invoke` has 1-3 specific actions
- [ ] `metadata.tags` has 3-5 relevant tags

### Content Quality
- [ ] "When to Use" section present with 3+ scenarios
- [ ] "Critical Patterns" section with ALWAYS/NEVER rules
- [ ] Each pattern has:
  - When to apply
  - Code example
  - Common pitfalls (when applicable)
- [ ] "Commands" section with actual runnable commands
- [ ] "Related Skills" section linking to relevant skills
- [ ] Total length < 500 lines (unless complex topic)

### LLM-Friendly Formatting
- [ ] Uses **bold** for keywords
- [ ] Uses tables for structured data
- [ ] Code blocks have language specified
- [ ] Examples are complete and copy-pasteable
- [ ] Minimal prose, maximum actionable content
- [ ] Clear visual hierarchy with headers

### Completeness
- [ ] No TODO comments (quality checklist item)
- [ ] No placeholder text
- [ ] All examples tested
- [ ] No broken references
- [ ] Related skills exist and are linked

## Skill Categories

Use these categories to organize skills:

### Core Development (7)
- security, testing, frontend, backend, mobile, database, api-design

### DevOps & Infrastructure (5)
- git-workflow, ci-cd, infrastructure, disaster-recovery, finops

### Observability & Reliability (5)
- observability, logging, error-handling, performance, scalability

### Enterprise & Compliance (4)
- compliance, audit-logging, accessibility, i18n

### Architecture & Design (4)
- architecture, documentation, dependency-management, realtime

### AI & Data (2)
- ai-ml, data-analytics

### Developer Experience (3)
- code-quality, developer-experience, feature-flags

### AI-Core Development (2)
- skill-authoring, toolkit-maintenance

### Maintenance (3)
- dependency-updates, technical-debt, security-scanning

## Authoring Best Practices

### 1. Be Specific

❌ **Bad**: "Handle errors properly"
✅ **Good**: "Use try-catch with specific error types. Log errors with context. Never expose stack traces to users."

### 2. Provide Examples

❌ **Bad**: "Validate input"
✅ **Good**:
```javascript
// ❌ Bad: No validation
function processEmail(email) {
  return email.toLowerCase()
}

// ✅ Good: Proper validation
const { z } = require('zod')

const emailSchema = z.string().email()

function processEmail(email) {
  return emailSchema.parse(email).toLowerCase()
}
```

### 3. Use Structured Formats

❌ **Bad**: "Always do X, never do Y, sometimes do Z"
✅ **Good**:
| Rule | Action | When |
|------|--------|------|
| **ALWAYS** | Validate input | From external sources |
| **NEVER** | Trust client | Without verification |
| **SOMETIMES** | Cache results | When idempotent |

### 4. Link Related Concepts

```markdown
## Related Skills
- **security**: Input validation, XSS prevention
- **backend**: API error handling
- **logging**: Error logging patterns
```

## Anti-Patterns to Avoid

### 1. Too Broad
❌ **"javascript"** - Covers everything, too generic
✅ **"frontend"** or **"backend"** - More focused

### 2. Too Narrow
❌ **"react-button-component"** - Too specific
✅ **"frontend"** - Covers components broadly

### 3. Overlapping
❌ Creating "authentication" when "security" exists
✅ Add auth patterns to "security" skill instead

### 4. Theoretical Only
❌ **"software-design"** - Too academic
✅ **"architecture"** - Actionable patterns

## Testing Your Skill

### Manual Testing
```bash
# Create a test scenario
# 1. Start a new conversation
# 2. Request a task that should trigger this skill
# 3. Verify the LLM invokes it
# 4. Check if instructions are followed
# 5. Validate output quality

# Example test for "testing" skill:
# "Write unit tests for a function that validates email addresses"
# Expected: LLM should invoke testing skill and follow its patterns
```

### Automated Testing
```bash
# Validate YAML syntax
for skill in ai-core/SKILLS/*/SKILL.md; do
  echo "Checking $skill..."
  head -20 "$skill" | yamllint
done

# Check required fields
for skill in ai-core/SKILLS/*/SKILL.md; do
  if ! grep -q "^name:" "$skill"; then
    echo "❌ Missing 'name' in $skill"
  fi
  if ! grep -q "^description:" "$skill"; then
    echo "❌ Missing 'description' in $skill"
  fi
done

# Count lines
for skill in ai-core/SKILLS/*/SKILL.md; do
  LINES=$(wc -l < "$skill")
  if [ $LINES -gt 500 ]; then
    echo "⚠️  $skill is $LINES lines (consider splitting)"
  fi
done
```

## Commands

```bash
# Create new skill from template
mkdir -p ai-core/SKILLS/my-new-skill
cat > ai-core/SKILLS/my-new-skill/SKILL.md << 'EOF'
---
name: my-new-skill
description: >
  Short description of what this skill does.
  Trigger: when X action is needed.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Action that triggers this skill"]
  tags: [category1, category2, category3]
---

## When to Use

- Use case 1
- Use case 2

## Critical Patterns

> **ALWAYS**:
- Rule 1
- Rule 2

> **NEVER**:
- Anti-pattern 1
- Anti-pattern 2

## Commands

\`\`\`bash
# Example command
command --flag
\`\`\`

## Related Skills

- **related-skill**: Context
EOF

# Validate all skills
bash ai-core/tests/validate-skills.sh

# Test specific skill with LLM
echo "Test the skill in a real conversation"

# Check for duplicates
grep -r "name: duplicate-name" ai-core/SKILLS/*/SKILL.md
```

## Related Skills

- **documentation**: Documentation standards
- **toolkit-maintenance**: Maintaining ai-core itself
- **code-quality**: Quality standards
- **testing**: Testing your skills

## Publication Checklist

When publishing a new skill:
- [ ] YAML frontmatter complete and valid
- [ ] All sections present (When to Use, Critical Patterns, Commands, Related Skills)
- [ ] Code examples tested and working
- [ ] Length < 500 lines
- [ ] No TODO/FIXME comments (quality checklist item)
- [ ] Registered in AGENTS.md
- [ ] Added to CLAUDE.md (if critical)
- [ ] Tested with actual LLM
- [ ] Peer reviewed (if possible)
- [ ] Documentation updated

---

## Examples

### Example 1: Creating a New Skill

**User request:** "Create a skill for caching patterns"

**Step 1: Create directory structure**
```bash
mkdir -p SKILLS/caching/patterns
```

**Step 2: Create SKILL.md**
```markdown
---
name: caching
description: >
  Caching strategies: Redis, Memcached, CDN, browser caching,
  cache invalidation, stale-while-revalidate.
license: Apache-2.0
metadata:
  version: "1.0"
---

## When to Use
- Implementing caching layers
- Designing cache invalidation strategies
- Optimizing performance with caching
```

**Step 3: Add patterns**
```bash
# Create pattern files
touch SKILLS/caching/patterns/redis-caching.md
touch SKILLS/caching/patterns/cache-invalidation.md
```
