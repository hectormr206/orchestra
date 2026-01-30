# ADR-003: Ghost Debt Detection and Elimination

**Date:** 2025-01-23
**Status:** Accepted
**Deciders:** ai-core maintainers
**Related:** [Technical Debt Skill](../SKILLS/technical-debt/SKILL.md)

---

## Context

Traditional technical debt tracking only captures **visible debt**:
- TODO/FIXME/HACK comments
- GitHub issues
- JIRA tickets
- Code review findings

**Problem:** This misses **ghost debt** (invisible technical debt):
- Complex code without documentation
- Missing tests (debt of omission)
- Knowledge silos (only one person understands)
- Bitrot (outdated dependencies)
- Configuration hacks ("works on my machine")
- Magic numbers

Impact:
- Debt accumulates invisibly
- Surprise failures when it breaks
- Difficulty estimating technical debt
- No way to measure true code health

---

## Decision

Implement a **comprehensive ghost debt detection system** with two components:

### Component 1: Expanded Technical Debt Skill
**File:** `SKILLS/technical-debt/SKILL.md`

**Additions:**
- Section on "Ghost Debt Detection"
- Types of ghost debt (6 categories)
- Detection methods for each type
- Scoring system for ghost debt
- Conversion strategy (ghost → tracked)

### Component 2: Ghost Debt Hunter Subagent
**File:** `SUBAGENTS/universal/ghost-debt-hunter.md`

**Purpose:**
- Automated scanning for ghost debt
- Classification and prioritization
- Documentation of findings
- Creation of tracking issues

### Types of Ghost Debt Detected

#### 1. Undocumented Complexity
```yaml
Detection:
  - High cyclomatic complexity (> 10)
  - No comments explaining logic
  - No JSDoc/docstrings
Severity: HIGH (if critical path)
```

#### 2. Debt of Omission
```yaml
Detection:
  - No tests for public modules
  - No error handling
  - No input validation
  - No logging in critical paths
Severity: CRITICAL
```

#### 3. Knowledge Silos
```yaml
Detection:
  - Single author (90%+ of commits)
  - No documentation
  - No tests (tests = documentation)
Severity: CRITICAL (if critical module)
```

#### 4. Bitrot
```yaml
Detection:
  - Outdated dependencies (> 2 major versions)
  - Deprecated API usage
  - Old language patterns
Severity: HIGH
```

#### 5. Invisible Complexity
```yaml
Detection:
  - God functions (> 100 lines)
  - Magic numbers
  - Nested conditionals (> 3 levels)
Severity: MEDIUM
```

#### 6. Configuration Debt
```yaml
Detection:
  - Environment-specific hacks
  - "Works on my machine" comments
  - Hardcoded environment values
Severity: CRITICAL (if security bypass)
```

---

## Scoring System

### Ghost Debt Score (0-100)

```python
def calculate_ghost_debt_score(item):
    score = 0

    # Undocumented complexity
    if not has_comments(file):
        score += 20

    # No tests
    if not has_tests(file):
        score += 30

    # Knowledge silo
    if count_authors(file) == 1:
        score += 15

    # High complexity
    if cyclomatic_complexity(file) > 15:
        score += 25

    # Outdated deps
    if has_outdated_deps(file):
        score += 10

    return min(score, 100)
```

### Severity Levels

| Score | Level | Action | Timeline |
|-------|-------|--------|----------|
| 81-100 | 🔴 CRITICAL | Stop everything, fix | < 24h |
| 61-80 | 🟠 HIGH | Prioritize over features | < 7 days |
| 41-60 | 🟡 MEDIUM | Schedule next sprint | < 30 days |
| 21-40 | 🟢 LOW | Backlog | < 90 days |

---

## Detection Process

### Phase 1: Automated Scanning

```bash
# Scan all files for ghost debt
ghost-debt-hunter scan

# Scan specific type
ghost-debt-hunter scan --type=undocumented
ghost-debt-hunter scan --type=silos
ghost-debt-hunter scan --type=bitrot
```

### Phase 2: Analysis & Scoring

```yaml
For each finding:
  1. Identify type
  2. Calculate severity score
  3. Determine impact
  4. Estimate effort to fix
  5. Calculate priority
```

### Phase 3: Documentation

