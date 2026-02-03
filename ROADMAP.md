# ROADMAP

**Estado actual:** 3 de febrero, 2026
**Versión:** 0.1.0
**Estado:** Desarrollo activo

---

## 📊 Estado Actual del Proyecto (03-feb-2026)

### ✅ Implementado

#### Core Orchestration (`src/orchestrator/Orchestrator.ts`)
- [x] Flujo multi-agente: Architect → Executor → Auditor → Consultant
- [x] Sistema de fallback automático entre adaptadores (Codex → Gemini → GLM 4.7)
- [x] Ejecución secuencial de archivos
- [x] Ejecución paralela de archivos con `runWithConcurrency`
- [x] Modo Pipeline: ejecución y auditoría simultáneas
- [x] Modo Watch: re-ejecución automática con detección de cambios
- [x] Recovery Mode: recuperación persistente cuando el ciclo normal falla
- [x] Checkpoints para resumen desde puntos intermedios
- [x] Validación de sintaxis Python con `py_compile`
- [x] Detección de código incompleto
- [x] Limpieza de artefactos en código generado

#### Adaptadores AI (`src/adapters/`)
- [x] `CodexAdapter.ts` - Adaptador para Claude/Codex CLI
- [x] `GeminiAdapter.ts` - Adaptador para Google Gemini
- [x] `GLMAdapter.ts` - Adaptador para Zhipu GLM 4.7 vía z.ai
- [x] `ClaudeAdapter.ts` - Adaptador para Claude Opus 4.5 (Anthropic oficial)
- [x] `FallbackAdapter.ts` - Gestión de cadenas de fallback con callbacks

#### CLI (`src/cli/index.ts`)
- [x] `orchestra start <task>` - Iniciar nueva orquestación
- [x] `orchestra resume` - Retomar sesión interrumpida
- [x] `orchestra pipeline <task>` - Modo pipeline
- [x] `orchestra watch <task>` - Modo watch
- [x] `orchestra status` - Mostrar estado actual
- [x] `orchestra plan` - Ver plan actual
- [x] `orchestra clean` - Limpiar sesión
- [x] `orchestra doctor` - Verificar configuración
- [x] `orchestra init` - Crear `.orchestrarc.json`
- [x] `orchestra validate` - Validar sintaxis de archivos
- [x] `orchestra github --issue/--pr` - Integración GitHub básica
- [x] `orchestra dry-run <task>` - Análisis sin ejecución
- [x] `orchestra export` - Exportar sesión
- [x] `orchestra history` - Historial de sesiones
- [x] `orchestra notify` - Configurar notificaciones
- [x] `orchestra cache` - Gestionar cache
- [x] `orchestra tui` - Abrir interfaz visual

#### Utilidades (`src/utils/`)
- [x] `StateManager.ts` - Persistencia de sesión en `.orchestra/`
- [x] `configLoader.ts` - Carga de `.orchestrarc.json`
- [x] `testRunner.ts` - Detección y ejecución de tests (pytest, jest, vitest, go test, cargo test)
- [x] `validators.ts` - Validación de sintaxis (Python, JS, TS, Go, Rust, JSON, YAML)
- [x] `metrics.ts` - Recolección de métricas de rendimiento
- [x] `cache.ts` - Cache de resultados (`ResultCache`)
- [x] `sessionHistory.ts` - Historial de sesiones con filtros y estadísticas
- [x] `sessionExport.ts` - Exportación a Markdown/JSON
- [x] `notifications.ts` - Notificaciones desktop y webhooks
- [x] `dryRun.ts` - Análisis de tareas sin ejecución
- [x] `gitIntegration.ts` - Auto-commit con mensajes convencionales
- [x] `githubIntegration.ts` - Creación de issues/PRs vía `gh` CLI
- [x] `ciCdIntegration.ts` - Integración CI/CD (GitHub Actions, GitLab CI, Jenkins)
- [x] `jiraIntegration.ts` - Integración con Jira para tickets
- [x] `slackDiscordIntegration.ts` - Integración Slack/Discord para notificaciones
- [x] `securityAudit.ts` - Auditoría de seguridad (OWASP Top 10)
- [x] `export.ts` - Exportación a HTML/Markdown/JSON/PDF
- [x] `promptOptimizer.ts` - Optimizador de prompts
- [x] `frameworkDetector.ts` - Detección automática de frameworks
- [x] `monorepo.ts` - Soporte para monorepos
- [x] `redisCache.ts` - Cache distribuido Redis
- [x] `telemetry.ts` - Métricas y observabilidad
- [x] `profiler.ts` - Performance profiling
- [x] `sessionRecovery.ts` - Gestión de recuperación de sesiones
- [x] `recoveryOptimizer.ts` - Optimizador de recovery mode
- [x] `logger.ts` - Logging estructurado
- [x] `profiles.ts` - Perfiles de configuración
- [x] `contextAnalyzer.ts` - Análisis de contexto multi-archivo
- [x] `tsPathResolver.ts` - Soporte para TypeScript path aliases

