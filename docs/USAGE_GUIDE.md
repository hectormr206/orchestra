# Orchestra CLI - Guía de Uso Práctico

## 1. Relación entre Orchestra CLI y ai-core

### Estado Actual

```
ai-core/                          # Framework de conocimiento
├── SKILLS/                       # 47 skills (patrones, best practices)
├── SUBAGENTS/                    # Definiciones de agentes
├── CLAUDE.md, GEMINI.md          # Instrucciones para AI tools
└── orchestra/                    # CLI Tool (proyecto independiente)
    ├── src/
    ├── dist/
    └── package.json
```

**Actualmente Orchestra CLI es un proyecto INDEPENDIENTE dentro de ai-core:**

- Orchestra usa AI CLIs externos (Claude, Codex, Gemini, GLM) para generar código
- NO consume directamente los SKILLS de ai-core
- Los SKILLS de ai-core son instrucciones para LLMs, no código ejecutable
- Orchestra podría en el futuro inyectar contexto de SKILLS a los prompts

### Integración Potencial (Futuro)

```
┌─────────────────────────────────────────────────────────────┐
│                      ai-core SKILLS                          │
│  security, testing, frontend, backend, database, etc.       │
└────────────────────────────┬────────────────────────────────┘
                             │ inject context
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRA CLI                            │
│  Architect ─▶ Executor ─▶ Auditor                           │
│     │            │           │                               │
│     └────────────┴───────────┴── uses skills as context     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Cómo Usar Orchestra CLI

### Instalación

```bash
# Opción 1: Desde el directorio de ai-core
cd ai-core/orchestra
npm install
npm run build
npm link  # Hace disponible 'orchestra' globalmente

# Opción 2: Como dependencia en otro proyecto
npm install /path/to/ai-core/orchestra

# Verificar instalación
orchestra doctor
```

---

## 3. Escenario A: Desarrollar ai-core con Orchestra

### Caso de uso: Agregar un nuevo SKILL

```bash
cd /path/to/ai-core

# Crear un nuevo skill
orchestra start "Create a new ai-core SKILL for GraphQL API design following the existing SKILL.md format in SKILLS/ directory"

# Con más contexto
orchestra start "Create SKILLS/graphql/SKILL.md following the pattern of SKILLS/api-design/SKILL.md. Include:
- GraphQL schema design patterns
- Resolver best practices
- N+1 query prevention
- Authentication and authorization
- Error handling
- Pagination (cursor vs offset)
- Subscriptions
- Testing GraphQL APIs" --auto
```

### Caso de uso: Mejorar SUBAGENTS

```bash
orchestra start "Update SUBAGENTS/universal/master-orchestrator.md to include support for the new GraphQL skill" --auto
```

### Caso de uso: Crear tests para ai-core

```bash
orchestra start "Create integration tests in tests/skills/ that validate all SKILL.md files have the correct YAML frontmatter and required sections" --auto --test
```

---

## 4. Escenario B: Desarrollar Orchestra CLI con Orchestra

### Meta-desarrollo: Orchestra mejorándose a sí mismo

```bash
cd /path/to/ai-core/orchestra

# Agregar nueva funcionalidad
orchestra start "Add a new command 'orchestra templates' that lists and applies predefined task templates from a templates/ directory"

# Mejorar un componente existente
orchestra start "Refactor src/adapters/GLMAdapter.ts to support streaming responses and add retry logic with exponential backoff" --auto

# Agregar tests
orchestra start "Create unit tests for src/utils/cache.ts using vitest" --auto --test

# Mejorar la TUI
orchestra start "Add a new screen to the TUI that shows real-time metrics and charts using ink-chart" --auto
```

### Workflow recomendado para auto-desarrollo

```bash
# 1. Dry-run primero para ver el plan
orchestra dry-run "Add feature X"

# 2. Si el plan es bueno, ejecutar
orchestra start "Add feature X"

# 3. Revisar el plan manualmente, hacer ajustes
# (sin --auto para poder editar)

# 4. Validar y probar
orchestra validate
npm test

# 5. Commit si todo está bien
git add .
git commit -m "feat: add feature X"
```

---

## 5. Escenario C: Usar Orchestra en un Proyecto Existente

### Setup inicial

```bash
cd /path/to/my-existing-project

# Crear configuración
orchestra init

# Editar .orchestrarc.json según tu proyecto
```

### Ejemplo: Proyecto Node.js/Express existente

```json
// .orchestrarc.json
{
  "defaultTask": "",
  "languages": ["javascript", "typescript"],
  "test": {
    "command": "npm test",
    "runAfterGeneration": true
  },
  "git": {
    "autoCommit": false,
    "commitMessageTemplate": "feat(orchestra): {task}"
  },
  "execution": {
    "parallel": true,
    "maxConcurrency": 3
  },
  "prompts": {
    "architect": "This is an Express.js API project. Follow existing patterns in src/. Use TypeScript. Tests are in __tests__/.",
    "executor": "Match the code style of existing files. Use async/await. Add JSDoc comments.",
    "auditor": "Check for security issues, especially in routes. Verify error handling."
  }
}
```

### Tareas comunes en proyecto existente

```bash
# Agregar endpoint a API existente
orchestra start "Add a new endpoint GET /api/v1/users/:id/orders that returns paginated orders for a user. Follow the pattern in src/routes/users.ts"

# Refactorizar código
orchestra start "Refactor src/services/payment.ts to use the Strategy pattern for different payment providers (Stripe, PayPal, MercadoPago)"

