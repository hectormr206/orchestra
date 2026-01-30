# ADR-001: AI-CORE Orchestration Model

**Date:** 2025-01-23
**Status:** Accepted
**Deciders:** ai-core maintainers
**Related:** [ADR-002: Master Orchestrator](./002-master-orchestrator.md)

---

## Context

ai-core needed a unified way to coordinate 37+ skills and 20+ subagents. The initial approach relied on:

- Manual skill selection by users
- Keyword-based auto-invocation
- No central coordination
- Fragmented responses across multiple agents

Problems:
- Users had to know which skill to use
- No multi-agent coordination
- Difficulty handling complex tasks
- Repetitive code patterns

---

## Decision

Implement a **centralized intelligent orchestration model** with three layers:

### Layer 1: Master Orchestrator (Subagent)
- **File:** `SUBAGENTS/universal/master-orchestrator.md`
- **Role:** Central coordinator for ALL requests
- **Function:**
  - Analyzes user intent
  - Selects appropriate skills/agents
  - Coordinates execution
  - Aggregates results

### Layer 2: Intent Analysis (Skill)
- **File:** `SKILLS/intent-analysis/SKILL.md`
- **Role:** Understands what the user needs
- **Function:**
  - Classifies task type (feature, bug, refactor, etc.)
  - Identifies domain (frontend, backend, security, etc.)
  - Determines complexity (simple, medium, complex)
  - Maps to required resources

### Layer 3: Safety Validation
- **File:** `SKILLS/dangerous-mode-guard/SKILL.md`
- **Role:** Protects against dangerous operations
- **Function:**
  - Validates commands before execution
  - Blocks forbidden operations
  - Requires confirmation for high-risk actions

### Flow:
```
User Request
    ↓
Intent Analysis (classify)
    ↓
Safety Check (validate)
    ↓
Resource Selection (map)
    ↓
Execution (coordinate)
    ↓
Results (aggregate)
```

---

## Consequences

### Positive
- ✅ **Better UX:** Users just describe what they need, no need to choose skills
- ✅ **Intelligent routing:** Automatic selection of best skills/agents
- ✅ **Multi-agent coordination:** Multiple agents can work together
- ✅ **Safety first:** All operations validated before execution
- ✅ **Scalability:** Easy to add new skills/agents
- ✅ **Consistency:** Same orchestration pattern across all requests

### Negative
- ⚠️ **Complexity:** More components to maintain
- ⚠️ **Learning curve:** Team needs to understand orchestration model
- ⚠️ **Performance:** Extra orchestration layer adds overhead
- ⚠️ **Debugging:** Harder to debug when orchestration fails

### Mitigations
- Comprehensive documentation
- Clear separation of concerns
- Monitoring and observability
- Fallback to direct skill invocation when needed

---

## Alternatives Considered

### Alternative 1: No Orchestration (Current State)
**Pros:** Simple, direct
**Cons:** Users must choose skills, no coordination
**Rejected:** Poor UX for complex tasks

### Alternative 2: Rule-Based Routing
**Pros:** Predictable, fast
**Cons:** Brittle, hard to maintain
**Rejected:** Doesn't scale with new skills/agents

### Alternative 3: AI-Based Routing (LLM)
**Pros:** Most flexible, learns patterns
**Cons:** Expensive, slower, unpredictable
**Rejected:** Overkill for current needs

### Alternative 4: User-Selected Skills
**Pros:** Full control
**Cons:** Burden on user, no coordination
**Rejected:** Defeats purpose of intelligent assistance

---

## Implementation

### Phase 1: Core (Completed)
- [x] Create intent-analysis skill
- [x] Create master-orchestrator agent
- [x] Update AGENTS.md with orchestration section
- [x] Update CLAUDE.md with orchestration section

### Phase 2: Enhancement (Planned)
- [ ] Add context memory across requests
- [ ] Implement learning from patterns
- [ ] Add orchestration metrics
- [ ] Create fallback mechanisms

### Phase 3: Optimization (Future)
- [ ] Parallel agent execution
- [ ] Smart caching
- [ ] Predictive resource selection
- [ ] Self-healing orchestration

---

## Related Decisions

- [ADR-002: Master Orchestrator](./002-master-orchestrator.md) - Details of orchestrator implementation
- [ADR-004: Dangerous Mode Protection](./004-dangerous-mode-protection.md) - Safety layer

---

## References

- [ORCHESTRATOR_PROPOSAL.md](../ORCHESTRATOR_PROPOSAL.md) - Original proposal
- [SUBAGENTS/universal/master-orchestrator.md](../SUBAGENTS/universal/master-orchestrator.md)
- [SKILLS/intent-analysis/SKILL.md](../SKILLS/intent-analysis/SKILL.md)

---

**Approved by:** ai-core maintainers
**Effective:** 2025-01-23
**Review date:** 2025-04-23 (quarterly)
