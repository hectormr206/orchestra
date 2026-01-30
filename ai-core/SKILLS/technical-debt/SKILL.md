---
name: technical-debt
description: >
  Technical debt tracking, measurement, and resolution strategies.
  Includes debt scoring, prioritization matrix, tracking systems, and reduction techniques.
  Trigger: Technical debt tasks, code quality issues, refactoring.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["Technical debt", "refactor", "code quality", "clean up code", "FIXME", "TODO"]
  tags: [technical-debt, code-quality, refactoring, maintenance, metrics]
---

## When to Use

- Tracking and measuring technical debt
- Planning refactoring efforts
- Prioritizing debt repayment
- Establishing debt reduction strategies
- Monitoring code quality metrics

## Critical Patterns

> **ALWAYS**:
- Quantify debt with objective metrics
- Prioritize by impact, not just age
- Link debt items to business value
- Track debt repayment progress
- Document decisions creating debt
- Allocate regular time for debt reduction
- Review debt metrics monthly
- Involve team in prioritization

> **NEVER**:
- Ignore accumulated debt
- Create debt without documenting it
- Prioritize new features over critical debt
- Skip tests when paying down debt
- Refactor without understanding why code exists
- Delete "temp" code without verification
- Blend features and refactoring in one PR

## Technical Debt Scoring

### Multi-Dimensional Scoring System

```python
def calculate_debt_score(item):
    """
    Calculate technical debt score (0-100)

    Dimensions:
    - Security: 40% weight
    - Dependencies: 30% weight
    - Code Quality: 20% weight
    - Test Coverage: 10% weight
    """
    score = {
        'security': security_impact(item) * 0.40,
        'dependencies': dependency_health(item) * 0.30,
        'code_quality': code_quality_metrics(item) * 0.20,
        'test_coverage': coverage_gap(item) * 0.10
    }

    total = sum(score.values())
    return min(total, 100)  # Cap at 100
```

### Debt Levels

| Score | Level | Action | Timeline |
|-------|-------|--------|----------|
| 81-100 | 🔴 CRITICAL | Stop everything, fix immediately | < 24h |
| 61-80 | 🟠 HIGH | Prioritize over new features | < 7 days |
| 41-60 | 🟡 MEDIUM | Schedule in next sprint | < 30 days |
| 21-40 | 🟢 LOW | Backlog for maintenance | < 90 days |
| 0-20 | ✅ ACCEPTABLE | Monitor only | Ongoing |

### Metrics Collection

```bash
# Count TODO/FIXME comments
TODO_COUNT=$(// EXAMPLE: git grep -i "TODO" -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.py' '*.go' '*.rs' | wc -l)
FIXME_COUNT=$(// EXAMPLE: git grep -i "FIXME" -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.py' '*.go' '*.rs' | wc -l)
HACK_COUNT=$(// EXAMPLE: git grep -i "HACK" -- '*.js' '*.ts' '*.jsx' '*.tsx' '*.py' '*.go' '*.rs' | wc -l)

# Calculate cyclomatic complexity
npx eslint --format json '.' | jq '.[].messages[] | select(.ruleId == "complexity")'

# Measure code duplication
npx jscpd .

# Check test coverage
npm test -- --coverage -- --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## Debt Tracking Systems

### 1. Issue-Based Tracking

Create GitHub issues for debt items:

```markdown
---
title: "[Tech Debt] Refactor authentication module"
labels: technical-debt, refactor, priority:high
---

## Debt Score
- **Security**: 8/10 (uses outdated crypto)
- **Dependencies**: 6/10 (uses deprecated library)
- **Code Quality**: 7/10 (low cohesion, high coupling)
- **Test Coverage**: 3/10 (20% coverage)

**Total**: 60/100 (HIGH)

## Impact
- Security vulnerability
- Difficult to maintain
- Blocks new features
- Causes bugs in production

## Effort Estimate
- 2-3 days of work
- Affects 5 modules
- Requires integration testing

## Proposed Solution
1. Migrate to modern auth library
2. Add comprehensive tests
3. Update documentation
4. Deprecate old API gracefully

## Acceptance Criteria
- [ ] New library integrated
- [ ] Tests passing (90%+ coverage)
- [ ] Security audit passing
- [ ] Documentation updated
- [ ] Performance verified