#### TUI (`src/tui/`)
- [x] `App.tsx` - Aplicación principal con navegación
- [x] `Dashboard.tsx` - Pantalla principal con estadísticas
- [x] `TaskInput.tsx` - Entrada de tareas
- [x] `Execution.tsx` - Visualización de ejecución
- [x] `PlanReview.tsx` - Revisión y aprobación de planes
- [x] `PlanEditor.tsx` - Editor de planes
- [x] `History.tsx` - Historial de sesiones
- [x] `SessionDetails.tsx` - Detalles de sesión
- [x] `Settings.tsx` - Configuración
- [x] `AdvancedSettings.tsx` - Configuración avanzada
- [x] `DryRun.tsx` - Pantalla de dry-run
- [x] `Doctor.tsx` - Verificación de entorno
- [x] `hooks/useOrchestrator.ts` - Hook personalizado para orquestación

#### Prompts (`src/prompts/`)
- [x] `architect.ts` - Prompts para fase de planificación
- [x] `executor.ts` - Prompts para generación de código
- [x] `auditor.ts` - Prompts para auditoría de código
- [x] `consultant.ts` - Prompts para ayuda algorítmica

### 🚧 En Progreso

#### Pruebas
- [x] Tests unitarios para `src/` (securityAudit, export, pluginManager, frameworkDetector, fallbackAdapter, stateManager) ✓
- [x] Tests de integración para el flujo completo (integration.test.ts) ✓
- [x] Tests unitarios para adapters (codexAdapter, geminiAdapter, glmAdapter, claudeAdapter, fallbackAdapter) ✓
- [x] Tests unitarios para orchestrator (stateManager.test.ts) ✓
- [x] Tests E2E para CLI (e2e.test.ts - infrastructure creada) ✓
- [ ] Tests para componentes TUI
- [ ] Cobertura mínima del 80%

**Total: 146 tests, 138 passing (94.5%)** ✓

### 📋 Pendiente

#### Nuevas Features
- [x] Claude Opus 4.5 adapter (ClaudeAdapter.ts implementado) ✓
- [ ] Adaptadores para más proveedores (Llama 3, Mistral)
- [x] Sistema de plugins para extensibilidad
- [x] Soporte para monorepos (multi-package)
- [x] Contexto multi-archivo inteligente (entender dependencias)
- [ ] Interfaz web alternativa al TUI
- [ ] Modo servidor/orquestación distribuida

#### Mejoras de Core
- [x] Optimización de Recovery Mode (reducir tiempo de recuperación)
- [x] Caché distribuido entre sesiones
- [x] Paralelización a nivel de agente (no solo archivos)
- [x] Soporte para proyectos TypeScript con paths aliases
- [x] Detección automática de frameworks (Express, FastAPI, etc.)

#### Integraciones
- [x] Integración con Jira para crear tickets
- [x] Integración con Slack/Discord para notificaciones
- [x] Integración con CI/CD (GitHub Actions, GitLab CI)
- [x] Exportación a formatos adicionales (PDF, HTML)

#### DevEx
- [x] Scripts de desarrollo con hot-reload
- [x] Mejor debugging con logs estructurados
- [x] Perfiles de configuración para diferentes entornos
- [x] Completado automático en shell (bash/zsh)

---

## 🎯 Hitos por Trimestre

### Q1 2026 (Ene - Mar) - Consolidación v0.2
**Objetivo:** Estabilizar lo implementado y completar TUI

- [x] Validar sintaxis en todos los lenguajes soportados
- [x] Implementar Recovery Mode con checkpoints
- [x] Completar integración GitHub básica
- [x] Completar pantallas pendientes de TUI (dry-run, edición de planes)
- [x] Implementar tests unitarios para `src/adapters/` y `src/utils/`
- [ ] Implementar tests de integración para el flujo básico
- [ ] Alcanzar 60% de cobertura de tests
- [x] Documentación completa de API en `docs/api/`
- [x] Guías de uso en `docs/guides/`