# Agregar tests
orchestra start "Add unit tests for src/services/auth.ts covering all edge cases"

# Corregir bug
orchestra start "Fix the bug in src/middleware/rateLimiter.ts where requests from the same IP are not being rate limited correctly after server restart"

# Agregar feature completa
orchestra start "Add a complete notification system with:
- NotificationService in src/services/
- Notification model in src/models/
- POST /api/v1/notifications endpoint
- WebSocket support for real-time notifications
- Unit tests" --parallel
```

---

## 6. Mejores Prácticas

### Escribir buenos prompts para Orchestra

```bash
# ❌ Malo: Muy vago
orchestra start "Add authentication"

# ✅ Bueno: Específico con contexto
orchestra start "Add JWT authentication to the Express API:
- Use passport.js with JWT strategy
- Add /auth/login and /auth/register endpoints
- Create User model with email, password (hashed with bcrypt)
- Add auth middleware to protect routes in src/routes/protected/
- Follow existing patterns in src/routes/"
```

### Usar dry-run para tareas complejas

```bash
# Siempre hacer dry-run primero para tareas grandes
orchestra dry-run "Migrate database from MongoDB to PostgreSQL"

# Ver el plan detallado
orchestra dry-run "Add payment integration" --json > plan.json
```

### Aprovechar el modo paralelo

```bash
# Para proyectos con muchos archivos
orchestra start "Add TypeScript types for all JavaScript files in src/utils/" --parallel --concurrency 5
```

### Usar watch para desarrollo iterativo

```bash
# Útil cuando estás refinando una feature
orchestra watch "Implement user profile page with avatar upload" --auto
# Modifica archivos manualmente, Orchestra re-ejecuta y valida
```

### Integrar con Git workflow

```bash
# Crear branch, desarrollar, commit
git checkout -b feature/new-api
orchestra start "Add user management API" --auto --commit
orchestra github --pr --branch feature/new-api
```

---

## 7. Troubleshooting

### "El código generado no sigue los patrones del proyecto"

**Solución**: Agregar contexto en `.orchestrarc.json`:

```json
{
  "prompts": {
    "architect": "IMPORTANT: Review existing code in src/ before planning. Match existing patterns exactly.",
    "executor": "Copy the style from existing files. Use the same import patterns, naming conventions, and folder structure."
  }
}
```

### "Orchestra no encuentra los archivos existentes"

**Solución**: Ser explícito en el prompt:

```bash
orchestra start "Add validation to the UserController located at src/controllers/UserController.ts. Review the existing validation in src/controllers/ProductController.ts as reference."
```

### "Los tests fallan después de generar código"

**Solución**: Usar `--test` para detectar errores temprano:

```bash
orchestra start "Add feature X" --auto --test
```

### "El plan es demasiado ambicioso"

**Solución**: Dividir en tareas más pequeñas:

```bash
# En lugar de:
orchestra start "Build complete e-commerce platform"

# Hacer:
orchestra start "Create product catalog with CRUD operations"
orchestra start "Add shopping cart functionality"
orchestra start "Implement checkout with Stripe"
orchestra start "Add order management"
```

---

## 8. Ejemplo Completo: Nuevo Feature en Proyecto Existente

```bash
# 1. Navegar al proyecto
cd ~/projects/my-api

# 2. Configurar Orchestra (si no existe)
orchestra init

# 3. Verificar dependencias
orchestra doctor

# 4. Dry-run para ver el plan
orchestra dry-run "Add a caching layer using Redis for the /api/products endpoints"

# 5. Ejecutar con revisión manual del plan
orchestra start "Add a caching layer using Redis for the /api/products endpoints:
- Create src/services/cache.ts with Redis client
- Add caching middleware in src/middleware/cache.ts
- Cache GET /api/products for 5 minutes
- Cache GET /api/products/:id for 10 minutes
- Add cache invalidation on POST/PUT/DELETE
- Add unit tests"

# 6. Revisar el plan generado, modificar si necesario
# (el CLI te pedirá aprobar/rechazar/editar)

# 7. Una vez aprobado, Orchestra ejecuta y genera código

# 8. Validar sintaxis
orchestra validate

# 9. Ejecutar tests
npm test

# 10. Si todo está bien, commit
git add .
git commit -m "feat: add Redis caching layer for products API"

# 11. Opcional: crear PR
orchestra github --pr
```

---

## 9. Próximos Pasos para Integración ai-core + Orchestra

### Integración planeada:

1. **Inyección de SKILLS**: Orchestra podría leer SKILLS/ y agregar contexto relevante a los prompts automáticamente

2. **Validación con SKILLS**: El Auditor podría verificar que el código siga los patrones definidos en SKILLS/

3. **Templates basados en SKILLS**: Crear plantillas de tareas que usen SKILLS específicos

```bash
# Futuro:
orchestra start "Add authentication" --skills security,backend
# Orchestra leería SKILLS/security/SKILL.md y SKILLS/backend/SKILL.md
# e inyectaría ese contexto a los prompts
```

---

## Resumen

| Escenario | Comando típico |
|-----------|----------------|
| Nuevo feature | `orchestra start "Add X" --auto` |
| Refactoring | `orchestra start "Refactor X to Y"` |
| Bug fix | `orchestra start "Fix bug in X where Y"` |
| Tests | `orchestra start "Add tests for X" --test` |
| Análisis previo | `orchestra dry-run "Complex task"` |
| Desarrollo iterativo | `orchestra watch "Feature X"` |
| Full workflow | `orchestra start "X" --auto --test --commit` |