## Created By
Initial implementation rushed to meet deadline (Issue #123)
Created: 2024-01-15
```

### 2. Code Comment Tracking

```javascript
// EXAMPLE: Educational code showing debt tracking patterns
// EXAMPLE: // TODO: [HIGH-60] Extract to separate service
// This function does too much (auth + validation + persistence)
async function processUser(user) {
  // ... 200 lines of mixed concerns
}

// EXAMPLE: // FIXME: [CRITICAL-85] Security vulnerability (EXAMPLE)
// Using MD5 for password hashing. Replace with bcrypt.
const hashPassword = (pwd) => crypto.createHash('md5').update(pwd).digest('hex');

// EXAMPLE: // HACK: [MEDIUM-40] Quick fix for demo
// Remove after proper error handling implemented
try {
  dangerousOperation()
} catch (e) {
  // Swallow error for demo
}
```

### 3. ADR (Architecture Decision Records)

Create ADRs for significant debt:

```markdown
# ADR-001: Temporary Authentication Bypass

## Status
Accepted (Temporary)

## Context
Deadline pressure required quick deployment.
Proper auth system would take 2 weeks.

## Decision
Implemented basic JWT without refresh token rotation.
Password reset uses insecure tokens.

## Consequences
- **Positive**: Shipped on time
- **Negative**: Security risk (DEBT SCORE: 85)
- **Technical Debt**: HIGH priority
- **Paydown Deadline**: 2024-02-01

## Related Issues
- Debt tracking: #[tech-debt-auth]
- Original feature: #123
```

## Debt Prioritization Matrix

### Impact vs Effort Matrix

```
            HIGH EFFORT          LOW EFFORT
        +----------------+----------------+
  HIGH  |  SCHEDULE      |  DO NOW        |
 IMPACT |  (Plan)        |  (Urgent)      |
        +----------------+----------------+
  LOW   |  BACKLOG       |  QUICK WINS    |
 IMPACT |  (Maybe Never) |  (Do Soon)     |
        +----------------+----------------+
```

### Risk-Based Prioritization

```python
def prioritize_debt(debt_items):
    """Sort debt by (risk_score * impact) / effort"""

    risk_score = {
        'security': 10,
        'data_loss': 9,
        'performance': 7,
        'maintainability': 5,
        'user_experience': 4,
        'cosmetic': 1
    }

    for item in debt_items:
        item.priority = (
            risk_score[item.risk_type] *
            item.user_impact *
            item.occurrence_frequency
        ) / item.effort_hours

    return sorted(debt_items, key=lambda x: x.priority, reverse=True)
```

## Debt Reduction Strategies

### 1. Boy Scout Rule
> "Always leave the code better than you found it"

```javascript
// BEFORE: Working on feature
function processPayment(payment) {
  // ... payment logic

  // EXAMPLE: // TODO: Extract validation (technical debt)
  if (!payment.amount || payment.amount <= 0) {
    if (!payment.currency || !['USD', 'EUR'].includes(payment.currency)) {
      // ... 50 lines of validation
    }
  }
}

// AFTER: Paying down debt while working
function processPayment(payment) {
  validatePayment(payment)  // ✅ Extracted to function
  processPaymentTransaction(payment)
}

function validatePayment(payment) {
  if (!payment.amount || payment.amount <= 0) {
    throw new InvalidPaymentError('Amount required')
  }
  if (!payment.currency || !['USD', 'EUR'].includes(payment.currency)) {
    throw new InvalidPaymentError('Invalid currency')
  }
}
```

### 2. Strangler Fig Pattern
Gradually replace legacy code:

```bash
# Week 1: Add new implementation alongside old
src/
  auth/
    old-auth.js      # Legacy
    new-auth.js      # New

# Week 2: Route traffic to new implementation
router.js:
  if (featureFlags.useNewAuth) {
    return newAuth.authenticate()
  }
  return oldAuth.authenticate()

# Week 3: Migrate all consumers
# Week 4: Remove old implementation
git rm src/auth/old-auth.js
```

### 3. Scheduled Debt Sprints

Dedicate time specifically for debt:

```yaml
sprint_schedule:
  sprint_24: "New Features"
  sprint_25: "Bug Fixes"
  sprint_26: "Technical Debt Week"  # 100% debt focus
  sprint_27: "New Features"
```

### 4. Debt Budget

Allocate percentage of time:

```python
TEAM_CAPACITY = 80 * 5  # 5 developers * 80 hours/sprint

DEBT_BUDGET = 0.20  # 20% of time
FEATURE_TIME = TEAM_CAPACITY * (1 - DEBT_BUDGET)  # 320 hours
DEBT_TIME = TEAM_CAPACITY * DEBT_BUDGET  # 80 hours

# Every sprint:
# - 320 hours for new features
# - 80 hours for technical debt
```

## Anti-Patterns to Avoid

### ❌ Rewrite from Scratch
**Instead**: Incremental refactoring

### ❌ "I'll fix it later"
**Instead**: Create tracking issue immediately

### ❌ Premature optimization
**Instead**: Measure first, optimize hot paths

### ❌ Gold-plating
**Instead**: Ship working code, iterate later

### ❌ Framework fatigue
**Instead**: Stick to proven, stable tech

## Measuring Debt Reduction

### Metrics Dashboard

```bash
# Weekly metrics
echo "### Technical Debt Metrics" >> debt-metrics.md
echo "" >> debt-metrics.md

# Debt trends (EXAMPLE: shell script)
TODO_CURRENT=$(EXAMPLE: git grep -c "TODO")
TODO_LAST_WEEK=$(git log -1 --pretty=%H | xargs EXAMPLE: git grep | grep -c "TODO" || echo 0)
# EXAMPLE: Trend calculation
TREND=$([ $EXAMPLE: TODO_CURRENT -lt $EXAMPLE: TODO_LAST_WEEK ] && echo "↓ Improving" || echo "↑ Growing")

# Debt by module (EXAMPLE: shell script)
for module in $(find src -type d); do
  COUNT=$(EXAMPLE: git grep -c "TODO" -- "$module")
  # EXAMPLE: Output TODO count per module
  echo "- $module: $COUNT EXAMPLE: TODOs" >> debt-metrics.md
done

# Debt paid this week
CLOSED_DEBT=$(gh issue list --label "technical-debt" --state closed --json title | jq 'length')
echo "- Debt issues closed: $CLOSED_DEBT" >> debt-metrics.md
```

### Debt Burndown Chart

```javascript
// Track debt over time
const debtMetrics = {
  '2024-01-01': { total: 150, critical: 20, high: 40, medium: 50, low: 40 },
  '2024-01-08': { total: 145, critical: 18, high: 38, medium: 49, low: 40 },
  '2024-01-15': { total: 138, critical: 15, high: 35, medium: 48, low: 40 },
  '2024-01-22': { total: 130, critical: 12, high: 30, medium: 48, low: 40 },
  // Trend: ✅ Debt decreasing
}
```

## Commands

```bash
# Count technical debt markers
// EXAMPLE: git grep -i "TODO\|FIXME\|HACK\|XXX" -- '*.js' '*.ts' | wc -l

# Find high-complexity functions
npx eslint --format json '.' | jq '.[].messages[] | select(.ruleId == "complexity")'

# Check test coverage gaps
npm test -- --coverage -- --coverageThreshold='{"global":80}'

# Find code duplication
npx jscpd . --min-lines 10 --min-tokens 50

# Generate debt report
npx sonarqube-scanner
```

## 🚨 Ghost Debt Detection (Invisible Technical Debt)

### What is Ghost Debt?

**Ghost Debt** = Technical debt that is invisible, undocumented, or ignored:

| Type | Description | Examples |
|------|-------------|----------|
| **Undocumented** | Exists but not marked | Complex code without comments |
| **Ignored** | Known but not tracked | "We'll fix it later" (never tracked) |
| **Accidental** | Unintentional debt | Copying wrong patterns |
| **Debt of Omission** | Things NOT done | Missing tests, no error handling |
| **Bitrot** | Code aging poorly | Outdated dependencies, deprecated APIs |
| **Knowledge Loss** | Only one person understands | "Carlos's code", "Ask Maria" |
| **Invisible Complexity** | Hidden in simple code | God functions, nested conditionals |
| **Configuration Debt** | Env-specific hacks | "Works on my machine" fixes |

### Detecting Ghost Debt

#### 1. Undocumented Complexity

```bash
# Find functions with high complexity but NO comments
npx eslint --format json '.' | \
  jq '.[].messages[] | select(.ruleId == "complexity") | .message' | \
  while read file; do
    if ! // EXAMPLE: git grep -q "TODO\|FIXME\|HACK" "$file"; then
      echo "👻 Ghost debt: $file (complex but undocumented)"
    fi
  done

# Find large files without documentation
find src -name "*.js" -o -name "*.ts" | \
  while read file; do
    lines=$(wc -l < "$file")
    comments=$(grep -c "^\s*//" "$file" || echo 0)
    if [ $lines -gt 300 ] && [ $comments -lt 10 ]; then
      echo "👻 Ghost debt: $file ($lines lines, $comments comments)"
    fi
  done
```

#### 2. Ignored Debt (Mental Debt)

```yaml
Symptoms:
  - "Always ask X about this module"
  - "Don't touch Y, it's fragile"
  - "We know Z is broken, but..."
  - Tribal knowledge vs documented knowledge

Detection:
  1. Check git blame: Few contributors = knowledge silo
  2. Check documentation: No docs = ghost debt
  3. Check bug history: Recurring issues = systemic debt
  4. Ask team: "What code are you afraid to touch?"

Example:
  "This module always breaks when we deploy"
   → No GitHub issue tracking it
   → No TODO/FIXME in code
   → 👻 GHOST DEBT: Systemic deployment issue, never documented
```

#### 3. Debt of Omission

```bash
# Find files without tests
find src -name "*.js" -o -name "*.ts" | \
  while read file; do
    test_file="tests/${file#src/}"
    test_file="${test_file%.*}.test.js"
    if [ ! -f "$test_file" ]; then
      echo "👻 Ghost debt: $file (no tests)"
    fi
  done

# Find error handlers that just log
// EXAMPLE: git grep -r "catch.*console\.log" -- '*.js' '*.ts' | \
  echo "👻 Ghost debt: Swallowing errors without handling"

# Find public APIs without error handling
grep -r "export.*function\|export.*async" src/ | \
  while read line; do
    file=$(echo "$line" | cut -d: -f1)
    func=$(echo "$line" | cut -d: -f2)
    if ! grep -A 20 "$func" "$file" | grep -q "try\|throw\|catch"; then
      echo "👻 Ghost debt: $func in $file (no error handling)"
    fi
  done
```

#### 4. Bitrot Detection

```bash
# Find outdated dependencies
npm outdated --json | \
  jq -r '.[] | select(.diff == "major") | "👻 Ghost debt: \(.name) outdated by \(.diff}"'

# Find deprecated API usage
// EXAMPLE: git grep -r "MaterialUI.*oldApiName" -- \
  && echo "👻 Ghost debt: Using deprecated Material-UI API"

# Find Node.js version-specific code
// EXAMPLE: git grep -r "util\.promisify\|require('util')" -- \
  && echo "👻 Ghost debt: Using old Node.js patterns"

# Find browser-specific code without checks
// EXAMPLE: git grep -r "window\." -- '*.js' '*.ts' | \
  grep -v "typeof window\|if.*window" | \
  echo "👻 Ghost debt: Window access without SSR check"
```

#### 5. Knowledge Silo Detection

```bash
# Find files with single author
git log --pretty=format:"%an" <file> | sort | uniq -c | \
  while read count author; do
    if [ $count -gt 20 ] && [ $(echo "$count" | wc -l) -eq 1 ]; then
      echo "👻 Ghost debt: Knowledge silo ($author owns this file)"
    fi
  done

# Find uncommented complex logic
// EXAMPLE: git grep -A 10 "if.*if.*if" -- '*.js' '*.ts' | \
  grep -B 5 "^\s*//" | \
  echo "👻 Ghost debt: Nested conditions without explanation"

# Find magic numbers without constants
// EXAMPLE: git grep -r "\b[0-9]{3,}\b" -- '*.js' '*.ts' | \
  grep -v "//\|/\*" | \
  echo "👻 Ghost debt: Magic numbers (100, 2000, 86400, etc.)"
```

### Ghost Debt Scoring

```python
def calculate_ghost_debt_score(file_path):
    """
    Calculate ghost debt score (0-100)

    Penalties:
    - No comments: +20
    - No tests: +30
    - Single author (knowledge silo): +15
    - High complexity: +25
    - Outdated dependencies: +10
    """
    score = 0

    # Check for comments
    if not has_comments(file_path):
        score += 20

    # Check for tests
    if not has_tests(file_path):
        score += 30

    # Check for knowledge silo
    if count_authors(file_path) == 1:
        score += 15

    # Check complexity
    if cyclomatic_complexity(file_path) > 15:
        score += 25

    # Check dependencies
    if has_outdated_deps(file_path):
        score += 10

    return min(score, 100)
```

### Converting Ghost Debt to Tracked Debt

```yaml
Step 1: Detect
  → Run ghost debt detection scripts
  → Generate list of invisible debt items

Step 2: Document (EXAMPLE: process)
  → Create GitHub issues for each item
  → Add EXAMPLE: TODO/FIXME comments to code
  → Create ADRs for significant debt

Step 3: Prioritize
  → Score each ghost debt item
  → Add to technical debt backlog
  → Assign to sprint or maintenance window

Step 4: Eliminate
  → Pay down debt using standard strategies
  → Verify elimination (tests, metrics)
  → Document lessons learned
```

### Ghost Debt Prevention

```yaml
Code Review Checklist:
  [ ] All complex code has comments
  [ ] All new code has tests
  [ ] All errors are handled (not just logged)
  [ ] No "temporary" solutions without tracking
  [ ] No TODOs without GitHub issues
  [ ] No code changes without updating docs

Team Practices:
  - Document tribal knowledge in ADRs
  - Rotate code ownership (pair programming)
  - Require tests for all new code
  - Track all known debt in issues
  - Monthly ghost debt sweeps
```

### Ghost Debt Examples

#### Example 1: Invisible Complexity

```javascript
// 👻 GHOST DEBT: This function is complex (cyclomatic: 18)
// but has NO comments, NO tests, NO tracking

function processUserData(user, data, options) {
  if (!user || !data) {
    if (options?.strict) {
      throw new Error('Invalid')
    } else {
      return null
    }
  }

  if (user.role === 'admin') {
    if (data.type === 'export') {
      if (options?.format === 'csv') {
        // ... 50 more lines
      } else {
        // ... nested conditions
      }
    }
  }

  // Returns something, but what? No docs
}

// ✅ CONVERT TO TRACKED DEBT:

// EXAMPLE: Educational code showing tracked debt patterns
// EXAMPLE: // FIXME: [HIGH-70] Extract to separate functions
// This function has 18 cyclomatic complexity (should be < 10)
// EXAMPLE: // TODO: Add tests for all code paths
// EXAMPLE: // TODO: Add JSDoc documentation
// Tracking: #[ghost-debt-user-processing]
function processUserData(user, data, options) {
  // ...
}
```

#### Example 2: Debt of Omission

```typescript
// 👻 GHOST DEBT: No error handling, no tests, no tracking

export async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/users/${userId}`)
  const data = await response.json()
  return data
  // What if response is 404? 500? Network error?
  // No error handling = GHOST DEBT
}

// ✅ CONVERT TO TRACKED DEBT:

// EXAMPLE: Educational code showing error handling debt patterns
// EXAMPLE: // FIXME: [CRITICAL-85] Add error handling
// EXAMPLE: // TODO: [MEDIUM-50] Add tests for error cases
// Tracking: #[ghost-debt-fetch-errors]
export async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/users/${userId}`)

  if (!response.ok) {
    // ✅ Added error handling
    throw new UserProfileError(
      `Failed to fetch user: ${response.status}`,
      response.status
    )
  }

  const data = await response.json()
  return data
}
```

#### Example 3: Knowledge Silo

```python
# 👻 GHOST DEBT: Only Maria understands this module