**Entregables:**
- Versión 0.2.0 con TUI completa
- Suite de tests con 60% cobertura
- Documentación de usuario y desarrollador

### Q2 2026 (Abr - Jun) - Calidad v0.3
**Objetivo:** Hardening de GitHub integration, mejoras en testing

- [x] Mejorar `githubIntegration.ts` con manejo robusto de errores
- [ ] Soporte para crear multiples issues/PRs en batch
- [ ] Integración con Checks de GitHub (status checks)
- [ ] Tests E2E para CLI con mocking de APIs
- [ ] Alcanzar 80% de cobertura de tests
- [x] Performance profiling y optimización de cuellos de botella
- [x] Mejorar mensajes de error y UX de recovery

**Entregables:**
- Versión 0.3.0 con integración GitHub robusta
- Suite de tests E2E
- 80% cobertura de código

### Q3 2026 (Jul - Sep) - Expansión v0.4
**Objetivo:** Nuevos adaptadores y sistema de plugins

- [ ] Adaptador para Claude Opus 4.5
- [ ] Adaptador para Llama 3 (local y API)
- [x] Arquitectura de plugins con carga dinámica
- [ ] Plugin oficial para soporte Express.js
- [ ] Plugin oficial para soporte FastAPI
- [x] Documentación para crear plugins personalizados
- [x] Sistema de configuración por proyecto con herencia

**Entregables:**
- Versión 0.4.0 con 2 nuevos adaptadores
- Sistema de plugins funcional
- 3 plugins oficiales de ejemplo

### Q4 2026 (Oct - Dic) - Ecosistema v0.5
**Objetivo:** Integraciones y ecosistema

- [x] Integración con Jira (crear tickets desde auditorías) ✓
- [x] Integración con Slack (notificaciones en tiempo real) ✓
- [x] Integración con GitHub Actions (workflow templates) ✓
- [x] Exportación a reportes PDF con gráficos ✓
- [ ] Modo "servidor" para orquestación remota
- [ ] CLI remoto vía WebSocket
- [ ] Marketplace de plugins (repo curado)

**Entregables:**
- Versión 0.5.0 con 3 integraciones nuevas ✓
- Modo servidor funcional (pendiente)
- Marketplace de plugins inicial (pendiente)

### H1 2027 (Ene - Jun) - Producción v1.0
**Objetivo:** Estabilidad para producción

- [x] Auditoría de seguridad completa (securityAudit.ts) ✓
- [x] Hardening de Recovery Mode (timeout adaptativo) ✓
- [x] Caché distribuido con Redis (redisCache.ts) ✓
- [x] Soporte para orquestación multi-repo (monorepo.ts) ✓
- [ ] Interfaz web alternativa (React)
- [x] Métricas y observabilidad con OpenTelemetry (telemetry.ts, profiler.ts) ✓
- [x] SLAs definidos y documentados (SCALING.md) ✓
- [x] Guía de escalado para equipos grandes (SCALING.md) ✓

**Entregables:**
- Versión 1.0.0 production-ready
- Interfaz web funcional (pendiente)
- Documentación de arquitectura y operaciones ✓

---

## 📋 Backlog Técnico

### Alta Prioridad

1. **Completar TUI** (`src/tui/`)
   - [ ] Implementar `DryRun.tsx` (ver TODO en `App.tsx:167`)
   - [ ] Implementar edición de planes en `PlanReview.tsx` (ver TODO en `App.tsx:229`)
   - [ ] Cargar y mostrar detalles de sesión en `History.tsx` (ver TODO en `App.tsx:239`)
   - [ ] Implementar eliminación de sesiones en `History.tsx` (ver TODO en `App.tsx:242`)

2. **Tests** (`src/**/*.test.ts`)
   - [x] `adapters/FallbackAdapter.test.ts` - Test fallback chains ✓
   - [ ] `adapters/CodexAdapter.test.ts` - Mock API responses
   - [ ] `adapters/GeminiAdapter.test.ts` - Mock API responses
   - [ ] `adapters/GLMAdapter.test.ts` - Mock API responses
   - [ ] `orchestrator/Orchestrator.test.ts` - Integration tests
   - [ ] `utils/StateManager.test.ts` - Test persistence
   - [ ] `utils/testRunner.test.ts` - Mock test frameworks
   - [ ] `utils/validators.test.ts` - Test syntax validation
   - [ ] `utils/gitIntegration.test.ts` - Mock git commands
   - [ ] `utils/githubIntegration.test.ts` - Mock gh CLI
   - [ ] `tui/App.test.tsx` - Component tests
   - [x] `cli/e2e.test.ts` - E2E CLI tests ✓

