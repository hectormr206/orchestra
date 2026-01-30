# ADR-002: Master Orchestrator Implementation

**Date:** 2025-01-23
**Status:** Accepted
**Deciders:** ai-core maintainers
**Related:** [ADR-001: Orchestration Model](./001-orchestration-model.md)

---

## Context

After deciding on centralized orchestration (ADR-001), we needed to determine:

1. **How should the orchestrator be implemented?**
   - As a skill?
   - As a subagent?
   - As part of the LLM system itself?

2. **What responsibilities should it have?**
   - Just routing?
   - Full lifecycle management?
   - Error handling and recovery?

3. **How should it integrate with existing skills/agents?**

---

## Decision

Create a **Master Orchestrator Subagent** with the following characteristics:

### Implementation Choice: Subagent
**File:** `SUBAGENTS/universal/master-orchestrator.md`

**Why subagent vs skill:**
- Needs state management (request context)
- Requires complex decision making
- Must coordinate other agents
- Needs access to multiple tools

### Responsibilities

1. **Intent Analysis**
   - Invoke intent-analysis skill
   - Classify request type
   - Determine complexity
   - Map to resources

2. **Safety Validation**
   - Invoke dangerous-mode-guard if needed
   - Validate permissions
   - Check for forbidden operations

3. **Resource Selection**
   - Choose appropriate skills
   - Select subagents
   - Determine execution strategy

4. **Execution Coordination**
   - Launch agents sequentially or in parallel
   - Monitor progress
   - Handle errors
   - Aggregate results

5. **User Communication**
   - Explain what's happening
   - Show progress
   - Present final results

### Integration Pattern

```yaml
Auto-invocation:
  - Triggers on: "any user request"
  - Priority: HIGHEST (runs first)

Tool Access:
  - Read, AskUserQuestion, Task
  - Edit, Write, Grep, Bash

Skills Used:
  - intent-analysis (always)
  - dangerous-mode-guard (if risky)
```

---

## Decision Logic Tree

```
USER REQUEST
    │
    ├─→ Simple task (< 30 min)?
    │   ├─ YES → Direct skill invocation
    │   │         No agent needed
    │   │         Example: "Add button" → frontend skill
    │   └─ NO  → Continue
    │
    ├─→ Medium task (1-2 hours)?
    │   ├─ YES → Single agent + 2-3 skills
    │   │         Example: "Add login" → feature-creator + skills
    │   └─ NO  → Continue
    │
    └─→ Complex task (2+ hours)?
        └─ YES → Multiple agents + 5+ skills
                  Example: "Payment system" → 2-3 agents + skills
```

---

## Consequences

### Positive
- ✅ **Single entry point:** All requests go through orchestrator
- ✅ **Intelligent routing:** Best resource selection
- ✅ **Scalable:** Easy to add new skills/agents
- ✅ **Safe:** Built-in validation
- ✅ **Observable:** Clear flow and decision making

### Negative
- ⚠️ **Single point of failure:** If orchestrator fails, nothing works
- ⚠️ **Performance overhead:** Extra layer adds latency
- ⚠️ **Complexity:** More moving parts
- ⚠️ **Debugging difficulty:** Harder to trace issues

### Mitigations
- Comprehensive error handling
- Fallback to direct skill invocation
- Extensive logging and observability
- Regular testing of orchestration flow

---

## Alternatives Considered

### Alternative 1: Skill-Based Orchestrator
**Pros:** Simpler, follows existing pattern
**Cons:** Limited tool access, no state management
**Rejected:** Subagent provides better capabilities

### Alternative 2: LLM-Native Orchestration
**Pros:** Most flexible, no custom code
**Cons:** Unpredictable, expensive, slow
**Rejected:** Need deterministic, fast coordination

### Alternative 3: Manual Orchestration (User Chooses)
**Pros:** Full control, no complexity
**Cons:** Burden on user, defeats purpose
**Rejected:** Poor UX

---

## Execution Strategies

### 1. Direct (Simple Tasks)
```yaml
Use: Tasks < 30 min
Method: Invoke skill directly
Example: "Add comment" → documentation skill
No agent involved
```

### 2. Sequential (Dependent Tasks)
```yaml
Use: Tasks with dependencies
Method: Agent A → Agent B → Agent C
Example: "Feature with DB + API + UI"
Agents execute in order
```

### 3. Parallel (Independent Tasks)
```yaml
Use: Independent subtasks
Method: Agent A + Agent B (simultaneous)
Example: "Review PR + run tests"
Agents execute independently
```

### 4. Coordinated (Complex Tasks)
```yaml
Use: Multi-phase workflows
Method: Orchestrator manages 2+ agents
Example: "Payment system with security"
Orchestrator coordinates all phases
```

---

## Error Handling

### Strategy: Graceful Degradation

```yaml
If orchestration fails:
  1. Log error details
  2. Inform user of failure
  3. Offer fallback options
  4. Attempt direct skill invocation
  5. Request clarification if needed

If agent fails:
  1. Capture error from agent
  2. Assess impact
  3. Rollback if needed
  4. Retry with different approach
  5. Inform user of resolution
```

---

## Metrics & Observability

### Track These Metrics

```yaml
Orchestration Metrics:
  - Requests per day
  - Average orchestration time
  - Direct vs agent vs multi-agent split
  - Error rate by strategy

Resource Selection:
  - Most used skills
  - Most used agents
  - Accuracy of intent classification
  - User satisfaction

Performance:
  - Orchestration overhead (ms)
  - End-to-end latency
  - Agent execution time
  - Skill invocation time
```

---

## Implementation Status

### Completed ✅
- [x] Master orchestrator subagent created
- [x] Intent analysis skill created
- [x] Integration with AGENTS.md
- [x] Integration with CLAUDE.md
- [x] Auto-invocation configured

### In Progress 🚧
- [ ] Context memory implementation
- [ ] Learning from patterns
- [ ] Metrics dashboard

### Planned 📋
- [ ] Parallel execution optimization
- [ ] Predictive caching
- [ ] Self-healing mechanisms

---

## Related Decisions

- [ADR-001: Orchestration Model](./001-orchestration-model.md) - High-level model
- [ADR-003: Ghost Debt Detection](./003-ghost-debt-detection.md) - Detection of invisible debt

---

## References

- [SUBAGENTS/universal/master-orchestrator.md](../SUBAGENTS/universal/master-orchestrator.md)
- [SKILLS/intent-analysis/SKILL.md](../SKILLS/intent-analysis/SKILL.md)
- [ORCHESTRATOR_PROPOSAL.md](../ORCHESTRATOR_PROPOSAL.md)

---

**Approved by:** ai-core maintainers
**Effective:** 2025-01-23
**Review date:** 2025-04-23 (quarterly)