# config/pricing_calculator.py
# Author: Maria (99% of commits)
# No documentation, no tests, no comments
# What happens if Maria leaves?

def calculate_premium(user_data, plan_type, discount_code=None):
    # 200 lines of complex calculation logic
    # No comments explaining the formula
    # No tests for edge cases
    # 👻 GHOST DEBT: Knowledge silo + undocumented complexity

# ✅ CONVERT TO TRACKED DEBT:

# EXAMPLE: Educational code showing knowledge silo debt patterns
# EXAMPLE: # FIXME: [HIGH-75] Document pricing formula
# EXAMPLE: # FIXME: [HIGH-75] Add comprehensive tests
# EXAMPLE: # FIXME: [MEDIUM-60] Extract magic numbers to constants
# Tracking: #[ghost-debt-pricing-knowledge-silo]
# ADR: pricing-calculation-formula.md
def calculate_premium(user_data, plan_type, discount_code=None):
    """
    Calculate premium based on user profile and plan.

    Formula: base_rate * risk_multiplier * (1 - discount)

    See ADR-005 for full calculation explanation.
    """
    # ... documented logic
```

### Anti-Pattern: "It Works, Don't Touch It"

```yaml
❌ GHOST DEBT MINDSET:
  "This code is fragile, don't touch it"
  "Only Carlos knows how this works"
  "We'll rewrite it someday"
  "It's too risky to change"