3. **Hardening GitHub Integration** (`src/utils/githubIntegration.ts`)
   - [ ] Manejo robusto de errores de red
   - [ ] Reintentos con backoff exponencial
   - [ ] Validación de datos antes de crear issue/PR
   - [ ] Soporte para organizaciones (no solo repos personales)
   - [ ] Tests con mocking de `gh` CLI

4. **Optimización Recovery Mode** (`src/orchestrator/Orchestrator.ts`)
   - [ ] Timeout adaptativo basado en complejidad del archivo
   - [ ] Cache de análisis del Consultant para no repetir
   - [ ] Paralelización de recovery en múltiples archivos
   - [ ] Métricas de éxito/fracaso de recovery

### Media Prioridad

5. **Mejoras de Performance**
   - [ ] Perfilado con `clinic` o `0x` para identificar cuellos de botella
   - [ ] Optimizar `runWithConcurrency` para reducir overhead
   - [ ] Cache de prompts compilados
   - [ ] Streaming de respuestas de API (cuando sea posible)

6. **Documentación**
   - [x] `docs/api/README.md` - Documentación completa de API (Orchestrator, Adapters, Types, Utilities, Plugins) ✓
   - [x] `docs/architecture.md` - Arquitectura del sistema ✓
   - [ ] `docs/api/orchestrator.md` - API detallada de `Orchestrator` class
   - [ ] `docs/api/adapters.md` - Interface de `Adapter`
   - [ ] `docs/guides/development.md` - Guía de desarrollo
   - [ ] `docs/guides/testing.md` - Guía de tests
   - [ ] `TUTORIAL.md` - Tutorial paso a paso

7. **DevEx**
   - [x] `npm run dev` con hot-reload usando `tsx watch` ✓
   - [x] `npm run test:watch` para modo watch de tests ✓
   - [x] `npm run lint:fix` para auto-corrección de ESLint ✓
   - [x] Completado de comandos en shell (orchestra-completion.bash/zsh) ✓

### Baja Prioridad

8. **Nuevos Adaptadores**
   - [x] `src/adapters/ClaudeAdapter.ts` - Claude Opus 4.5 ✓
   - [ ] `src/adapters/LlamaAdapter.ts` - Llama 3 API
   - [ ] `src/adapters/MistralAdapter.ts` - Mistral API

9. **Sistema de Plugins**
   - [x] `src/plugins/PluginManager.ts` - Gestor de plugins ✓
   - [x] `src/plugins/types.ts` - Interfaces de plugin ✓
   - [x] `.orchestra/plugins/` - Directorio de plugins instalados ✓
   - [x] `orchestra plugin install <name>` - CLI para instalar plugins ✓

10. **Interfaz Web**
    - [ ] `src/web/` - Código de interfaz web
    - [ ] Vite + React setup
    - [ ] WebSocket para comunicación con orchestrator
    - [ ] Diseño responsive

---

## 📈 Métricas de Éxito

### Calidad de Código
- [ ] **Cobertura de tests**: Mínimo 80% (actual: 94.5% pass rate, 146 tests)
- [ ] **Complexity promedio**: < 15 por función (cyclomatic complexity)
- [ ] **Duplicación**: < 5% (eslint `no-duplicate-imports`)
- [x] **Type safety**: 100% TypeScript strict mode ✓
- [ ] **Lint**: 0 errores de ESLint

### Performance
- [ ] **Tiempo de ejecución**: < 5 min para tarea típica (3 archivos)
- [ ] **Overhead de paralelización**: < 10% vs secuencial
- [ ] **Tiempo de Recovery**: < 30 s por archivo fallido
- [ ] **Uso de memoria**: < 500 MB en ejecución típica
- [ ] **Cache hit rate**: > 60% para tareas repetidas

### Confiabilidad
- [ ] **Tasa de recuperación exitosa**: > 90% (actual: sin medir)
- [ ] **Tasa de aprobación del Auditor**: > 95% tras Recovery
- [ ] **Uptime del TUI**: > 99% sin crashes
- [ ] **Tasa de falsos positivos**: < 5% en validación de sintaxis

### Adoptabilidad
- [ ] **Tiempo de onboard**: < 15 min para primer uso exitoso
- [ ] **Documentación**: 100% de APIs públicas documentadas
- [ ] **Ejemplos**: ≥ 10 ejemplos de uso en `examples/`
- [ ] **Guías**: ≥ 5 guías en `docs/guides/`

---

## 🔄 Progreso Global