# ADR 007: Multi-Project Synchronization System

## Status
Accepted

## Context
AI-Core se usa en múltiples proyectos. Necesitamos mantenerlos sincronizados con las actualizaciones del toolkit central.

## Decision
Implementar sistema de sincronización bidireccional con GitHub Actions.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Synchronization System                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ai-core (central)                                  │
│       │                                              │
│       │ .github/workflows/sync-to-projects.yml       │
│       │                                              │
│       ├─→ Project A                                  │
│       ├─→ Project B                                  │
│       └─→ Project C                                  │
│                                                      │
│  Projects notify ai-core of changes                  │
│       │                                              │
│       │ .github/workflows/notify-updates.yml         │
│       │                                              │
│       └─→ ai-core                                    │
└─────────────────────────────────────────────────────┘
```

### Sync Strategies

1. **Symlinks** (Unix): Enlaces simbólicos a SKILLS/
2. **Copies** (Windows): Copia de archivos (sin symlinks)
3. **Git Submodules**: Submodules de Git
4. **Weekly Sync**: Sincronización semanal automática

### Conflict Resolution

```yaml
Priority:
  1. Project-specific: AGENTS.md (never overwrite)
  2. Toolkit: SKILLS/, SUBAGENTS/ (update from central)
  3. Metadata: CLAUDE.md sections (merge)
```

## Consequences

### Positives
- Todos los proyectos se mantienen actualizados
- Mejoras en ai-core se distribuyen automáticamente
- Proyectos pueden contribuir de vuelta

### Negatives
- Complejidad de sincronización
- Posibles conflictos de merge
- Requiere CI/CD configurado

## Implementation
See `.github/workflows/sync-to-projects.yml` and `receive-updates.yml`.
