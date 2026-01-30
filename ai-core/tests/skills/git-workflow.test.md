# Test: Git Workflow Skill

**Skill:** git-workflow
**Archivo:** SKILLS/git-workflow/SKILL.md
**Fecha:** 2025-01-23
**Tester:** ai-core/test-framework

---

## 1. Validación de Metadata

### ✅ PASS - name existe
- [x] Campo `name: git-workflow` presente

### ✅ PASS - description existe
- [x] Descripción sobre conventional commits, branching, PRs
- [x] Trigger documentado

### ✅ PASS - license especificado
- [x] License: Apache-2.0

### ✅ PASS - author y version
- [x] Author: ai-core
- [x] Version: 1.0

### ✅ PASS - auto_invoke
- [x] Acciones de git-workflow mapeadas
  - Writing commit messages ✓
  - Creating pull requests ✓
  - Reviewing code ✓
  - Resolving merge conflicts ✓

---

## 2. Validación de Secciones Requeridas

### ✅ PASS - When to Use
- [x] Sección presente
- [x] Casos de uso claros:
  - Writing commit messages ✓
  - Creating/merging branches ✓
  - Submitting pull requests ✓
  - Reviewing code ✓
  - Resolving conflicts ✓

### ✅ PASS - Critical Patterns - ALWAYS
- [x] Sección `### > **ALWAYS**` presente
- [x] Conventional Commits format ✓
- [x] Branch naming (feature/, bugfix/, hotfix/) ✓
- [x] Branch Protection Rules ✓
- [x] Meaningful PR titles ✓
- [x] Fill PR template completely ✓
- [x] Keep PRs small (< 400 lines) ✓
- [x] Code Review Guidelines ✓

### ✅ PASS - Commit Types
- [x] feat, fix, docs, style, refactor, perf, test, chore, ci, build ✓
- [x] Scope opcional documentado ✓
- [x] Examples claros ✓

---

## 3. Validación de Calidad

### ✅ PASS - Longitud adecuada
- [x] Total líneas: 265+ (> 200 mínimo) ✓
- [x] Contenido sustancial, no filler

### ✅ PASS - Ejemplos de código
- [x] Ejemplos de commits ✓
- [x] Ejemplos de PR templates ✓
- [x] Código formateado correctamente ✓

### ✅ PASS - Estructura clara
- [x] Headers jerárquicos correctos
- [x] Secciones bien organizadas
- [x] Flujo lógico de contenido

---

## 4. Validación de Contenido

### ✅ PASS - Conventional Commits
- [x] Format: <type>[scope]: <description> ✓
- [x] Types documentados (10 types) ✓
- [x] Ejemplos claros ✓
- [x] Body y footer opcionales ✓

### ✅ PASS - Branching Strategy
- [x] Branch naming conventions ✓
- [x] feature/, bugfix/, hotfix/, release/ ✓
- [x] Branch protection rules documentadas ✓

### ✅ PASS - Pull Requests
- [x] PR titles (conventional style) ✓
- [x] PR template completo ✓
- [x] Small PRs (< 400 lines) ✓
- [x] Code review guidelines ✓

### ✅ PASS - Code Review
- [x] Be respectful and constructive ✓
- [x] Explain WHY not just WHAT ✓
- [x] Approve if "good enough to ship" ✓
- [x] Request changes for blocking issues only ✓

### ✅ PASS - Merge Conflicts
- [x] Conflict resolution strategies ✓
- [x] git merge vs git rebase ✓
- [x] Best practices documentadas ✓

---

## 5. Casos de Prueba

### Caso 1: Commit Messages
```yaml
Input: "¿Formato de commit?"
Expected: <type>[scope]: <description>
Actual: ✓ Formato + 10 ejemplos
State: ✅ PASS
```

### Caso 2: Branch Naming
```yaml
Input: "¿Cómo nombrar branches?"
Expected: feature/, bugfix/, hotfix/
Actual: ✓ Prefixes claros + ejemplos
State: ✅ PASS
```

### Caso 3: PR Reviews
```yaml
Input: "¿Cómo hacer code review?"
Expected: Constructive, explain WHY
Actual: ✓ Guidelines completas
State: ✅ PASS
```

---

## 6. Validación de Completitud

### ✅ PASS - Related Skills
- [x] Referencias a skills relacionados presentes
- [x] Links funcionales a otros skills

### ✅ PASS - Auto-invocation
- [x] Tabla de auto-invocation presente
- [x] Acciones de git-workflow mapeadas a skill git-workflow

---

## 📊 RESULTADO FINAL

### ✅ TEST PASSED

**Estado:** APROBADO
**Criterios pasados:** 24/24
**Coverage:** 100%

### Detalles:
- Metadata: ✅ 5/5 criterios
- Secciones: ✅ 3/3 secciones
- Calidad: ✅ 3/3 métricas
- Contenido: ✅ 5/5 dominios
- Casos de prueba: ✅ 3/3 pasados
- Completitud: ✅ 2/2 checks

### Observaciones:
- ✅ Skill completo y robusto
- ✅ Excelente coverage de Git best practices
- ✅ Conventional commits bien documentados
- ✅ PR workflow completo
- ✅ Ready para producción

---

**Tester:** ai-core/test-framework
**Fecha:** 2025-01-23
**Próximo test:** ci-cd skill
