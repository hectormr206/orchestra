# Patrón: Actualizar CHANGELOG.md

## Objetivo

Mantener CHANGELOG.md sincronizado con los commits recientes, siguiendo el formato [Keep a Changelog](https://keepachangelog.com/).

---

## Detectar Cambios

### 1. Analizar Commits Recientes

**Obtener últimos 10 commits:**
```bash
git log --oneline -10 --pretty=format:"%h|%s|%an|%ad" --date=short
```

**Formato esperado:**
```
abc1234|feat: add OAuth2 support|John Doe|2025-01-23
def5678|fix: correct authentication flow|Jane Smith|2025-01-23
ghi9012|docs: update README with new metrics|John Doe|2025-01-22
```

### 2. Categorizar Commits por Tipo

```yaml
feat:     → ### Added
fix:      → ### Fixed
docs:     → ### Changed
refactor: → ### Changed
perf:     → ### Changed
test:     → ### Changed (si afecta comportamiento)
chore:    → Omitir (a menos que sea significativo)
style:    → Omitir (cambios cosméticos)
security: → ### Security
```

### 3. Determinar Significancia

**Commits que SI se agregan:**
- Nuevas features, skills, agentes
- Bug fixes importantes
- Cambios en arquitectura
- Actualizaciones de seguridad
- Cambios breaking en API

**Commits que NO se agregan:**
- Correcciones tipográficas triviales
- Cambios de formatting
- Commits de refactoring que no afectan funcionalidad
- Commits revertidos

---

## Proceso de Actualización

### Paso 1: Leer CHANGELOG.md Actual

```yaml
Action: Read
File: CHANGELOG.md
Extract:
  - [Unreleased] section content
  - Latest version number
  - Latest version date
```

### Paso 2: Procesar Commits Nuevos

**Para cada commit:**
```yaml
1. Parsear commit message
2. Categorizar (Added/Changed/Fixed/Security)
3. Verificar que no esté ya en CHANGELOG.md
4. Formatear entrada
```

**Formato de entrada:**
```markdown
### Added
- Skill name (commit hash or reference)
```

**Ejemplos:**
```yaml
Commit: "feat: add OAuth2 support"
Entry: "- OAuth2 support for authentication (abc1234)"

Commit: "fix: correct token expiration handling"
Entry: "- Fixed token expiration handling in auth flow (def5678)"

Commit: "docs: update README with new metrics"
Entry: "- Updated README with current project metrics (ghi9012)"

Commit: "security: patch XSS vulnerability in forms"
Entry: "- Patched XSS vulnerability in form inputs (jkl3456)"
```

### Paso 3: Agregar a [Unreleased]

**Leer CHANGELOG.md:**
```markdown
## [Unreleased]

### Added
- Existing entry here

### Changed
- Another existing entry
```

**Agregar nuevas entradas:**
```markdown
## [Unreleased]

### Added
- Existing entry here
- New entry from recent commit

### Fixed
- New fix from recent commit
```

**Mantener orden:**
- Mantener orden cronológico inverso (más reciente arriba)
- Dentro de cada categoría, mantener orden alfabético o cronológico

### Paso 4: Decidir Crear Nueva Versión

**Criterios para nueva versión:**
```yaml
Crear nueva versión si:
  - Cambios significativos acumulados (5+ commits)
  - Tiempo desde última versión (> 1 semana)
  - Feature importante completada
  - Hotfix de seguridad aplicado
  - Release planificado

NO crear si:
  - Solo cambios triviales (< 3 commits)
  - Cambios solo en documentación
  - Desarrollo activo en feature branch
```

**Si crear nueva versión:**
```yaml
1. Determinar versión siguiente:
   - Bug fixes: 1.0.0 → 1.0.1 (PATCH)
   - Nuevas features backwards-compatible: 1.0.0 → 1.1.0 (MINOR)
   - Breaking changes: 1.0.0 → 2.0.0 (MAJOR)

2. Crear sección:
   ```markdown
   ## [1.1.0] - 2025-01-23

   ### Added
   - All [Unreleased] Added items

   ### Fixed
   - All [Unreleased] Fixed items
   ```

3. Limpiar [Unreleased]:
   ```markdown
   ## [Unreleased]
   (vacío o con cambios muy recientes)
   ```

4. Actualizar sección de enlaces (si existe):
   ```markdown
   [Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
   [1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
   ```
```

---

## Ejemplo Completo

### Estado Inicial (CHANGELOG.md)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New authentication feature

## [1.0.0] - 2025-01-15

### Added
- Initial release with core features
```

### Commits Recientes

```bash
abc1234 feat: add document-sync skill
def5678 fix: correct metrics calculation
ghi9012 docs: update README with new skills count
jkl3456 security: sanitize user input in forms
mno7890 refactor: improve task completion flow
```

### Después de Actualización

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New authentication feature
- document-sync skill for automatic documentation updates (abc1234)

### Changed
- Improved task completion flow (mno7890)
- Updated README with current skills count (ghi9012)

### Fixed
- Metrics calculation in NEXT_STEPS.md (def5678)

### Security
- Sanitized user input in forms to prevent XSS (jkl3456)

## [1.0.0] - 2025-01-15

### Added
- Initial release with core features
```

### Si Decidimos Crear Versión 1.1.0

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
(vacío - preparando para próxima versión)

## [1.1.0] - 2025-01-23

### Added
- New authentication feature
- document-sync skill for automatic documentation updates

### Changed
- Improved task completion flow
- Updated README with current skills count

### Fixed
- Metrics calculation in NEXT_STEPS.md

### Security
- Sanitized user input in forms to prevent XSS

## [1.0.0] - 2025-01-15

### Added
- Initial release with core features
```

---

## Comandos Útiles

```bash
# Ver commits recientes
git log --oneline -10

# Ver commits desde última versión
git log --oneline v1.0.0..HEAD

# Ver commits por tipo
git log --oneline --grep="^feat" -10
git log --oneline --grep="^fix" -10
git log --oneline --grep="^docs" -10

# Ver commits con formato detallado
git log --pretty=format:"%h|%s|%an|%ad" --date=short -10

# Contar commits desde última versión
git rev-list --count v1.0.0..HEAD

# Verificar si CHANGELOG.md existe
ls -la CHANGELOG.md
```

---

## Validación

### Después de Actualizar

1. **Verificar sintaxis:**
   ```bash
   # Formato markdown correcto
   cat CHANGELOG.md | head -30
   ```

2. **Verificar formato Keep a Changelog:**
   ```yaml
   - Tiene header con versión
   - Categorías correctas (Added/Changed/Fixed/Security)
   - Fechas en formato YYYY-MM-DD
   - No hay duplicados
   ```

3. **Verificar consistencia:**
   ```yaml
   - Todos los commits importantes están incluidos
   - No hay commits triviales innecesarios
   - Versión incrementada correctamente
   - Enlaces de versión correctos (si existen)
   ```

4. **Verificar con NEXT_STEPS.md:**
   ```yaml
   - Si CHANGELOG.md tiene nueva versión
   - NEXT_STEPS.md debe reflejar el hito completado
   - Ejemplo: "- [x] Release v1.1.0"
   ```

---

## Edge Cases

### Caso 1: Commit Revertido

**Situación:** Un commit fue revertido posteriormente.

**Solución:**
```yaml
1. Detectar revert:
   Commit: "Revert 'feat: add OAuth2'"
   Pattern: /Revert '.+'/

2. Buscar entrada original en CHANGELOG.md:
   Original: "- OAuth2 support (abc1234)"

3. Eliminar entrada original:
   Si la entrada ya está en [Unreleased], eliminarla
   Si ya está en versión publicada, agregar entrada en ### Fixed:
   "- Reverted OAuth2 support (xyz7890)"
```

### Caso 2: Commits Múltiples para una Feature

**Situación:** Varios commits relacionados a la misma feature.

**Solución:**
```yaml
Opción 1: Agregar como una sola entrada
  Entry: "- OAuth2 support (abc1234, def5678, ghi9012)"

Opción 2: Agregar sub-entradas
  Entry: |
    - OAuth2 support
      - Add Google OAuth2 provider (abc1234)
      - Add token refresh flow (def5678)
      - Add error handling (ghi9012)

Recomendación: Usar Opción 1 para simplificar
```

### Caso 3: Commit con Múltiples Tipos de Cambios

**Situación:** Un commit incluye tanto feature como fix.

**Solución:**
```yaml
Commit: "feat: add OAuth2 and fix token handling"

Opción 1: Categorizar por el cambio principal
  → ### Added
  Entry: "- OAuth2 support and token handling fix (abc1234)"

Opción 2: Separar en dos entradas (si es apropiado)
  → ### Added
  Entry: "- OAuth2 support (abc1234)"

  → ### Fixed
  Entry: "- Token handling in OAuth2 flow (abc1234)"

Recomendación: Opción 1 para evitar duplicados
```

### Caso 4: Commits Sin Convención

**Situación:** Commits que no siguen conventional commits.

**Solución:**
```yaml
Commit: "Add stuff and fix things"

Análisis:
  - No tiene prefijo (feat:, fix:, etc.)
  - Descripción vaga

Acción:
  1. Revisar los archivos modificados en el commit
  2. Inferir categoría basado en cambios:
     - Si agregó archivos nuevos → ### Added
     - Si modificó código existente → ### Changed
     - Si corrige bug reportado → ### Fixed
  3. Reescribir entrada con mejor descripción:
     Entry: "- Various improvements and bug fixes (abc1234)"

Alternativa: Omitir si el cambio no es significativo
```

---

## Integración con Flujo Completo

Este patrón se integra después de update-next-steps.md:

```yaml
1. document-sync invocado
   ↓
2. Detectar cambios (TaskList + git log)
   ↓
3. update-next-steps.md
   ↓
4. Este patrón: update-changelog.md
   ↓
5. update-metrics.md (README.md)
   ↓
6. Sincronización completa
```

---

## Best Practices

1. **Mantener consistencia:**
   - Siempre usar mismo formato de entradas
   - Ordenar por fecha (más reciente arriba)
   - Usar categorías estándar

2. **Ser selectivo:**
   - No incluir todos los commits
   - Solo cambios visibles para usuarios
   - Ommitir commits triviales

3. **Ser claro:**
   - Descripciones deben ser entendibles por usuarios
   - Incluir contexto cuando sea necesario
   - Referenciar issues o PRs cuando aplica

4. **Mantener actualizado:**
   - Actualizar después de cada release
   - No dejar [Unreleased] acumular demasiados items
   - Crear versiones regularmente

---

**EOF**
