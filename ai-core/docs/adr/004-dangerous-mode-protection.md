# ADR-004: Dangerous Mode Protection System

**Date:** 2025-01-23
**Status:** Accepted
**Deciders:** ai-core maintainers
**Related:** [ADR-001: Orchestration Model](./001-orchestration-model.md)

---

## Context

AI assistants often run with `--dangerously-skip-permissions` flag to automate tasks. This bypasses safety checks and user confirmations, creating risks:

### Risks Identified
- **Destructive operations:** `rm -rf`, `git reset --hard`, `DROP DATABASE`
- **Security vulnerabilities:** Unvalidated commands, permission bypass
- **Data loss:** Accidental deletion, overwrites
- **System damage:** Service stops, firewall changes
- **Production impact:** Unplanned deployments, config changes

### Problem
When `--dangerously-skip-permissions` is active:
- ❌ No safety checks
- ❌ No user confirmations
- ❌ No command validation
- ❌ No risk assessment

**Impact:** Single command can cause catastrophic damage

---

## Decision

Implement a **multi-layer protection system** that remains active even in dangerous mode.

### Architecture: 3 Protection Layers

#### Layer 1: Dangerous Mode Guard (Skill)
**File:** `SKILLS/dangerous-mode-guard/SKILL.md`

**Purpose:** First line of defense
- Auto-invokes when dangerous mode detected
- Validates EVERY command before execution
- Blocks forbidden operations
- Requires confirmation for high-risk actions

**Key Features:**
```yaml
Forbidden Operations:
  - Git: push --force, reset --hard, clean -fd
  - Files: rm -rf, dd, shred
  - DB: DROP DATABASE, TRUNCATE
  - Cloud: terraform destroy, kubectl delete namespace
  - System: systemctl stop, iptables -F, chmod 777

Required Validation:
  [ ] Command analyzed and understood
  [ ] Risk level assessed (HIGH/MEDIUM/LOW)
  [ ] Checked against forbidden patterns
  [ ] User intent clear
  [ ] Safer alternatives considered
  [ ] Asked user if HIGH RISK
  [ ] Recovery plan confirmed
```

#### Layer 2: Permission Gatekeeper (Agent)
**File:** `SUBAGENTS/universal/permission-gatekeeper.md`

**Purpose:** Second line of defense
- Intercepts commands before execution
- Classifies risk (HIGH/MEDIUM/LOW)
- Blocks forbidden operations
- Asks for confirmation when needed

**Decision Tree:**
```
Command received
    │
    ├─→ Is it FORBIDDEN?
    │   ├─ YES → BLOCK and EXPLAIN
    │   └─ NO  → Continue
    │
    ├─→ Is it HIGH RISK?
    │   ├─ YES → ASK USER → Wait for confirm
    │   └─ NO  → Continue
    │
    ├─→ Is it MEDIUM RISK?
    │   ├─ Context clear? → ALLOW
    │   └─ Context unclear? → ASK USER
    │
    └─→ LOW RISK → ALLOW
```

#### Layer 3: AGENTS.md Rules
**File:** `AGENTS.md` (and `CLAUDE.md`)

**Purpose:** Always-active rules
- Embedded in project instructions
- Read by LLM before any action
- Cannot be bypassed

**Rules Section:**
```markdown
## 🚨 CRITICAL: Dangerous Mode Protection

### > **FORBIDDEN OPERATIONS** 🚫

**NEVER execute these without explicit user confirmation:**

[Full list of forbidden operations]
```

---

## Forbidden Operations List

### Git Operations
```bash
git push --force
git reset --hard
git clean -fd
git branch -D
git rebase (on shared branches)
```

### File Destruction
```bash
rm -rf /
rm -rf *
dd if=/dev/zero
shred, wipe
```

### Database Destruction
```bash
DROP DATABASE
TRUNCATE TABLE
DELETE FROM table (without WHERE)
```

### Cloud/Infrastructure
```bash
terraform destroy -auto-approve
kubectl delete namespace
docker system prune -a --volumes
aws ec2 terminate-instances
```

### System Services
```bash
systemctl stop ssh/nginx/mysql
iptables -F
ufw disable
```

### Security Compromises
```bash
chmod 777
chmod -R 777
curl http://... | bash
```

---

## Risk Classification

### HIGH RISK 🔴 (Requires user confirmation)
- Destructive operations (delete, drop, destroy)
- Force operations (git --force)
- Production system changes
- Security modifications
- Critical service stops

