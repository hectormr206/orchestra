# ADR 005: Learning System with Actor-Critic RL

## Status
Accepted

## Context
AI-Core necesita aprender de la experiencia para mejorar la selección de recursos (skills/agents). El sistema actual usa reglas estáticas que no se adaptan basadas en resultados.

## Decision
Implementar un sistema de aprendizaje por refuerzo con Actor-Critic para optimizar la orquestación.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Learning System                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Experience  │  │   Actor     │  │   Critic    │     │
│  │  Collector  │→ │   Network   │  │   Network   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         ↓                ↓                ↓             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Buffer    │  │  Policy     │  │   Value     │     │
│  │   Storage   │  │   Update    │  │   Update    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### State Representation

```python
state = {
    "task_type": "feature|bug|refactor|...",
    "task_complexity": "simple|medium|complex",
    "domain": "security|backend|frontend|...",
    "file_types": [".py", ".js", ...],
    "previous_actions": [...],
    "success_rate": float
}
```

### Reward Function

```python
reward = (
    task_completed * 10.0 +           # Task finished
    quality_score * 5.0 +              # Code quality
    (-time_taken * 0.1) +              # Speed
    (-errors_count * 2.0)              # Errors
)
```

### Training Modes

1. **Shadow**: Collect experiences without using learned policy
2. **AB Test**: 10% learned / 90% rules
3. **Production**: Full learned policy with fallback

## Consequences

### Positives
- Automatic improvement over time
- Better resource selection
- Reduced time to completion
- Higher success rates

### Negatives
- Complexity added
- Requires training data collection
- Risk of policy degradation

## Implementation
See `SKILLS/learning/SKILL.md` for full implementation details.