�️ HEALTHY APPROACH:
  "This code needs refactoring"
  "Let's document what Carlos knows"
  "Let's add tests before refactoring"
  "Let's pay down this debt incrementally"
```

### Commands for Ghost Debt Detection

```bash
# Full ghost debt scan
echo "👻 Ghost Debt Scan Report" > ghost-debt-report.md
echo "" >> ghost-debt-report.md

# 1. Undocumented complexity
echo "## Undocumented Complexity" >> ghost-debt-report.md
npx eslint --format json '.' | \
  jq '.[].messages[] | select(.ruleId == "complexity")' \
  >> ghost-debt-report.md

# 2. Missing tests
echo "## Missing Tests" >> ghost-debt-report.md
find src -name "*.js" | while read f; do
  [ ! -f "tests/${f#src/}" ] && echo "- $f" >> ghost-debt-report.md
done

# 3. Knowledge silos
echo "## Knowledge Silos" >> ghost-debt-report.md
for file in $(find src -name "*.js"); do
  authors=$(git log --pretty=format:"%an" "$file" | sort -u | wc -l)
  if [ $authors -eq 1 ]; then
    echo "- $file: $(git log --pretty=format:"%an" "$file" | head -1)" \
      >> ghost-debt-report.md
  fi
done

# 4. Bitrot
echo "## Bitrot (Outdated Dependencies)" >> ghost-debt-report.md
npm outdated >> ghost-debt-report.md

