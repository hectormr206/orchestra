# Plan de Mantenimiento y Actualizaciones - ai-core

> **Fecha**: 2025-01-22
> **Objetivo**: Sistema automático para mantener ai-core y proyectos actualizados
> **Filosofía**: "Zero Touch Maintenance" - Mantenimiento automático y proactivo

---

## 📑 Table of Contents

### Foundation
- [Visión General](#-visión-general)
- [Estructura del Plan](#-estructura-del-plan)
- [Enfoque](#-enfoque)

### Phase 1: Auto-Actualización
- [Componentes](#componentes-principales)
- [Workflow](#workflow-de-auto-actualización)
- [Versionado](#sistema-de-versionado)

### Phase 2: Subagente
- [maintenance-coordinator](#subagente-de-mantenimiento)
- [Responsabilidades](#responsabilidades)

### Phase 3: Skills
- [dependency-updates](#skills-de-mantenimiento)
- [technical-debt](#technical-debt)
- [security-scanning](#security-scanning)

### Phase 4: Integración
- [Proyectos](#integración-con-proyectos)
- [Notificaciones](#sistema-de-notificaciones)
- [Monitoreo](#monitoreo-y-reportes)

### Appendices
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Changelog](#changelog)

---

## 🎯 Visión General

### Problema a Resolver

1. **ai-core se desactualiza**: Los proyectos no reciben actualizaciones automáticas
2. **Dependencias obsoletas**: Librerías sin mantenimiento crecen sin control
3. **Deuda técnica**: Se acumula sin sistema de detección
4. **Problemas futuros**: Librerías abandonadas causan problemas a largo plazo
5. **Actualizaciones manuales**: Proceso tedioso y propenso a errores

### Solución Propuesta

Sistema integrado de 4 componentes:

1. **Auto-Actualización de ai-core** - El propio ai-core se mantiene actualizado
2. **Subagente de Mantenimiento** - Agente especializado en actualizaciones y debt management
3. **Skills de Mantenimiento** - Patrones para gestión de dependencias y deuda técnica
4. **Sistema de Monitoreo** - Detección proactiva de problemas

---

## 📁 Estructura del Plan

```
MAINTENANCE_PLAN.md                  ← Este archivo (plan maestro)
│
├── FASE 1: Auto-Actualización de ai-core
│   ├── Workflow de auto-update
│   ├── Sistema de versionado
│   └── Changelog automático
│
├── FASE 2: Subagente de Mantenimiento
│   ├── maintenance-coordinator.md
│   └── Capabilidades del agente
│
├── FASE 3: Skills de Mantenimiento
│   ├── dependency-updates/SKILL.md
│   ├── technical-debt/SKILL.md
│   ├── security-scanning/SKILL.md
│   └── dependency-management/SKILL.md (actualizar existente)
│
└── FASE 4: Integración y Monitoreo
    ├── Dashboards de métricas
    ├── Alertas automáticas
    └── Reports de mantenimiento
```

---

## 🚀 FASE 1: Auto-Actualización de ai-core

### 1.1 Workflow de Auto-Update (Self-Updating System)

**Archivo**: `.github/workflows/self-update.yml`

**Propósito**: ai-core se actualiza automáticamente desde upstream

```yaml
name: ai-core Self-Update

on:
  schedule:
    - cron: '0 0 * * 0'  # Cada domingo a medianoche
  workflow_dispatch:      # Manual trigger

jobs:
  self-update:
    runs-on: ubuntu-latest
    steps:
      - name: Check for updates
        id: check-updates
        run: |
          git fetch origin main
          LOCAL=$(git rev-parse HEAD)
          REMOTE=$(git rev-parse origin/main)
          if [ $LOCAL != $REMOTE ]; then
            echo "updates_available=true" >> $GITHUB_OUTPUT
          fi

      - name: Auto-merge updates
        if: steps.check-updates.outputs.updates_available == 'true'
        run: |
          git merge origin/main --no-edit
          git push
```

**Características**:
- ✅ Verificación semanal automática
- ✅ Merge automático si no hay conflictos
- ✅ Notificación si hay conflictos
- ✅ Changelog automático

---

### 1.2 Sistema de Versionado Semántico

**Archivo**: `.version`

**Formato**:
```
v1.2.3
│ │ │
│ │ └─ PATCH: Bug fixes, pequeños cambios
│ └── MINOR: Nuevas features backward-compatible
└──── MAJOR: Cambios breaking changes
```

**Reglas**:
1. **PATCH** (+0.0.1): Corrección de bugs, pequeños ajustes
2. **MINOR** (+0.1.0): Nuevos skills/subagentes, mejoras
3. **MAJOR** (+1.0.0): Cambios estructurales, scripts eliminados

---

### 1.3 Changelog Automático

**Workflow**: `.github/workflows/changelog.yml`

**Genera**: `CHANGELOG.md` automáticamente con cada release

```markdown
# Changelog

## [1.2.3] - 2025-01-22

### Added
- New skill: technical-debt
- New agent: maintenance-coordinator

### Changed
- Updated dependency-management skill
- Improved run.sh performance

### Fixed
- Fixed symlink detection on Windows

### Deprecated
- init-ai-core-project.sh (use run.sh instead)

### Removed
- scripts/ directory (maximum simplification)
```

---

## 🤖 FASE 2: Subagente de Mantenimiento

### 2.1 Agente: maintenance-coordinator

**Archivo**: `SUBAGENTS/workflow/maintenance-coordinator.md`

**Propósito**: Coordinar todas las tareas de mantenimiento del proyecto

**Capacidades**:

#### A. Detección de Dependencias Obsoletas

```bash
# Ejemplo de lo que hace el agente
npm outdated
yarn outdated
pip list --outdated
cargo outdated
```

**Salida**:
```markdown
## Dependencias Obsoletas Detectadas

| Paquete | Actual | Latest | Tipo | Urgencia |
|---------|--------|--------|------|----------|
| react   | 18.2.0 | 18.3.0 | minor | Baja     |
| lodash  | 4.17.21| 4.17.22| patch | Baja     |
| axios   | 1.5.0  | 1.6.0  | minor | Media    |
| uuid    | 9.0.0  | 10.0.0 | major | Alta     |
```

#### B. Análisis de Librerías No Mantenidas

```python
# Ejemplo de lógica del agente
def check_package_health(package_name):
    last_commit = get_last_commit_date(package_name)
    last_release = get_last_release_date(package_name)
    open_issues = get_open_issues(package_name)
    open_prs = get_open_prs(package_name)
    stars = get_github_stars(package_name)
    weekly_downloads = get_weekly_downloads(package_name)

    # Criterios de "abandonado" - Basados en mejores prácticas de la industria
    if last_commit > 180 days and open_prs == 0 and open_issues > 50:
        return "CRÍTICO - ABANDONADO"
    if last_release > 365 days:  # 1 año sin release (estándar de la industria)
        return "ALERTA - ESTANCADO"
    if weekly_downloads < 1000 and stars < 100:
        return "RIESGO - POCA ADOPCIÓN"
    if last_commit > 90 days and open_issues > 100:
        return "PREOCUPANTE - NO MANTENIDO"

    return "ACTIVO"
```

**📊 Umbrales Basados en Mejores Prácticas**:

| Criterio | Umbral | Justificación | Fuente |
|----------|--------|----------------|--------|
| Último release | 180-365 días | Librerías activas releases cada 3-6 meses | Tidelift, npm |
| Último commit | 90-180 días | Commits recientes indican mantenimiento | GitHub, Open Source Stats |
| Issues abiertos sin respuesta | >50-100 | Montón de issues sin atender = abandoned | React, Vue, Angular |
| PRs abiertos sin merge | >10 | PRs acumulados = mantenimiento lento | Best practices |
| Descargas semanales | <1000 | Baja adopción = riesgo de abandono | npm trends |

**Referencias de la Industria**:
- **npm**: Recomienda actualizar paquetes sin commits en 6 meses+
- **Tidelift**: Monitorea paquetes con >180 días de inactividad
- **GitHub Archive**: Considera "inactive" después de 6 meses sin commits
- **Best Practice**: 90 días sin commits = WARNING, 180 días = CRITICAL

**Salida**:
```markdown
## 📦 Health Check de Dependencias

🔴 **CRÍTICO - Reemplazar urgentemente**

| Paquete | Último Release | Último Commit | Issues | PRs | Estado | Acción |
|---------|---------------|---------------|--------|-----|--------|--------|
| old-lib | 2022-05-10 | 2022-05-10 | 234 | 12 | 🔴 ABANDONADO (2+ años) | Migrar inmediatamente |

🟡 **ALERTA - Monitorear y planificar migración**

| Paquete | Último Release | Último Commit | Issues | PRs | Estado | Acción |
|---------|---------------|---------------|--------|-----|--------|--------|
| stale-lib | 2024-08-01 (6m) | 2024-08-01 | 78 | 5 | 🟡 ESTANCADO | Buscar alternativa Q2 |
| slow-lib | 2024-09-15 (4m) | 2024-10-01 | 120 | 0 | 🟡 NO MANTENIDO | Planificar migración |

🟢 **RIESGO - Evaluar alternativas**

| Paquete | Último Release | Último Commit | Descargas/Semana | Stars | Estado | Acción |
|---------|---------------|---------------|-----------------|-------|--------|--------|
| tiny-lib | 2024-10-01 | 2024-10-15 | 450 | 45 | 🟢 POCA ADOPCIÓN | Considerar alternativas |
```

#### C. Actualización de Dependencias

**🔄 Estrategia: Actualizaciones Seguras con Testing Automático**

```bash
# Flujo completo de actualización (automatizado por el agente)

# Paso 1: Crear rama de actualización
git checkout -b feat/dependency-updates-$(date +%Y%m%d)

# Paso 2: Actualizar TODO (patch, minor, major)
npm update  # Actualiza todo lo que sea compatible

# Paso 3: Ejecutar tests completos
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e            # E2E tests
npm run build              # Verificar que build funciona

# Paso 4: Análisis de cambios
npx npm-check-updates -u  # Ver qué se actualizó
git diff package.json     # Revisar cambios manualmente

# Paso 5: Si todo pasa, crear PR
git push origin feat/dependency-updates-$(date +%Y%m%d)
gh pr create --title "chore: update dependencies (automated testing passed)"
```

**🤖 Flujo Automático del Agente**:

```markdown
## 🔄 Flujo de Actualización de Dependencias

### 1️⃣ DETECCIÓN
El agente detecta dependencias desactualizadas:
- npm outdated
- npx npm-check-updates
- Dependabot alerts

### 2️⃣ ANÁLISIS DE IMPACTO
Para cada dependencia:
```markdown
| Paquete | De → Para | Tipo | Breaking Changes | Riesgo |
|---------|----------|------|------------------|--------|
| react   | 18.2.0 → 19.0.0 | major | Sí | Alto |
| lodash  | 4.17.21 → 4.17.22 | patch | No | Bajo |
| axios   | 1.5.0 → 1.6.0 | minor | No | Medio |
```

### 3️⃣ CREACIÓN DE RAMA
```bash
git checkout -b feat/dependency-updates-20250122
```

### 4️⃣ ACTUALIZACIÓN
```bash
# Actualizar TODO
npx npm-check-updates -u
npm install

# Actualizar lockfiles
npm install --package-lock-only
```

### 5️⃣ TESTING AUTOMÁTICO

```bash
# Ejecutar suite de tests
npm test -- --coverage          # Unit tests + coverage
npm run test:integration       # Integration tests
npm run test:e2e                # E2E tests
npm run build                  # Build verification
npm run lint                   # Linting

# Si ALGUN test falla:
# → Abortar actualización
# → Notificar al equipo
# → Crear issue sobre el problema
```

### 6️⃣ VERIFICACIÓN FUNCIONAL

```bash
# Verificar que la app funcione
npm start &  # Iniciar aplicación
sleep 10

# Health checks
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:3000/api/status || exit 1

# Verificar funcionalidad crítica
npm run test:smoke  # Tests humo de funcionalidad básica

# Si ALGO falla:
# → Rollback automático
# → Notificar al equipo
# → NO crear PR
```

**🔄 Rollback Automático en Caso de Fallo**:

```bash
# Script de rollback automático
#!/bin/bash

rollback_on_failure() {
    echo "❌ Test/Build falló. Iniciando rollback..."

    # Restaurar package.json y package-lock.json del backup
    cp package.json.backup package.json
    cp package-lock.json.backup package-lock.json

    # Reinstalar versiones anteriores
    npm ci

    # Verificar que rollback funcionó
    npm test || {
        echo "🚨 CRÍTICO: Rollback falló. Intervención manual requerida."
        exit 1
    }

    echo "✅ Rollback exitoso. Restaurando estado original..."
    git checkout package.json package-lock.json
    git status

    # Notificar al equipo
    gh issue create \
        --title "❌ Dependency Update Failed - Rolled Back" \
        --body "## Update Failed

**Branch**: feat/dependency-updates-$(date +%Y%m%d)
**Failed at**: $(date)

### Error
\`\`\`
$(npm test 2>&1 | tail -50)
\`\`\`

### Action Taken
Automated rollback executed. Original versions restored.

### Next Steps
- [ ] Investigate failure
- [ ] Fix compatibility issues
- [ ] Retry update when resolved" \
        --label "failed-update,rollback"

    # Eliminar rama fallida
    git checkout main
    git branch -D feat/dependency-updates-$(date +%Y%m%d)

    exit 1
}

# Usar en cada paso crítico
npm test || rollback_on_failure
npm run build || rollback_on_failure
npm run test:smoke || rollback_on_failure
```

### 7️⃣ CREACIÓN DE PR (Solo si todo pasa)

```bash
git add .
git commit -m "chore: update dependencies

Updated packages:
- react@18.2.0 → 19.0.0 (major)
- lodash@4.17.21 → 4.17.22 (patch)
- axios@1.5.0 → 1.6.0 (minor)

Testing:
✅ Unit tests: PASSED (coverage: 85%)
✅ Integration tests: PASSED
✅ E2E tests: PASSED
✅ Build: SUCCESS
✅ Lint: PASSED
✅ Smoke tests: PASSED

Co-authored-by: maintenance-coordinator <ai-core>"

git push origin feat/dependency-updates-20250122

# Crear PR con template
gh pr create \
  --title "chore: update dependencies (automated testing passed)" \
  --body "$(cat .github/PULL_REQUEST_TEMPLATE.md)"
```

### 8️⃣ REVISIÓN MANUAL

```markdown
## PR para Revisión Manual

### Resumen
Actualización de 3 dependencias con testing completo pasado.

### Cambios
- react: 18.2.0 → 19.0.0 (major)
- lodash: 4.17.21 → 4.17.22 (patch)
- axios: 1.5.0 → 1.6.0 (minor)

### Testing
✅ Todos los tests pasaron (312 tests)
✅ Coverage: 85% (+2%)
✅ Build: Exitoso
✅ Funcionalidad verificada

### Breaking Changes
**react 19.0.0**:
- React.PropTypes movido a paquete separado
- Some deprecated APIs removed

### Acción Requerida
👀 Revisar changelog de react 19
🧪 Testing manual recomendado
✅ Aprobar si todo parece correcto
```

### 9️⃣ MERGE A MAIN (Solo con aprobación)

```bash
# Solo después de aprobación manual
git checkout main
git merge feat/dependency-updates-20250122
git push origin main
```

### 🔟 LIMPIEZA

```bash
# Eliminar rama
git branch -d feat/dependency-updates-20250122
git push origin --delete feat/dependency-updates-20250122
```

---

## 📊 Matriz de Decisión de Actualización

| Scenario | Acción | Testing Requerido | Aprobación Manual |
|----------|--------|-------------------|-------------------|
| Patch updates | Automático | Unit + Build | No |
| Minor updates | Automático | Unit + Integration + E2E | No (si tests pasan) |
| Major updates | Automático | Full suite + Smoke | **SÍ, siempre** |
| Tests fallan | Abortar | - | Notificar equipo |
| Vulnerabilidades | Inmediato | Full suite | SÍ (security review) |

---

## 🎯 Garantías del Sistema

### ✅ SIEMPRE se hace antes de actualizar

1. **Backup de package.json y package-lock.json**
2. **Creación de rama separada**
3. **Git tag antes de actualizar** (`git tag pre-update-$(date +%Y%m%d)`)

### ✅ SIEMPRE se ejecuta después de actualizar

1. **Suite completa de tests** (Unit + Integration + E2E)
2. **Build verification**
3. **Smoke tests de funcionalidad crítica**
4. **Linting y type checking**

### ✅ NUNCA se hace merge si

1. **Cualquier test falló**
2. **Build falló**
3. **Smoke tests fallaron**
4. **No hubo aprobación manual (para major updates)**
```

#### D. Reducción de Superficie de Ataque

**Análisis de librerías innecesarias**:

```bash
# Detectar librerías instaladas pero no usadas
npx depcheck  # JavaScript
pipreqs       # Python
cargo udeps   # Rust
```

**Salida**:
```markdown
## Librerías No Utilizadas Detectadas

🗑️ **SAFE TO REMOVE** (Sin referencias encontradas)

| Librería | Tamaño | Ahorro anual | Acción |
|----------|--------|--------------|--------|
| moment-timezone | 245 KB | - | Eliminar (usar date-fns) |
| left-pad | 2 KB | - | Eliminar (ya incluido en lodash) |
| unused-dep | 45 KB | - | Eliminar |

💰 **TOTAL AHORRADO**: 292 KB reducidos, 3 dependencias menos
```

#### E. Security Scanning

**Integración con herramientas de seguridad**:

```bash
npm audit
snyk test
github security alerts
```

**Salida**:
```markdown
## 🚨 Alertas de Seguridad

### CRÍTICO - Actualizar Inmediatamente

| Vulnerabilidad | Severidad | Paquete | Versión | Fix En |
|----------------|-----------|---------|---------|--------|
| CVE-2025-12345 | CRITICAL | axios | 1.5.0 | 1.6.1  |
| CVE-2025-67890 | HIGH | lodash | 4.17.20 | 4.17.21 |

### Acción Automática del Agente
✅ PR creado: "fix: update axios to 1.6.1 (security)"
✅ Tests ejecutados: Pasando
✅ Listo para merge
```

#### F. Debt Tracking

**Métricas de deuda técnica**:

```markdown
## 📊 Debt Score del Proyecto

| Categoría | Score | Tendencia | Umbral | Estado |
|-----------|-------|-----------|---------|--------|
| Security | 85/100 | ⬆️ Mejorando | >70 | ✅ Bien |
| Dependencies | 45/100 | ⬇️ Empeorando | >60 | ⚠️ Requiere atención |
| Code Quality | 70/100 | ➡️ Estable | >65 | ✅ Aceptable |
| Test Coverage | 60/100 | ⬆️ Mejorando | >70 | ⚠️ Mejorar |
| Documentation | 80/100 | ➡️ Estable | >70 | ✅ Bien |

**Debt Score Global**: 68/100 ⚠️ Aceptable pero mejorable

### Recomendaciones Prioritarias

1. 🔴 **ALTA**: Actualizar axios (CVE-2025-12345)
2. 🟡 **MEDIA**: Reducir dependencias de 45 a <40
3. 🟢 **BAJA**: Mejorar test coverage de 60% a 70%
```

---

## 📚 FASE 3: Skills de Mantenimiento

### 3.1 Skill: dependency-updates

**Archivo**: `SKILLS/dependency-updates/SKILL.md`

**Propósito**: Patrones para mantener dependencias actualizadas

**Contenido**:

```markdown
## When to Use

- Dependencias están desactualizadas
- Necesitas actualizar librerías
- Planeas migrar a versiones mayores

## Critical Patterns

### ALWAYS

1. **Actualizar patch versions automáticamente**
   ```bash
   npm update patch  # Seguro, sin breaking changes
   ```

2. **Revisar changelogs antes de actualizar minor/major**
   ```bash
   # Ver cambios entre versiones
   npx npm-check-updates -u
   ```

3. **Ejecutar tests después de cada actualización**
   ```bash
   npm update
   npm test
   ```

4. **Usar lockfiles (package-lock.json, yarn.lock)**
   ```bash
   # Actualizar lockfile
   npm install --package-lock-only
   ```

### NEVER

1. **NUNCA actualizar major versions sin revisión manual**
2. **NUNCA actualizar en producción sin testing**
3. **NUNCA ignorar alertas de seguridad**

## Update Strategy

### 1. Patch Updates (Automático)
- Sin breaking changes
- Sin riesgo de compatibilidad
- Se pueden aplicar automáticamente

### 2. Minor Updates (Semi-automático)
- Requieren revisión de changelog
- Requieren testing
- Aplicar después de validar

### 3. Major Updates (Manual)
- Requieren análisis de impacto
- Requieren plan de migración
- Requieren testing exhaustivo

## Tools

- **npm outdated** - Detectar versiones desactualizadas
- **npm-check-updates** - Ver actualizaciones disponibles
- **npm audit** - Detectar vulnerabilidades
- **Dependabot** - PRs automáticos de actualización
- **Renovate** - Alternativa a Dependabot
```

---

### 3.2 Skill: technical-debt

**Archivo**: `SKILLS/technical-debt/SKILL.md`

**Propósito**: Identificar, trackear y reducir deuda técnica

**Contenido**:

```markdown
## When to Use

- Necesitas medir deuda técnica
- Planeas refactorizar código
- Quieres priorizar tareas de mantenimiento

## Critical Patterns

### ALWAYS

1. **Medir deuda técnica regularmente**
   - Code climate
   - SonarQube
   - Lighthouse (for frontend)

2. **Priorizar debt por impacto**
   - Alto impacto, bajo esfuerzo → Hacer ahora
   - Alto impacto, alto esfuerzo → Planificar
   - Bajo impacto, bajo esfuerzo → Hacer cuando sea posible
   - Bajo impacto, alto esfuerzo → No hacer

3. **Documentar decisiones de deuda técnica**
   ```markdown
   ## Debt: Using old-lib instead of new-lib

   **Why**: Migración requiere 2 semanas de trabajo
   **Impact**: Medium (performance 20% slower)
   **Plan**: Migrar en Q2 2025
   **Owner**: @team
   ```

### NEVER

1. **NUNCA ignorar deuda de seguridad**
2. **NUNCA acumular debt sin plan de pago**
3. **NUNCA añadir debt sin documentarlo**

## Debt Categories

### 1. Security Debt
- Vulnerabilidades conocidas
- Dependencias desactualizadas
- Malas prácticas de seguridad

### 2. Performance Debt
- Código no optimizado
- Falta de caching
- Queries ineficientes

### 3. Maintainability Debt
- Código duplicado
- Complejidad ciclomática alta
- Falta de tests

### 4. Scalability Debt
- Monolito cuando se necesita microservicios
- Falta de índices en DB
- No usar colas para tareas asíncronas

## Debt Score Calculation

```
Total Debt Score = (Security + Performance + Maintainability + Scalability) / 4

Ranges:
- 90-100: Excelente
- 70-89: Bueno
- 50-69: Aceptable
- 30-49: Requiere atención
- 0-29: Crítico
```

## Tools

- **SonarQube** - Debt measurement
- **Code Climate** - Quality metrics
- **Lighthouse** - Performance debt
- **GitHub Advanced Security** - Vulnerability scanning
```

---

### 3.3 Skill: security-scanning

**Archivo**: `SKILLS/security-scanning/SKILL.md`

**Propósito**: Escaneo continuo de vulnerabilidades

**Contenido**:

```markdown
## When to Use

- Antes de cada release
- Semanalmente en desarrollo
- Cuando se agregan nuevas dependencias

## Critical Patterns

### ALWAYS

1. **Ejecutar escaneo de seguridad regularmente**
   ```bash
   npm audit
   snyk test
   github security scanning
   ```

2. **Revisar alertas de dependencias**
   - GitHub Dependabot alerts
   - Snyk notifications
   - npm audit warnings

3. **Actualizar dependencias vulnerables INMEDIATAMENTE**
   ```bash
   npm audit fix
   npm audit fix --force  # Solo si entiendes el impacto
   ```

### NEVER

1. **NUNCA ignorar vulnerabilidades CRITICAL/HIGH**
2. **NUNCA hacer deploy con vulnerabilidades conocidas**
3. **NUNCA usar librerías sin revisar seguridad**

## Scanning Tools

### 1. npm audit (JavaScript)
```bash
npm audit           # Ver vulnerabilidades
npm audit fix       # Arreglar automáticamente
npm audit --json    # Output JSON para CI/CD
```

### 2. Snyk (Multi-lenguaje)
```bash
snyk test          # Escanear proyecto
snyk monitor        # Monitoreo continuo
snyk wizard         # Configuración interactiva
```

### 3. GitHub Security
- Dependabot
- Code scanning
- Secret scanning
- Container scanning

## Vulnerability Severity

| Severity | SLA de Reparación | Ejemplo |
|----------|-------------------|---------|
| CRITICAL | 24 horas | RCE, SQL Injection |
| HIGH | 7 días | XSS, Auth bypass |
| MEDIUM | 30 días | CSRF, DoS |
| LOW | 90 días | Info disclosure |
```

---

### 3.4 Actualizar: dependency-management (ya existe)

**Archivo**: `SKILLS/dependency-management/SKILL.md`

**Agregar nuevas secciones**:

```markdown
## Minimal Dependencies Strategy

### Goal: Mantener el mínimo de dependencias posibles

### Strategy

1. **Preferir librerías estándar del lenguaje**
   ```javascript
   // ❌ Evitar
   import isNull from 'lodash.isnull';

   // ✅ Usar nativo
   const isNull = (value) => value === null;
   ```

2. **Preferir librerías con mantenimiento activo**
   - Último release: < 6 meses
   - Issues respondidos: < 30 días
   - PRs mergeados regularmente

3. **Evitar dependencias innecesarias**
   ```bash
   # Detectar librerías no usadas
   npx depcheck
   ```

4. **Usar monorepos cuando sea posible**
   - Turborepo
   - Nx
   - Reduced dependencies through workspace sharing

## Dependency Health Check

### Checklist para nuevas dependencias

- [ ] ¿Es realmente necesaria?
- [ ] ¿Tiene mantenimiento activo?
- [ ] ¿Tiene buen momentum (stars, downloads)?
- [ ] ¿Tiene licencia compatible?
- [ ] ¿Tiene security scanning?
- [ ] ¿Hay alternativas más ligeras?
- [ ] ¿El tamaño es aceptable?

### Alternativas Ligeras Comunes

| En lugar de | Usar | Ahorro |
|------------|------|--------|
| moment.js | date-fns | -67% |
| lodash | Nativo + utils pequeños | -80% |
| axios | fetch nativo | -100% |
| bootstrap | Tailwind CSS | -50% |
```

---

## 📊 FASE 4: Integración y Monitoreo

### 4.1 Dashboard de Métricas

**Archivo**: `.github/workflows/metrics.yml`

**Genera**: Gráficos en README.md

```markdown
## 📊 Maintenance Metrics

![Dependency Status](https://img.shields.io/badge/dependencies-41-success)
![Security Score](https://img.shields.io/badge/security-92%25-brightgreen)
![Debt Score](https://img.shields.io/badge/debt-68%25-yellow)
![Last Update](https://img.shields.io/badge/last%20update-2025--01--22-blue)

### Dependency Health

- ✅ Total dependencies: 41
- ⚠️ Outdated: 3
- 🔴 Vulnerabilities: 0
- 📦 Size: 2.4 MB (tree-shaking)

### Debt Trends

```
Week 1: ████████████████████ 72%
Week 2: ██████████████████  68%
Week 3: ██████████████████   67%
Week 4: ███████████████████  70%
```
```

---

### 4.2 Alertas Automáticas

**Workflow**: `.github/workflows/alerts.yml`

**Dispara alertas cuando**:

1. **Vulnerabilidad CRITICAL detectada**
   ```yaml
   - if: contains(github.event.alert.alert.level, 'critical')
     run: |
       gh issue create \
         --title "🚨 CRITICAL: ${package_name}" \
         --body "Vulnerability detected..."
   ```

2. **Debt score cae por debajo de 60**
   ```yaml
   - if: debt_score < 60
     run: |
       gh issue create \
         --title "⚠️ Debt Score Below Threshold: ${debt_score}" \
         --label "technical-debt"
   ```

3. **Más de 5 dependencias desactualizadas**
   ```yaml
   - if: outdated_count > 5
     run: |
       gh issue create \
         ---title "📦 ${outdated_count} Dependencies Need Updates" \
         --label "dependencies"
   ```

---

### 4.3 Reportes Semanales

**Workflow**: `.github/workflows/weekly-report.yml`

**Genera**: Issue semanal con estado del proyecto

```markdown
## 📊 Weekly Maintenance Report - Week #4

### ✅ Completed This Week
- [x] Updated axios from 1.5.0 to 1.6.1 (security fix)
- [x] Removed unused dependency: moment-timezone (-245 KB)
- [x] Fixed 3 security vulnerabilities
- [x] Improved test coverage from 60% to 65%

### ⚠️ Needs Attention
- [ ] Update uuid from 9.0.0 to 10.0.0 (major version)
- [ ] Reduce dependencies from 41 to <40
- [ ] Refactor component X (complexity: 15)

### 📈 Metrics
- Security Score: 92% (+2%)
- Debt Score: 68% (+3%)
- Test Coverage: 65% (+5%)
- Dependencies: 41 (-1)

### 🎯 Next Week Goals
- [ ] Update 2 minor dependencies
- [ ] Refactor 1 high-debt file
- [ ] Improve test coverage to 70%
```

---

## 🎯 Roadmap de Implementación

### Sprint 1: Fundamentos (Semana 1-2)

- [x] Crear archivo MAINTENANCE_PLAN.md
- [ ] Crear workflow de self-update
- [ ] Crear sistema de versionado (.version)
- [ ] Crear workflow de changelog

### Sprint 2: Agente de Mantenimiento (Semana 3-4)

- [ ] Crear SUBAGENTS/workflow/maintenance-coordinator.md
- [ ] Implementar detección de dependencias obsoletas
- [ ] Implementar análisis de librerías abandonadas
- [ ] Implementar security scanning

### Sprint 3: Skills de Mantenimiento (Semana 5-6)

- [ ] Crear SKILLS/dependency-updates/SKILL.md
- [ ] Crear SKILLS/technical-debt/SKILL.md
- [ ] Crear SKILLS/security-scanning/SKILL.md
- [ ] Actualizar SKILLS/dependency-management/SKILL.md

### Sprint 4: Monitoreo y Alertas (Semana 7-8)

- [ ] Crear dashboard de métricas
- [ ] Implementar alertas automáticas
- [ ] Crear reportes semanales
- [ ] Integrar todo en run.sh

---

## 🤔 Decisiones Pendientes

### 1. ¿Frecuencia de auto-actualización?

**Opción A**: Semanal (domingo a medianoche)
- ✅ Más actualizado
- ❌ Más riesgo de bugs

**Opción B**: Mensual
- ✅ Más estable
- ❌ Menos actualizado

**Opción C**: Manual + Weekly check
- ✅ Control total
- ✅ No sorpresas
- ✅ Mejor balance

**Recomendación**: Opción C

---

### 2. ¿Actualización automática de dependencias?

**Opción A**: Fully automatic (Dependabot merge automático)
- ✅ Cero intervención manual
- ❌ Riesgo de breaking changes

**Opción B**: Semi-automático (PR automático, merge manual)
- ✅ Control humano
- ✅ Proceso automático
- ✅ Mejor balance

**Opción C**: Manual total
- ✅ Máximo control
- ❌ Mucho trabajo manual

**Recomendación**: Opción B

---

### 3. ¿Score mínimo aceptable de Debt?

**Opción A**: 70+ (Estricto)
- ✅ Alta calidad
- ❌ Difícil de mantener

**Opción B**: 60+ (Balanceado)
- ✅ Calidad aceptable
- ✅ Mantenible
- ✅ **Recomendado**

**Opción C**: 50+ (Relajado)
- ✅ Fácil de mantener
- ❌ Calidad baja

**Recomendación**: Opción B

---

## 🎉 Beneficios Esperados

### A Corto Plazo (1-3 meses)

- ✅ Dependencias siempre actualizadas
- ✅ Cero vulnerabilidades CRITICAL/HIGH
- ✅ Dashboard de métricas visible
- ✅ Reportes semanales automáticos

### A Mediano Plazo (3-6 meses)

- ✅ Debt Score mejorado en +20%
- ✅ Dependencias reducidas en -15%
- ✅ Security Score >90%
- ✅ Proyectos siempre sincronizados con ai-core

### A Largo Plazo (6-12 meses)

- ✅ Zero Touch Maintenance
- ✅ Proyectos auto-mantenibles
- ✅ Technical debt bajo control
- ✅ Mejor developer experience

---

## 📚 Referencias

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Snyk](https://snyk.io/)
- [SonarQube](https://www.sonarqube.org/)
- [Technical Debt](https://en.wikipedia.org/wiki/Technical_debt)

---

## 🔴 GAPS CRÍTICOS IDENTIFICADOS Y SOLUCIONES

### Gap #1: Sistema de Propagación ai-core → Proyectos

**Problema Crítico**: El plan cubre cómo ai-core se mantiene actualizado, pero NO cómo los proyectos se enteran de las actualizaciones.

**Escenario**:
```
pivotforge/                              ← Tu proyecto
├── .claude/skills → SKILLS/     ← Symlink
└── .claude/agents → ai-core/SUBAGENTS/  ← Symlink

ai-core se actualiza:
  • SKILLS/security/SKILL.md mejora
  • SUBAGENTS/nuevo-agente.md agregado

❌ Pregunta: ¿Cómo se entera pivotforge?
✅ Respuesta: SISTEMA DE PROPAGACIÓN
```

**Solución: Tres Opciones**

#### Opción A: Pull Model (Proyectos Buscan Actualizaciones)

**Workflow**: `.github/workflows/check-ai-core-updates.yml`

```yaml
name: Check ai-core Updates

on:
  schedule:
    - cron: '0 0 * * 0'  # Cada domingo a medianoche
  workflow_dispatch:

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check ai-core for updates
        id: check
        run: |
          cd ai-core
          git fetch origin main
          LOCAL=$(git rev-parse HEAD)
          REMOTE=$(git rev-parse origin/main)

          if [ $LOCAL != $REMOTE ]; then
            echo "updates_available=true" >> $GITHUB_OUTPUT
            echo "remote_commit=$(git rev-parse origin/main)" >> $GITHUB_OUTPUT
          else
            echo "updates_available=false" >> $GITHUB_OUTPUT
          fi

      - name: Create update PR if available
        if: steps.check.outputs.updates_available == 'true'
        run: |
          gh repo create \
            --title "🔄 chore: update ai-core to latest" \
            --body "## ai-core Update Available

**Remote commit**: \`${{ steps.check.outputs.remote_commit }\`\`

### Changes
- SKILLS updated
- SUBAGENTS updated
- Documentation updated

### Action Required
Review changes and merge to update ai-core.

### Automatic Verification
✅ Tests will run automatically on merge
" \
            --label "ai-core-update"
```

**Ventajas**:
- ✅ Control total (proyecto decide cuándo actualizar)
- ✅ No requiere configuración en ai-core
- ✅ Simple de implementar

**Desventajas**:
- ❌ Requiere que cada proyecto tenga el workflow
- ❌ Actualización no inmediata

---

#### Opción B: Push Model (ai-core Notifica a Proyectos) ⭐ RECOMENDADO

**Workflow en ai-core**: `.github/workflows/notify-projects.yml`

**Archivo de registro**: ai-core/.projects-list

```
# Formato: un proyecto por línea
owner/repo:branch
hectormr206/pivotforge:main
hectormr206/otro-proyecto:develop
```

**Workflow**:
```yaml
name: Notify Projects of Updates

on:
  push:
    branches:
      - main
    paths:
      - 'SKILLS/**'
      - 'SUBAGENTS/**'
      - 'run.sh'
      - 'AGENTS.md'
      - 'CLAUDE.md'

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Get list of projects
        id: projects
        run: |
          projects=$(cat .projects-list 2>/dev/null || echo "")
          echo "projects=$projects" >> $GITHUB_OUTPUT

      - name: Notify each project
        if: steps.projects.outputs.projects != ''
        run: |
          IFS=$'\n' read -ra -d '' <<< "${{ steps.projects.outputs.projects }}"
          for project in "${{steps.projects.outputs.projects}}"; do
            IFS=':' read -ra owner_repo branch <<< "$project"

            echo "Notifying $owner_repo..."

            # Crear issue en el proyecto target
            gh issue create \
              --repo "$owner_repo" \
              --title "🔄 ai-core Update Available" \
              --body "## ai-core has been updated

**Commit**: \${{ github.sha }}

### Changes
- SKILLS/ updated
- SUBAGENTS/ updated
- Core files updated

### What to do
1. Review changes in ai-core
2. Test locally if needed
3. Update ai-core: \`cd ai-core && git pull\`
4. Verify everything works

---
*This is an automated notification from ai-core*" \
              --label "ai-core-update,automated"
          done
```

**Ventajas**:
- ✅ Notificación inmediata
- ✅ ai-core centraliza la lógica
- ✅ Todos los proyectos se enteran

**Desventajas**:
- ❌ Requiere mantener lista de proyectos
- ❌ Dependencia de GitHub API

---

#### Opción C: Webhook Model (Event-Driven) - Más Complejo

**Webhook handler**: `ai-core/.github/workflows/webhook-dispatcher.yml`

```yaml
name: Dispatch Webhook

on:
  push:
    paths:
      - 'SKILLS/**'
      - 'SUBAGENTS/**'

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - name: Get projects list
        id: projects
        run: |
          # Leer proyectos registrados
          projects=$(cat .projects-list 2>/dev/null || echo "")

          # Para cada proyecto, enviar repository_dispatch event
          while IFS= read -r project; do
            owner_repo=$(echo $project | cut -d: -f1)

            # Enviar webhook
            curl -X POST \
              -H "Accept: application/vnd.github.v3+json" \
              -H "Authorization: token ${{ secrets.AI_CORE_TOKEN }}" \
              https://api.github.com/repos/$owner_repo/dispatches \
              -d '{"event_type":"ai-core-updated","client_payload":{"commit":"${{ github.sha }}"}}'
          done < .projects-list
```

**Workflow receptor**: En cada proyecto target

```yaml
name: ai-core Update Handler

on:
  repository_dispatch:
    types: [ai-core-updated]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Pull ai-core updates
        run: |
          cd ai-core
          git pull origin main

      - name: Run tests
        run: |
          npm test
          npm run build

      - name: Create PR if changes needed
        run: |
          # Verificar si hay cambios que commitear
          if git diff --exit-code; then
            git checkout -b chore/update-ai-core-$(date +%Y%m%d)
            git add .
            git commit -m "chore: update ai-core"
            git push origin chore/update-ai-core-$(date +%Y%m%d)
            gh pr create --title "chore: update ai-core"
          fi
```

**Ventajas**:
- ✅ Más rápido y en tiempo real
- ✅ Event-driven, moderno
- ✅ No requiere polling

**Desventajas**:
- ❌ Más complejo de implementar
- ❌ Requiere GitHub tokens
- ❌ Puede ser abrumidor (muchos eventos)

---

**Recomendación**: **Opción B (Push Model)** por ser el mejor balance entre simplicidad y efectividad.

---

### Gap #2: Integración de Mantenimiento con run.sh

**Problema**: run.sh instala ai-core pero NO configura el sistema de mantenimiento.

**Solución**: Ampliar run.sh con pasos de mantenimiento

**Nueva sección en run.sh**:

```bash
# ============================================================================
# CONFIGURACIÓN DE MANTENIMIENTO (Pasos 6-7)
# ============================================================================

echo ""
echo -e "${BLUE}Configurando sistema de mantenimiento...${NC}"

# 6. Instalar workflows de mantenimiento del proyecto
echo -e "${CYAN}[6/8]${NC} Instalando workflows de mantenimiento..."

mkdir -p "$PROJECT_ROOT/.github/workflows"

# Copiar workflows de ai-core al proyecto
if [[ -d "$AI_CORE_DIR/.github/workflows" ]]; then
    # Opción A: Copiar workflows seleccionados
    cp "$AI_CORE_DIR/.github/workflows/check-dependencies.yml" \
       "$PROJECT_ROOT/.github/workflows/" 2>/dev/null || true

    cp "$AI_CORE_DIR/.github/workflows/metrics.yml" \
       "$PROJECT_ROOT/.github/workflows/" 2>/dev/null || true

    # Crear workflow de check de actualizaciones de ai-core
    cat > "$PROJECT_ROOT/.github/workflows/check-ai-core.yml" <<'EOF'
name: Check ai-core Updates

on:
  schedule:
    - cron: '0 0 * * 0'  # Domingo a medianoche
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for ai-core updates
        id: check
        run: |
          cd ai-core
          git fetch origin main
          LOCAL=$(git rev-parse HEAD)
          REMOTE=$(git rev-parse origin/main)

          if [ $LOCAL != $REMOTE ]; then
            echo "✅ Updates disponibles"
            echo "remote_commit=$REMOTE" >> $GITHUB_OUTPUT
          else
            echo "✅ ai-core está actualizado"
          fi

      - name: Create update PR if needed
        if: steps.check.outputs.updates_available == 'true'
        run: |
          gh pr create \
            --title "🔄 chore: update ai-core to latest" \
            --body "ai-core tiene actualizaciones disponibles. Revisar y mergear cuando esté listo." \
            --label "ai-core-update,dependencies" || echo "PR ya existe"
EOF

    echo -e "  ✓ ${GREEN}Workflow de actualización creado${NC}"
else
    echo -e "  ${YELLOW}⚠️  No hay workflows en ai-core, omitiendo${NC}"
fi

# 7. Configurar Dependabot (opcional)
echo ""
echo -e "${CYAN}[7/8]${NC} ¿Desea configurar Dependabot para actualizaciones automáticas?"
read -p "Configurar Dependabot (y/N): " -r
echo ""
if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    cat > "$PROJECT_ROOT/.github/dependabot.yml" <<'EOF'
version: 2
updates:
  # Enable version updates for all dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "sunday"
    open:
      - pull-request
    commit-message:
      prefix: "chore"
      prefix-development: "chore"
      include: "scope:"
    reviewers:
      - hectormr206
    assignees:
      - hectormr206

  # Enable security updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open:
      - pull-request
    commit-message:
      prefix: "fix"
      prefix-development: "fix"
    labels:
      - "security"
    reviewers:
      - hectormr206
    assignees:
      - hectormr206
EOF

    echo -e "  ✓ ${GREEN}Dependabot configurado${NC}"
else
    echo -e "  ⏭️  Dependabot no configurado${NC}"
fi

# 8. Verificar configuración
echo ""
echo -e "${CYAN}[8/8]${NC} Verificando configuración..."

# Verificar que .claude/ funcione
if [[ -L "$PROJECT_ROOT/.claude/skills" ]]; then
    echo -e "  ✓ ${GREEN}.claude/skills → SKILLS/${NC}"
else
    echo -e "  ${YELLOW}⚠️  .claude/skills no es symlink${NC}"
fi

# Verificar workflows instalados
if [[ -f "$PROJECT_ROOT/.github/workflows/check-ai-core.yml" ]]; then
    echo -e "  ✓ ${GREEN}Workflow de actualización configurado${NC}"
fi
```

---

### Gap #3: Actualizar Workflows Existentes

**Problema**: ai-core ya tiene workflows de sync pero el plan no los integra.

**Solución**: Actualizar workflows existentes

**Actualizar**: `.github/workflows/receive-ai-core-updates.yml`

```yaml
name: Receive ai-core Updates

on:
  repository_dispatch:
    types: [ai-core-update]

jobs:
  receive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Pull ai-core updates
        run: |
          git pull origin main

      - name: Verify installation
        run: |
          # Verificar symlinks
          [[ -L .claude/skills ]] || { echo "❌ Symlink skills roto"; exit 1; }
          [[ -L .claude/agents ]] || { echo "❌ Symlink agents roto"; exit 1; }

          # Verificar archivos clave
          [[ -f SKILLS/security/SKILL.md ]] || { echo "❌ Skills faltantes"; exit 1; }
          [[ -f SUBAGENTS/universal/security-specialist.md ]] || { echo "❌ Agents faltantes"; exit 1; }

          echo "✅ ai-core actualizado correctamente"

      - name: Run tests
        run: |
          npm test || echo "⚠️ Tests fallaron, revisar manualmente"

      - name: Create report
        run: |
          gh issue create \
            --title "✅ ai-core Updated Successfully" \
            --body "ai-core ha sido actualizado y verificado.

**Commit**: \${{ github.sha }}

**Verification**:
- ✅ Symlinks verified
- ✅ Files present
- ⚠️ Tests: $(npm test 2>&1 | tail -5)

Next steps:
- Review the changes in SKILLS/ and ai-core/SUBAGENTS/
- Update documentation if needed" \
            --label "ai-core-update,success"
```

---

### Gap #4: Multi-Lenguaje Support Completo

**Problema**: El plan menciona múltiples lenguajes pero no detalla implementación.

**Solución**: Agregar sección completa de multi-lenguaje

```markdown
## 🌐 Multi-Language Support

### Ecosistemas Soportados

El sistema de mantenimiento soporta múltiples lenguajes y gestores de paquetes:

#### JavaScript/Node.js
```bash
npm outdated              # Depreciadas
npm audit                 # Vulnerabilidades
npx depcheck              # No usadas
npm-check-updates -u      # Disponibles
```

#### Python
```bash
pip list --outdated      # Depreciadas
pip-audit                # Vulnerabilidades
pipreqs                  # No usadas (requirements.txt)
safety check              # Vulnerabilidades
pip-upgrade               # Actualizar
```

#### Rust
```bash
cargo outdated            # Depreciadas
cargo audit               # Vulnerabilidades
cargo udeps              # No usadas
cargo update              # Actualizar
```

#### Go
```bash
go list -u -m all         # Depreciadas
goyammu outdated          # Versión antigua de go
govulncheck               # Vulnerabilidades
go get -u ./...           # Actualizar
```

#### Ruby
```bash
bundle outdated            # Depreciadas
bundle audit              # Vulnerabilidades
```

### Lenguaje-Agnóstico Commands

El maintenance-coordinator detecta automáticamente el lenguaje del proyecto:

```python
def detect_language(project_dir):
    # Check for package files
    if os.path.exists('package.json'):
        return 'nodejs'
    elif os.path.exists('requirements.txt') or os.path.exists('pyproject.toml'):
        return 'python'
    elif os.path.exists('Cargo.toml'):
        return 'rust'
    elif os.path.exists('go.mod'):
        return 'go'
    elif os.path.exists('Gemfile'):
        return 'ruby'
    else:
        return 'unknown'
```

### Herramientas por Lenguaje

| Lenguaje | Outdated | Vulnerabilities | Unused | Update |
|----------|----------|----------------|--------|--------|
| Node.js | npm outdated | npm audit | npx depcheck | npm update |
| Python | pip list --outdated | pip-audit | pipreqs | pip-upgrade |
| Rust | cargo outdated | cargo audit | cargo udeps | cargo update |
| Go | go list -u -m all | govulncheck | - | go get -u |
| Ruby | bundle outdated | bundle audit | - | bundle update |
```
```

---

## 📋 Checklist de Implementación Completa

Para que "ai-core y los proyectos SIEMPRE estén actualizados", se necesita:

### Fase 1: Crear Componentes de Mantenimiento (Semana 1-2)

- [ ] **CRÍTICO**: Crear workflow de propagación (Opción B: Push Model)
  - [ ] `.github/workflows/notify-projects.yml`
  - [ ] `.projects-list` (archivo de registro)
  - [ ] Documentación de registro de proyectos

- [ ] Crear workflows de monitoreo:
  - [ ] `.github/workflows/check-dependencies.yml`
  - [ ] `.github/workflows/metrics.yml`
  - [ ] `.github/workflows/weekly-report.yml`

- [ ] Crear workflow de auto-actualización:
  - [ ] `.github/workflows/self-update.yml` (para ai-core)
  - [ ] `.github/workflows/changelog.yml`

### Fase 2: Crear Agente y Skills (Semana 3-4)

- [ ] **CRÍTICO**: Crear `SUBAGENTS/workflow/maintenance-coordinator.md`
- [ ] Crear `SKILLS/dependency-updates/SKILL.md`
- [ ] Crear `SKILLS/technical-debt/SKILL.md`
- [ ] Crear `SKILLS/security-scanning/SKILL.md`
- [ ] Actualizar `SKILLS/dependency-management/SKILL.md`

### Fase 3: Integrar con run.sh (Semana 5)

- [ ] **CRÍTICO**: Actualizar `run.sh` con pasos 6-8 (mantenimiento)
- [ ] Agregar configuración de workflows
- [ ] Agregar opción de Dependabot
- [ ] Verificación de instalación

### Fase 4: Actualizar Workflows Existentes (Semana 6)

- [ ] Actualizar `receive-ai-core-updates.yml`
- [ ] Actualizar `sync-to-projects.yml`
- [ ] Agregar verificación de testing
- [ ] Agregar rollback si falla

### Fase 5: Testing y Validación (Semana 7-8)

- [ ] Testear propagación en 2+ proyectos reales
- [ ] Testear auto-actualización de ai-core
- [ ] Testear workflows de monitoreo
- [ ] Documentar troubleshooting

---

**EOF**