```markdown
## Ghost Debt Report

Summary:
  - Total items: 47
  - CRITICAL: 8
  - HIGH: 15
  - MEDIUM: 18
  - LOW: 6

Top CRITICAL items:
  1. Undocumented payment processing (85/100)
  2. Knowledge silo: Pricing calculator (90/100)
  3. No error handling in auth (75/100)
```

### Phase 4: Conversion to Tracked Debt

```yaml
For each ghost debt item:
  1. Create GitHub issue
  2. Add FIXME/TODO comments in code
  3. Create ADR (if significant)
  4. Add to technical debt backlog
  5. Schedule for resolution
```

---

## Elimination Strategies

### Strategy 1: Document First
```yaml
Approach:
  1. Add comments explaining complexity
  2. Document decision logic
  3. Create ADRs for significant debt
  4. Then refactor
```

### Strategy 2: Test First
```yaml
Approach:
  1. Write tests for existing behavior
  2. Tests serve as documentation
  3. Then refactor safely
  4. Tests verify no regression
```

### Strategy 3: Extract & Document
```yaml
Approach:
  1. Extract large functions
  2. Document each extracted piece
  3. Create clear interfaces
  4. Make code testable
```

### Strategy 4: Knowledge Transfer
```yaml
Approach:
  1. Document session with knowledge owner
  2. Write README for module
  3. Add tests (living docs)
  4. Pair programming
  5. Code review rotation
```

---

## Prevention

### Code Review Checklist

```yaml
Before merging:
  [ ] All complex code has comments
  [ ] All new code has tests
  [ ] All errors are handled
  [ ] No magic numbers
  [ ] No "temporary" solutions without tracking
  [ ] No TODOs without issues
  [ ] Knowledge is shared (not siloed)
```

### Team Practices

```yaml
Ongoing:
  - Monthly ghost debt scans
  - Quarterly knowledge sharing sessions
  - Rotate code ownership
  - Document tribal knowledge
  - Track all debt in issues
```

---

## Consequences

### Positive
- ✅ **Visibility:** Invisible debt becomes visible
- ✅ **Measurement:** True technical debt quantified
- ✅ **Prioritization:** Risk-based prioritization
- ✅ **Prevention:** Team aware of ghost debt
- ✅ **Tracking:** All debt is tracked

### Negative
- ⚠️ **Initial effort:** Scanning takes time
- ⚠️ **False positives:** Some findings aren't real debt
- ⚠️ **Maintenance:** Need regular scans
- ⚠️ **Team adoption:** Requires cultural change

### Mitigations
- Automated scanning (low effort)
- Manual review of findings
- Integration with existing workflow
- Training and documentation

---

## Alternatives Considered

### Alternative 1: Ignore Ghost Debt
**Pros:** Less work
**Cons:** Accumulates invisibly, surprise failures
**Rejected:** Too risky

### Alternative 2: Manual Reviews Only
**Pros:** Human judgment
**Cons:** Expensive, inconsistent, not scalable
**Rejected:** Automation needed

### Alternative 3: Only Track Visible Debt
**Pros:** Simpler
**Cons:** Misses majority of debt
**Rejected:** Incomplete picture

---

## Implementation Status

### Completed ✅
- [x] Expanded technical-debt skill
- [x] Created ghost-debt-hunter agent
- [x] Conducted initial scan of ai-core
- [x] Generated ghost debt report

### In Progress 🚧
- [ ] Addressing CRITICAL findings
- [ ] Creating GitHub issues for debt items
- [ ] Setting up regular scans

### Planned 📋
- [ ] CI/CD integration for ghost debt detection
- [ ] Automated monthly reports
- [ ] Ghost debt burndown tracking

---

## Related Decisions

- [Technical Debt Skill](../SKILLS/technical-debt/SKILL.md) - Core technical debt patterns
- [Ghost Debt Hunter Agent](../SUBAGENTS/universal/ghost-debt-hunter.md) - Detection agent

---

## References

- [GHOST-DEBT-REPORT.md](../GHOST-DEBT-REPORT.md) - Initial scan results
- [DEBT-TRACKING.md](../DEBT-TRACKING.md) - Visible debt tracking

---

**Approved by:** ai-core maintainers
**Effective:** 2025-01-23
**Review date:** 2025-04-23 (quarterly)