cat ghost-debt-report.md
```

---

## Related Skills

- **code-quality**: Linting, complexity analysis
- **testing**: Coverage, test quality
- **dependency-updates**: Keeping deps healthy
- **documentation**: Documenting debt decisions

---

## Examples

### Example 1: Prioritizing Technical Debt

**User request:** "We have 100 items of technical debt. What should we fix first?"

**Prioritization Matrix:**

```yaml
# EXAMPLE: Debt prioritization matrix
Debt Items:
  - ID: DEBT-001
    Type: EXAMPLE-FIXME (debt type example)
    Location: auth/password_reset.py
    Description: No rate limiting on password reset
    Impact: HIGH (security vulnerability)
    Effort: LOW (1 hour)
    Priority: P0 - Critical
    Action: Fix immediately
    
  - ID: DEBT-002
    Type: EXAMPLE-TODO
    Location: utils/email.py
    Description: Add email template support
    Impact: MEDIUM (better UX)
    Effort: MEDIUM (4 hours)
    Priority: P2 - Important
    Action: Schedule for next sprint
    
  - ID: DEBT-003
    Type: EXAMPLE-HACK
    Location: api/routes.py
    Description: Quick workaround for rate limiter
    Impact: LOW (works but ugly)
    Effort: HIGH (2 days)
    Priority: P3 - Nice to have
    Action: Consider during refactoring

Priority Formula:
  score = (impact * 3 + frequency * 2) / effort
  
  P0 (Critical): score >= 10
  P1 (High): 7 <= score < 10
  P2 (Medium): 4 <= score < 7
  P3 (Low): score < 4
