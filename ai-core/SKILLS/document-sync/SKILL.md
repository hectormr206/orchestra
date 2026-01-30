---
name: document-sync
description: >
  Automatiza sincronización de documentación crítica después de cambios.
  Actualiza NEXT_STEPS.md, CHANGELOG.md, métricas y rastrea progreso.
  Trigger: Al completar tareas, crear commits, actualizar métricas.

license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Completed task"
    - "Task finished"
    - "NEXT_STEPS update"
    - "Changelog update"
    - "Metrics update"
    - "Documentation sync"
    - "Mark task as complete"
    - "Update progress"
  tags: [documentation, maintenance, automation, metrics, tracking]
allowed-tools: [Read, Write, Edit, Grep, Bash, TaskList, TaskGet]
---

# Skill: Document Sync

> **Automatiza sincronización de documentación crítica** - Mantiene NEXT_STEPS.md, CHANGELOG.md, README.md y DEBT-TRACKING.md automáticamente sincronizados.

---

## When to Use This Skill

**Auto-invoke when:**
- A task is completed (TaskUpdate with status: completed)
- A commit is made with conventional commits (feat:, fix:, docs:)
- Project metrics change (new skills, workflows, ADRs)
- Critical documentation is detected as outdated
- User explicitly requests documentation sync

**Also invoke when:**
- User asks to "update documentation"
- User asks to "mark task as complete"
- User asks to "sync NEXT_STEPS"
- User asks to "update changelog"

---

## Critical Patterns

### ALWAYS - Update Rules

1. **NEXT_STEPS.md** (Highest Priority)
   - Mark completed tasks with [x]
   - Update metrics section
   - Update last modified date
   - Maintain consistency with actual TaskList

2. **CHANGELOG.md** (Highest Priority)
   - Categorize changes: Added, Changed, Fixed, Security
   - Add to [Unreleased] section
   - Create new version when appropriate
   - Follow Keep a Changelog format

3. **README.md** (Medium Priority)
   - Update skill count (e.g., 35+ → 38)
   - Update workflow count
   - Update last update date
   - Verify all links are current

4. **DEBT-TRACKING.md** (Medium Priority)
   - Mark completed debt items with [x]
   - Recalculate totals
   - Reevaluate priorities based on completion

### NEVER - What to Avoid

1. **NEVER** modify user's manual edits without detecting them
2. **NEVER** update files with trivial/insignificant changes
3. **NEVER** break existing markdown syntax or formatting
4. **NEVER** remove content without user confirmation
5. **NEVER** update files that are actively being edited
6. **NEVER** create conflicting updates

---

## Workflow

### Complete Synchronization Flow

```yaml
1. DETECT CHANGES
   ├─ Check TaskList for completed tasks
   ├─ Analyze recent git commits (last 10)
   ├─ Count current metrics (skills, workflows, tests)
   └─ Identify outdated documentation

2. PRIORITIZE UPDATES
   ├─ High: NEXT_STEPS.md, CHANGELOG.md
   ├─ Medium: README.md, DEBT-TRACKING.md
   └─ Low: Other documentation files

3. UPDATE FILES (in order)
   ├─ NEXT_STEPS.md:
   │  ├─ Mark [x] completed tasks
   │  ├─ Update metrics:
   │  │  - Skills total (count SKILLS/*/)
   │  │  - Skills with tests (count tests/skills/*.test.md)
   │  │  - ADRs created (count docs/adr/*.md)
   │  │  - Technical debt pending
   │  └─ Update date: **Última actualización:** YYYY-MM-DD
   │
   ├─ CHANGELOG.md:
   │  ├─ Categorize commits by type (feat/fix/docs/refactor)
   │  ├─ Add to [Unreleased] with proper category
   │  ├─ Create [X.Y.Z] version if significant changes
   │  └─ Include date for new versions
   │
   ├─ README.md:
   │  ├─ Update "**Skills totales:** 35+" → actual count
   │  ├─ Update workflow count if changed
   │  └─ Verify consistency with other docs
   │
   └─ DEBT-TRACKING.md:
      ├─ Mark [x] completed items
      ├─ Recalculate totals by priority
      └─ Update summary statistics

4. VERIFY
   ├─ Validate markdown syntax
   ├─ Check for broken links
   ├─ Confirm consistency between files
   └─ Ensure no duplicate entries

5. REPORT
   └─ Display summary of changes made
```

---

## Commands and Tools

### Bash Commands

```bash
# Count skills
ls -1 SKILLS/ | grep -v "^[.]" | wc -l

# Count skill tests
ls -1 tests/skills/*.test.md 2>/dev/null | wc -l

# Count ADRs
ls -1 docs/adr/*.md 2>/dev/null | wc -l

# Count workflows
ls -1 .github/workflows/*.yml 2>/dev/null | wc -l

# Recent commits
git log --oneline -10 --pretty=format:"%h %s"

# Completed tasks
TaskList (then filter by status: completed)

# Verify markdown files
find . -name "*.md" -type f | head -20
```

### File Patterns

**NEXT_STEPS.md tasks to mark:**
```markdown
- [ ] Task name here  ← Should be [x] when completed
```

**CHANGELOG.md categories:**
```markdown
## [Unreleased]

### Added
- New features, skills, ADRs

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Security
- Security-related changes
```

**README.md metrics:**
```markdown
Enterprise-ready: **38 skills** cubriendo...
CI/CD workflow configurado (11 workflows)
```

---

## File Update Patterns

### Pattern 1: Update NEXT_STEPS.md

