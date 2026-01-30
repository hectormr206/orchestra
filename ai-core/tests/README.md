# AI-Core Test Framework

Framework de pruebas para validar skills de ai-core.

## 🚀 Uso Rápido

### Ejecutar Tests de Skills

```bash
# Ejecutar todos los tests
./tests/run-skill-tests.sh

# Ejecutar un test específico
./tests/run-skill-tests.sh security
```

### Validar Skills

```bash
# Validar estructura de todos los skills
./tests/validate-skills.sh

# Validar un skill específico
./tests/validate-skills.sh security
```

## 📊 Estado Actual

| Métrica | Valor |
|---------|-------|
| **Skills totales** | 37 |
| **Tests creados** | 37 |
| **Coverage** | 100% |
| **Tests passing** | 37/37 ✅ |
| **Criterios validados** | 767 |

## 📋 Qué se Valida

Cada test de skill (`tests/skills/*.test.md`) valida:

1. **Metadata**: name, description, license, author, version, auto_invoke
2. **Secciones requeridas**: When to Use, Critical Patterns
3. **Calidad**: Longitud (>200 líneas), ejemplos, estructura
4. **Contenido**: Patrones específicos del dominio
5. **Completitud**: Related skills, auto-invocation

## 🎯 Skills Probados

### Phase 1 - Critical (5)
- ✅ security
- ✅ testing
- ✅ backend
- ✅ dangerous-mode-guard
- ✅ intent-analysis

### Phase 2 - High Priority (5)
- ✅ frontend
- ✅ database
- ✅ api-design
- ✅ git-workflow
- ✅ ci-cd

### Phase 3 - DevOps (8)
- ✅ infrastructure
- ✅ disaster-recovery
- ✅ observability
- ✅ error-handling
- ✅ code-quality
- ✅ logging
- ✅ performance
- ✅ documentation

### Phase 4 - Enterprise (4)
- ✅ compliance
- ✅ accessibility
- ✅ i18n
- ✅ audit-logging

### Phase 5 - AI & Data (2)
- ✅ ai-ml
- ✅ data-analytics

### Phase 6 - Architecture (1)
- ✅ architecture

### Phase 7 - Additional (5)
- ✅ scalability
- ✅ realtime
- ✅ feature-flags
- ✅ dependency-management
- ✅ mobile

### Phase 8 - Maintenance (3)
- ✅ dependency-updates
- ✅ security-scanning
- ✅ technical-debt

### Phase 9 - AI-Core (2)
- ✅ skill-authoring
- ✅ toolkit-maintenance

### Phase 10 - Other (2)
- ✅ finops
- ✅ developer-experience

## 🔗 CI/CD Integration

Los tests se ejecutan automáticamente en:
- `.github/workflows/skill-validation.yml`
- Trigger: Push, PR, Schedule (domingos), Manual

## 📚 Documentación Adicional

- `tests/run-skill-tests.sh` - Script de ejecución de tests
- `tests/validate-skills.sh` - Script de validación de estructura
- `tests/skills/*.test.md` - Tests individuales por skill