### MEDIUM RISK 🟡 (Verify context)
- Git commits/pushes (normal)
- File moves/copies (large quantities)
- Package installations
- Service restarts (not stop)

### LOW RISK 🟢 (Can proceed)
- Read operations (cat, less, grep)
- Status checks (git status, ps)
- Information queries
- Dry-run operations

---

## Safety Questions

Before ANY high-risk operation:
```yaml
1. 🤔 What happens if this fails?
   - Data loss? System crash? Downtime?

2. 🤔 Can this be undone?
   - Is there a rollback plan?
   - Are backups available?

3. 🤔 Is this production?
   - Are there users affected?
   - What's the blast radius?

4. 🤔 Did the user explain WHY?
   - Is context clear?
   - Should I verify understanding?

5. 🤔 Is there a safer alternative?
   - Can we do this incrementally?
   - Is there a dry-run mode?
```

---

## Error Recovery

If a dangerous command was already executed:
```yaml
1. Immediately interrupt (Ctrl+C)
2. Inform the user
3. Explain what happened
4. Suggest recovery steps
5. Document the incident
```

### Recovery Examples

#### Git Recovery
```bash
# After accidental git reset --hard
git reflog
git reset --hard HEAD@{n}
```

#### File Recovery
```bash
# After accidental rm
# Check .git/ for deleted files
git checkout HEAD~1 -- path/to/file
```

#### Database Recovery
```bash
# After accidental DROP
# Restore from backup
psql < backup.sql
```

---

## Integration with Orchestration

### Auto-Invocation Pattern

```yaml
When user runs: claude --dangerously-skip-permissions

Flow:
  1. Master Orchestrator detects flag
  2. Auto-invokes dangerous-mode-guard
  3. dangerous-mode-guard validates command
  4. If approved: executes
  5. If blocked: explains why
```

### Multi-Agent Coordination

```yaml
Example: User wants to fix security vulnerability

Orchestration:
  1. dangerous-mode-guard (validate risk) ✓
  2. security-specialist (analyze vulnerability)
  3. bug-fixer (implement fix)
  4. security-specialist (review fix)
  5. security-scanning (check for similar issues)

dangerous-mode-guard active throughout
```

---

## Consequences

### Positive
- ✅ **Safety first:** Protection even in dangerous mode
- ✅ **Validation:** All commands checked
- ✅ **Transparency:** User sees what's happening
- ✅ **Recovery:** Documented rollback procedures
- ✅ **Education:** User learns safer alternatives

### Negative
- ⚠️ **Overhead:** Extra validation takes time
- ⚠️ **False positives:** Safe commands may be blocked
- ⚠️ **User frustration:** Confirmations can be annoying
- ⚠️ **Maintenance:** Forbidden list needs updates

### Mitigations
- Smart risk classification
- Allow list for trusted commands
- Learning from patterns
- User feedback integration

---

## Alternatives Considered

### Alternative 1: No Protection in Dangerous Mode
**Pros:** Faster, no friction
**Cons:** Extremely dangerous, data loss risk
**Rejected:** Safety is paramount

### Alternative 2: User-Configurable Protection
**Pros:** Flexible
**Cons:** Easy to disable, defeats purpose
**Rejected:** Should always be safe

### Alternative 3: Allow List Only
**Pros:** Safer than block list
**Cons:** Too restrictive, hard to maintain
**Rejected:** Block list + validation better

---

## Implementation Status

### Completed ✅
- [x] dangerous-mode-guard skill created
- [x] permission-gatekeeper agent created
- [x] AGENTS.md updated with rules
- [x] CLAUDE.md updated with rules
- [x] Auto-invocation configured

### In Progress 🚧
- [ ] Testing all forbidden patterns
- [ ] Adding recovery procedures
- [ ] Documenting real-world scenarios

### Planned 📋
- [ ] User feedback integration
- [ ] Allow list for trusted commands
- [ ] Metrics on blocked commands

---

## Related Decisions

- [ADR-001: Orchestration Model](./001-orchestration-model.md) - Integration with orchestration
- [dangerous-mode-guard Skill](../SKILLS/dangerous-mode-guard/SKILL.md)
- [permission-gatekeeper Agent](../SUBAGENTS/universal/permission-gatekeeper.md)

---

## References

- [AGENTS.md](../AGENTS.md) - Protection rules
- [CLAUDE.md](../CLAUDE.md) - Protection rules

---

**Approved by:** ai-core maintainers
**Effective:** 2025-01-23
**Review date:** 2025-04-23 (quarterly)
