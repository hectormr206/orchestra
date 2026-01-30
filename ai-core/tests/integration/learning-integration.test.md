# Integration Tests: Learning System

## Test Suite: Actor-Critic RL Integration

### Test 1: Experience Collection

**Scenario:** Task completed successfully

**Expected Flow:**
```
Task Execution
    ↓
Collect Experience:
├── State (task context)
├── Action (skills/agents used)
├── Reward (success metric)
└── Next State (result)
    ↓
Store in experience buffer
    ↓
Periodically persist to disk
```

**Validation:**
- ✅ Experience collected
- ✅ State representation complete
- ✅ Reward calculated correctly
- ✅ Persisted to data/experience_buffer/

### Test 2: Policy Improvement

**Scenario:** Multiple experiences collected

**Expected Flow:**
```
Experiences Buffer (100+ samples)
    ↓
Train Policy:
├── Actor network update
├── Critic network update
└── Loss calculation
    ↓
Save new policy
    ↓
Validate improvement
```

**Validation:**
- ✅ Policy converges
- ✅ Reward increases over time
- ✅ Better resource selection
