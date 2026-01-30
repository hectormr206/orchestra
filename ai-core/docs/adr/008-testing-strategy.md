# ADR 008: Testing Strategy

## Status
Accepted

## Context
AI-Core tiene 39+ skills. Necesitamos una estrategia clara de testing para asegurar calidad.

## Decision
Implementar Test Pyramid con 4 niveles de tests.

### Test Pyramid

```
              E2E
             /   \
            /     \
           /       \
          /_________\
         / Integration \
        /______________\
       /   Unit Tests    \
      /___________________\
```

### Levels

1. **Unit Tests** (Base pirámide - 70%)
   - Test individual skills
   - Mock dependencies
   - Fast execution

2. **Integration Tests** (20%)
   - Test skill interactions
   - Real dependencies
   - Medium speed

3. **Validation Tests** (5%)
   - Validate skill structure
   - Check frontmatter
   - Verify required sections

4. **E2E Tests** (Top - 5%)
   - Complete workflows
   - Real scenarios
   - Slow but comprehensive

### Test Files

```bash
tests/
├── skills/              # Unit tests per skill
│   ├── security.test.md
│   ├── backend.test.md
│   └── ...
├── integration/         # Integration tests
│   ├── skill-interactions.test.md
│   └── ...
├── validation/          # Validation tests
│   ├── skill-structure.test.md
│   └── ...
└── e2e/                 # E2E scenarios
    ├── complete-workflow.test.md
    └── ...
```

### Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Unit | 100% | 95% |
| Integration | 80% | 60% |
| Validation | 100% | 100% |
| E2E | 10 scenarios | 5 |

### CI/CD Integration

```yaml
# .github/workflows/test.yml
on: [push, pull_request]

jobs:
  test:
    steps:
      - Run unit tests (fast)
      - Run integration tests
      - Run validation tests
      - Run E2E tests (on main only)
```

## Consequences

### Positives
- Confianza en cambios
- Bugs detectados temprano
- Documentación viva (tests = examples)

### Negatives
- Tiempo de mantenimiento
- Tests que rompen (flaky)

## Implementation
See `tests/README.md` for full testing documentation.