1. **Detect completed tasks**
   - Use TaskList to identify completed tasks
   - Look for [ ] that should be [x]
   - Check metrics against actual counts

2. **Update content**
   ```markdown
   Before:
   - [ ] Crear CHANGELOG.md
   **Skills totales:** 35+

   After:
   - [x] Crear CHANGELOG.md
   **Skills totales:** 38

   **Última actualización:** 2025-01-23
   ```

3. **Update metrics**
   - Count: `ls -1 SKILLS/ | grep -v "^[.]" | wc -l`
   - Count: `ls -1 tests/skills/*.test.md 2>/dev/null | wc -l`
   - Count: `ls -1 docs/adr/*.md 2>/dev/null | wc -l`

### Pattern 2: Update CHANGELOG.md

1. **Detect changes**
   - Analyze commits: `git log --oneline -10`
   - Categorize by: feat (Added), fix (Fixed), docs (Changed)
   - Determine if significant enough for new version

2. **Update content**
   ```markdown
   ## [Unreleased]

   ### Added
   - New document-sync skill

   ### Fixed
   - Bug in task completion flow

   ## [2.0.1] - 2025-01-23
   ```

3. **Create version** (when appropriate)
   - Significant changes → new version
   - Include date: YYYY-MM-DD
   - Move from [Unreleased] to [X.Y.Z]

### Pattern 3: Update README.md

1. **Detect metric changes**
   - Compare current README numbers with actual counts
   - Check if skills, workflows, or other metrics changed

2. **Update content**
   ```markdown
   Before:
   Enterprise-ready: **35+ skills** cubriendo...

   After:
   Enterprise-ready: **38 skills** cubriendo...
   ```

### Pattern 4: Update DEBT-TRACKING.md

1. **Detect completed debt items**
   - Check for resolved technical debt
   - Verify fixes are deployed

2. **Update content**
   ```markdown
   Before:
   - [ ] High: Refactor legacy authentication
   **Total pending:** 15 items

   After:
   - [x] High: Refactor legacy authentication
   **Total pending:** 14 items
   ```

---

## Related Skills

- **`toolkit-maintenance`** - Automated maintenance system for ai-core
- **`documentation`** - README, API docs, ADRs patterns
- **`git-workflow`** - Commit patterns, branching, PRs
- **`technical-debt`** - Debt tracking, scoring, prioritization

---

## Examples

### Example 1: Task Completed

**User:**
> "Completa la tarea de crear el nuevo skill"

**Skill actions:**
1. Detects task completion via TaskUpdate
2. Updates NEXT_STEPS.md: Marks [x] on completed task
3. Updates metrics in NEXT_STEPS.md
4. Adds entry to CHANGELOG.md [Unreleased]
5. Reports changes made

### Example 2: Commit Made

**User:**
> `git commit -m "feat: add OAuth2 support"`

**Skill actions:**
1. Detects feat: commit
2. Adds to CHANGELOG.md:
   ```markdown
   ### Added
   - OAuth2 support for authentication
   ```
3. Updates NEXT_STEPS.md if OAuth2 was listed as pending task

### Example 3: Metrics Update

**User:**
> "Actualiza las métricas del proyecto"

**Skill actions:**
1. Counts: skills, workflows, tests, ADRs
2. Updates README.md with new counts
3. Updates NEXT_STEPS.md metrics section
4. Reports new totals

---

## Helper Script

Location: `SKILLS/document-sync/assets/update-docs.sh`

```bash
#!/bin/bash
# Helper script for document-sync
# Updates metrics automatically

set -euo pipefail

AI_CORE_PATH="${AI_CORE_PATH:-/home/hectormr/personalProjects/gama/ai-core}"
cd "$AI_CORE_PATH"

# Count skills
SKILLS_COUNT=$(ls -1 SKILLS/ | grep -v "^[.]" | wc -l)
echo "Skills totales: $SKILLS_COUNT"

# Count tests
TESTS_COUNT=$(ls -1 tests/skills/*.test.md 2>/dev/null | wc -l || echo "0")
echo "Tests: $TESTS_COUNT"

# Count ADRs
ADRS_COUNT=$(ls -1 docs/adr/*.md 2>/dev/null | wc -l || echo "0")
echo "ADRs: $ADRS_COUNT"

# Count workflows
WORKFLOWS_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l || echo "0")
echo "Workflows: $WORKFLOWS_COUNT"

echo "Métricas actualizadas:"
echo "  Skills: $SKILLS_COUNT"
echo "  Tests: $TESTS_COUNT"
echo "  ADRs: $ADRS_COUNT"
echo "  Workflows: $WORKFLOWS_COUNT"
```

---

## Best Practices

1. **Run after significant changes** - Don't update on every trivial edit
2. **Verify before writing** - Check syntax and consistency
3. **Report clearly** - Show user what was changed and why
4. **Respect manual edits** - Preserve user's custom content
5. **Use tools efficiently** - Read files once, cache results
6. **Handle errors gracefully** - If one file fails, continue with others

---

## Troubleshooting

### Issue: Metrics don't match

**Solution:**
```bash
# Recount all metrics
./SKILLS/document-sync/assets/update-docs.sh

# Compare with documentation
grep "Skills totales" NEXT_STEPS.md
grep "skills" README.md
```

### Issue: Changelog has duplicates

**Solution:**
- Read CHANGELOG.md first
- Check for existing entries before adding
- Use unique identifiers (commit hash, task ID)

### Issue: NEXT_STEPS has stale [x] marks

**Solution:**
- Verify with TaskList
- Remove [x] for tasks that were reopened
- Keep only truly completed tasks marked

---

**EOF**
