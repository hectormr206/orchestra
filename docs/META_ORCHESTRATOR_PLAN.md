# Plan de Desarrollo: Meta-Orquestador de Agentes IA

> **Versión**: 2.0.0
> **Estado**: ✅ PLAN OPTIMIZADO - Listo para implementación
> **Fecha**: 2025-01-27
> **Autor**: Claude Opus 4.5 + Héctor MR
> **Última actualización**: 2025-01-27

### Cambios en v2.0.0

- ✅ Interfaz basada en archivos (no parsing de stdout)
- ✅ Uso de modo `--print` en CLIs (sin node-pty)
- ✅ Sistema de checkpoints y recuperación
- ✅ Rate limit tracking
- ✅ MVP simplificado (2 agentes primero)
- ✅ Paralelización inteligente

### Resumen de Decisiones Clave

| Decisión                 | Elección                                 |
| ------------------------ | ---------------------------------------- |
| Fallback de CLI          | Usar segundo mejor para la tarea         |
| Autonomía                | Totalmente autónomo (MAX_ITERATIONS=3)   |
| Persistencia .orchestra/ | Ignorado (excepto templates/)            |
| Output                   | TUI rica + flags --simple/--json/--quiet |
| Interfaz entre agentes   | **Archivos .md como contrato**           |
| Control de CLI           | **Modo --print (no interactivo)**        |

---

## Resumen Ejecutivo

Transformar ai-core de un repositorio de conocimiento pasivo a un **CLI Orquestador** que coordina múltiples herramientas de IA (Claude, Gemini, GLM, Codex) aprovechando los límites de suscripción de cada servicio.

### Propuesta de Valor

```
ANTES: Usuario → Claude Code → Resultado
DESPUÉS: Usuario → Orquestador → [Arquitecto → Ejecutor ⇄ Consultor → Auditor] → Resultado Optimizado
```

**Beneficios**:

- **Arbitraje de suscripciones**: Usar límites mensuales en vez de pagar por token
- **Especialización por modelo**: Cada IA hace lo que mejor sabe
- **Estandarización**: Via SKILLS/SUBAGENTS compartidos
- **Automatización**: Elimina cambio manual entre CLIs
- **Recuperabilidad**: Checkpoints permiten retomar si falla

### Principio de Diseño: Archivos como Contrato

```
┌─────────────────────────────────────────────────────────────────┐
│  ANTES (Complejo - Parsing de stdout)                          │
│                                                                 │
│  Agente A → stdout → Parser → Extrae datos → Prompt → Agente B │
│             ^^^^                                                │
│             Frágil, cambia con versiones del CLI                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AHORA (Simple - Archivos como interfaz)                        │
│                                                                 │
│  Agente A: "Escribe tu plan en .orchestra/plan.md"             │
│  Orquestador: Verifica que plan.md existe                       │
│  Agente B: "Lee .orchestra/plan.md y trabaja"                  │
│                                                                 │
│  Sin parsing. Sin fragilidad. Solo verificar existencia.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Alto Nivel

### Flujo de Orquestación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USUARIO                                    │
│                         "Crea un API REST"                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        META-ORQUESTADOR (CLI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │Intent Parser │→ │Skill Resolver│→ │  Router      │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│         │                  │                │                           │
│         ▼                  ▼                ▼                           │
│  "feature:backend"   "backend,api,db"   "arquitecto→ejecutor→auditor"  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  ARQUITECTO   │         │   EJECUTOR    │         │    AUDITOR    │
│  Claude Opus  │────────▶│   GLM 4.7     │────────▶│  Gemini CLI   │
│               │         │       │       │         │               │
│ Planifica en  │         │       ▼       │         │ Revisa y      │
│ PLAN.md       │         │  ┌─────────┐  │         │ retroalimenta │
│               │         │  │CONSULTOR│  │         │               │
│               │         │  │Codex CLI│  │         │               │
│               │         │  └─────────┘  │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │    CONTEXT MANAGER       │
                    │  .orchestra/context.md   │
                    │  .orchestra/plan.md      │
                    │  .orchestra/audit.md     │
                    └──────────────────────────┘
```

### Estructura de Directorios (Propuesta)

```
proyecto-raiz/
├── ai-core/                      # Submódulo/copia
│   ├── run.sh                    # Punto de entrada (modificado)
│   ├── SKILLS/                   # Knowledge base
│   ├── SUBAGENTS/                # Agentes especializados
│   │
│   └── orchestra/                # [NUEVO] Código del orquestador
│       ├── bin/
│       │   └── orchestra         # CLI ejecutable
│       │
│       ├── src/
│       │   ├── cli/              # Interfaz de usuario
│       │   │   ├── index.ts      # Entry point
│       │   │   ├── commands/     # Comandos CLI
│       │   │   └── ui/           # Componentes TUI (opcional)
│       │   │
│       │   ├── orchestrator/     # Lógica de orquestación
│       │   │   ├── Router.ts     # Enruta tareas a agentes
│       │   │   ├── IntentParser.ts
│       │   │   └── SkillResolver.ts
│       │   │
│       │   ├── agents/           # Definición de roles
│       │   │   ├── Architect.ts  # Claude Opus
│       │   │   ├── Executor.ts   # GLM 4.7
│       │   │   ├── Auditor.ts    # Gemini CLI
│       │   │   └── Consultant.ts # Codex CLI
│       │   │
│       │   ├── adapters/         # Wrappers para CLIs
│       │   │   ├── BaseAdapter.ts
│       │   │   ├── ClaudeAdapter.ts
│       │   │   ├── GeminiAdapter.ts
│       │   │   ├── GLMAdapter.ts
│       │   │   └── CodexAdapter.ts
│       │   │
│       │   └── memory/           # Gestión de contexto
│       │       ├── ContextManager.ts
│       │       └── FileStore.ts
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── .orchestra/                   # [NUEVO] Estado de orquestación
│   ├── state.json                # Estado actual (fase, iteración, timestamps)
│   ├── plan.md                   # Plan del Arquitecto
│   ├── audit.md                  # Feedback del Auditor
│   ├── help-needed.md            # Cuando Ejecutor necesita Consultor
│   ├── solution.md               # Respuesta del Consultor
│   │
│   ├── checkpoints/              # [NUEVO] Puntos de recuperación
│   │   ├── 001-plan.md           # Snapshot del plan
│   │   ├── 002-exec-1.md         # Primera ejecución
│   │   └── 003-audit-1.md        # Primera auditoría
│   │
│   ├── rate-limits.json          # [NUEVO] Tracking de uso por CLI
│   │
│   ├── templates/                # VERSIONADO - se commitea
│   │   ├── plan-template.md
│   │   └── audit-criteria.md
│   │
│   └── history/                  # Sesiones pasadas (para análisis)
│
├── CLAUDE.md                     # Ya existe (via run.sh)
├── GEMINI.md                     # Ya existe (via run.sh)
└── src/                          # Código del proyecto
```

---

## Roles de Agentes

### 1. Arquitecto (Claude Opus 4.5)

```yaml
Rol: Planificación y Diseño
CLI: claude (con modelo opus)
Trigger: Inicio de cada tarea
Output: .orchestra/plan.md

Responsabilidades:
  - Analizar el prompt del usuario
  - Diseñar la arquitectura de la solución
  - Crear plan de implementación paso a paso
  - Identificar skills necesarios (lee SKILLS/)
  - Estimar complejidad

Prompt Template: "Actúa como Senior Architect.
  Lee ai-core/SKILLS/{detected_skills}/SKILL.md antes de planificar.
  Crea un plan detallado en .orchestra/plan.md con:
  - Objetivo
  - Pasos numerados
  - Archivos a crear/modificar
  - Dependencias
  - Criterios de aceptación"
```

### 2. Ejecutor (GLM 4.7 via z.ai)

```yaml
Rol: Implementación y Refactorización
CLI: claude --model glm-4.7 (via z.ai integration)
Trigger: Después del Arquitecto
Input: .orchestra/plan.md
Output: Código en el proyecto

Responsabilidades:
  - Leer el plan del Arquitecto
  - Implementar paso a paso
  - Si tiene dudas algorítmicas → Consultor
  - Seguir los SKILLS relevantes
  - Escribir tests básicos

Prompt Template: "Actúa como Senior Developer.
  Lee .orchestra/plan.md y ejecuta paso a paso.
  Para cada paso:
  1. Lee el skill relevante de ai-core/SKILLS/
  2. Implementa siguiendo las mejores prácticas
  3. Si tienes problemas algorítmicos, PARA y escribe en .orchestra/help-needed.md
  Cuando termines, escribe 'DONE' en .orchestra/status.md"
```

### 3. Consultor (Codex CLI)

```yaml
Rol: Respaldo Algorítmico
CLI: codex
Trigger: Cuando Ejecutor necesita ayuda
Input: .orchestra/help-needed.md
Output: .orchestra/solution.md

Responsabilidades:
  - Resolver problemas algorítmicos específicos
  - Proporcionar snippets de código
  - Sugerir optimizaciones

Prompt Template: "El desarrollador necesita ayuda con:
  {contenido de help-needed.md}

  Proporciona una solución clara y concisa.
  Escribe tu respuesta en .orchestra/solution.md"
```

### 4. Auditor (Gemini CLI)

```yaml
Rol: Revisión y Pruebas
CLI: gemini
Trigger: Después del Ejecutor
Input: Código implementado + plan original
Output: .orchestra/audit.md

Responsabilidades:
  - Verificar que el código cumple el plan
  - Identificar bugs y mejoras
  - Sugerir refactorizaciones
  - Aprobar o rechazar para otra iteración

Prompt Template: "Actúa como Senior Code Reviewer.
  Compara:
  - Plan original: .orchestra/plan.md
  - Código implementado: {archivos modificados}

  Escribe en .orchestra/audit.md:
  - APPROVED: si todo está bien
  - NEEDS_WORK: + lista de mejoras requeridas

  Sé estricto pero justo."
```

---

## Flujo de Ejecución Detallado

### Diagrama de Estados

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  INIT   │────▶│  PLANNING   │────▶│  EXECUTING  │────▶│  AUDITING   │
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                      │                    │                    │
                      │                    │                    │
                      │              ┌─────▼─────┐              │
                      │              │ CONSULTING│              │
                      │              └───────────┘              │
                      │                    │                    │
                      │                    ▼                    ▼
                      │              ┌───────────────────────────┐
                      │              │      NEEDS_WORK?          │
                      │              └───────────────────────────┘
                      │                         │
                      │            ┌────────────┴────────────┐
                      │            │                         │
                      │            ▼ YES                     ▼ NO
                      │     ┌─────────────┐           ┌─────────────┐
                      └─────│  EXECUTING  │           │   COMPLETE  │
                            └─────────────┘           └─────────────┘
```

### Pseudocódigo del Loop Principal (v2 - Basado en Archivos)

```typescript
async function orchestrate(userPrompt: string): Promise<void> {
  const stateManager = new StateManager(".orchestra/");
  const rateLimiter = new RateLimiter(".orchestra/rate-limits.json");
  const recovery = new RecoveryManager(stateManager);

  // Verificar si hay sesión pendiente
  if (await recovery.canResume()) {
    console.log('📂 Sesión anterior detectada. Usa "resume" para continuar.');
    return;
  }

  // Inicializar nueva sesión
  await stateManager.init({ task: userPrompt });
  const skills = await skillResolver.detect(userPrompt);

  // ═══════════════════════════════════════════════════════════════
  // 1. PLANNING (Arquitecto)
  // ═══════════════════════════════════════════════════════════════
  console.log("🏗️  Arquitecto planificando...");
  await stateManager.setPhase("planning");

  const architectPrompt = buildArchitectPrompt(userPrompt, skills);
  await executeWithRateLimit(rateLimiter, "claude-opus", architectPrompt);

  // Verificar que el archivo fue creado (no parseamos contenido)
  if (!(await exists(".orchestra/plan.md"))) {
    throw new Error("Arquitecto no creó plan.md");
  }

  await stateManager.createCheckpoint("plan");

  // ═══════════════════════════════════════════════════════════════
  // 2-4. LOOP: EXECUTING → CONSULTING? → AUDITING
  // ═══════════════════════════════════════════════════════════════
  let approved = false;
  let iterations = 0;
  const MAX_ITERATIONS = 3;

  while (!approved && iterations < MAX_ITERATIONS) {
    iterations++;
    await stateManager.setIteration(iterations);

    // ─────────────────────────────────────────────────────────────
    // 2. EXECUTING (Ejecutor)
    // ─────────────────────────────────────────────────────────────
    console.log(`⚡ Ejecutor implementando (iteración ${iterations})...`);
    await stateManager.setPhase("executing");

    const executorPrompt = buildExecutorPrompt(iterations);
    await executeWithRateLimit(rateLimiter, "claude-glm", executorPrompt);

    // ─────────────────────────────────────────────────────────────
    // 3. CONSULTING (Solo si el Ejecutor lo necesita)
    // ─────────────────────────────────────────────────────────────
    if (await exists(".orchestra/help-needed.md")) {
      console.log("🤔 Ejecutor necesita ayuda, consultando...");
      await stateManager.setPhase("consulting");

      const consultPrompt = buildConsultantPrompt();
      await executeWithRateLimit(rateLimiter, "codex", consultPrompt);

      // Limpiar help-needed después de responder
      await fs.unlink(".orchestra/help-needed.md");

      // Ejecutor continúa
      console.log("⚡ Ejecutor continuando con la solución...");
      await stateManager.setPhase("executing");
      await executeWithRateLimit(
        rateLimiter,
        "claude-glm",
        buildContinuePrompt(),
      );
    }

    await stateManager.createCheckpoint(`exec-${iterations}`);

    // ─────────────────────────────────────────────────────────────
    // 4. AUDITING (Auditor)
    // ─────────────────────────────────────────────────────────────
    console.log("🔍 Auditor revisando...");
    await stateManager.setPhase("auditing");

    const auditorPrompt = buildAuditorPrompt();
    await executeWithRateLimit(rateLimiter, "gemini", auditorPrompt);

    // Verificar resultado del auditor
    const auditResult = await fs.readFile(".orchestra/audit.md", "utf-8");

    if (auditResult.includes("APPROVED")) {
      approved = true;
    } else if (auditResult.includes("NEEDS_WORK")) {
      console.log("📝 Mejoras requeridas, iterando...");
      // El archivo audit.md contiene el feedback para la siguiente iteración
    } else {
      console.warn("⚠️  Resultado de auditoría no reconocido");
    }

    await stateManager.createCheckpoint(`audit-${iterations}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════════════════════
  if (approved) {
    console.log("✅ Tarea completada exitosamente");
    await stateManager.setPhase("completed");
  } else {
    console.log("⚠️  Máximo de iteraciones alcanzado");
    await stateManager.setPhase("max_iterations");
  }

  // Mostrar resumen
  await showSummary(stateManager);
}

// Helper: Ejecutar con manejo de rate limit
async function executeWithRateLimit(
  rateLimiter: RateLimiter,
  cli: string,
  prompt: string,
): Promise<void> {
  const decision = await rateLimiter.checkBeforeCall(cli);

  if (!decision.proceed) {
    throw new RateLimitError(cli, decision.waitUntil);
  }

  const adapter = decision.useFallback
    ? getAdapter(decision.fallbackCli!)
    : getAdapter(cli);

  if (decision.useFallback) {
    console.log(`📊 Usando ${decision.fallbackCli} como fallback`);
  }

  await adapter.execute({ prompt });
  await rateLimiter.recordUsage(adapter.name);
}
```

---

## Implementación de Adaptadores (Simplificada v2)

### Principio: Modo --print (No Interactivo)

```bash
# Los CLIs tienen modos no-interactivos que simplifican todo:

# Claude CLI
claude --print "tu prompt aquí"
claude -p "prompt" --output-format json

# Gemini CLI
gemini -p "prompt"

# Codex CLI (diseñado para scripting)
codex "prompt" --quiet

# NO necesitamos node-pty ni TTY simulado
```

### BaseAdapter (Interfaz Simplificada)

```typescript
// orchestra/src/adapters/BaseAdapter.ts

export interface AdapterConfig {
  command: string; // CLI command (e.g., 'claude', 'gemini')
  model?: string; // Model override
  timeout?: number; // Max execution time (default: 10 min)
  printFlag: string; // Flag para modo no-interactivo ('--print', '-p', etc.)
}

export interface ExecuteOptions {
  prompt: string;
  workingDir?: string;
  // NO parseamos output - el agente escribe a archivos directamente
}

export interface ExecuteResult {
  success: boolean;
  exitCode: number;
  duration: number; // Para métricas
  error?: string;
}

export abstract class BaseAdapter {
  protected config: AdapterConfig;

  abstract execute(options: ExecuteOptions): Promise<ExecuteResult>;
  abstract isAvailable(): Promise<boolean>;
  abstract checkRateLimit(): Promise<RateLimitStatus>;
}

export interface RateLimitStatus {
  available: boolean;
  remaining?: number; // Si el CLI lo expone
  resetsAt?: Date;
  suggestion?: string; // "Usar Gemini como fallback"
}
```

### ClaudeAdapter (v2 - Simplificado)

```typescript
// orchestra/src/adapters/ClaudeAdapter.ts

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class ClaudeAdapter extends BaseAdapter {
  constructor(model: "opus" | "sonnet" | "glm-4.7" = "opus") {
    super({
      command: "claude",
      model: model,
      timeout: 600000, // 10 min
      printFlag: "--print",
    });
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const startTime = Date.now();

    try {
      // Comando simple - sin parsing de output
      await execFileAsync(
        this.config.command,
        [this.config.printFlag, "--model", this.config.model!, options.prompt],
        {
          cwd: options.workingDir || process.cwd(),
          timeout: this.config.timeout,
          maxBuffer: 50 * 1024 * 1024, // 50MB
        },
      );

      return {
        success: true,
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        exitCode: error.code || 1,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync("which", [this.config.command]);
      return true;
    } catch {
      return false;
    }
  }

  async checkRateLimit(): Promise<RateLimitStatus> {
    // Leer de .orchestra/rate-limits.json
    const limits = await this.loadRateLimits();

    if (limits.claude.remaining < 5) {
      return {
        available: false,
        remaining: limits.claude.remaining,
        resetsAt: new Date(limits.claude.resetsAt),
        suggestion: "Usar Gemini como Arquitecto alternativo",
      };
    }

    return { available: true, remaining: limits.claude.remaining };
  }
}
```

### GeminiAdapter

```typescript
// orchestra/src/adapters/GeminiAdapter.ts

export class GeminiAdapter extends BaseAdapter {
  constructor() {
    super({
      command: "gemini",
      printFlag: "-p",
      timeout: 600000,
    });
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const startTime = Date.now();

    try {
      await execFileAsync(
        this.config.command,
        [this.config.printFlag, options.prompt],
        {
          cwd: options.workingDir || process.cwd(),
          timeout: this.config.timeout,
        },
      );

      return {
        success: true,
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        exitCode: error.code || 1,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
```

### CodexAdapter

```typescript
// orchestra/src/adapters/CodexAdapter.ts

export class CodexAdapter extends BaseAdapter {
  constructor() {
    super({
      command: "codex",
      printFlag: "--quiet",
      timeout: 300000, // 5 min - consultas son más cortas
    });
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const startTime = Date.now();

    try {
      await execFileAsync(
        this.config.command,
        [options.prompt, this.config.printFlag],
        {
          cwd: options.workingDir || process.cwd(),
          timeout: this.config.timeout,
        },
      );

      return {
        success: true,
        exitCode: 0,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        exitCode: error.code || 1,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
```

---

## Integración con SKILLS

### SkillResolver

```typescript
// orchestra/src/orchestrator/SkillResolver.ts

interface DetectedSkill {
  name: string;
  path: string;
  confidence: number;
}

export class SkillResolver {
  private skillsPath: string;
  private skillKeywords: Map<string, string[]>;

  constructor(aiCorePath: string) {
    this.skillsPath = path.join(aiCorePath, "SKILLS");
    this.skillKeywords = this.loadKeywordMap();
  }

  /**
   * Detecta skills relevantes basándose en el prompt
   */
  async detect(prompt: string): Promise<DetectedSkill[]> {
    const words = prompt.toLowerCase().split(/\s+/);
    const detected: DetectedSkill[] = [];

    for (const [skill, keywords] of this.skillKeywords) {
      const matches = keywords.filter((kw) => words.includes(kw));
      if (matches.length > 0) {
        detected.push({
          name: skill,
          path: path.join(this.skillsPath, skill, "SKILL.md"),
          confidence: matches.length / keywords.length,
        });
      }
    }

    // Ordenar por confianza
    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Genera instrucción para que el agente lea los skills
   */
  generateSkillInstructions(skills: DetectedSkill[]): string {
    if (skills.length === 0) return "";

    const instructions = skills
      .map((s) => `- Lee y aplica: ${s.path}`)
      .join("\n");

    return `
ANTES DE EMPEZAR, lee estos skills de ai-core:
${instructions}

Aplica las mejores prácticas descritas en cada skill.
`;
  }

  private loadKeywordMap(): Map<string, string[]> {
    return new Map([
      [
        "security",
        ["auth", "login", "password", "token", "jwt", "oauth", "seguridad"],
      ],
      [
        "database",
        ["db", "database", "sql", "query", "migration", "schema", "tabla"],
      ],
      [
        "testing",
        ["test", "tests", "testing", "unit", "integration", "e2e", "jest"],
      ],
      ["backend", ["api", "rest", "graphql", "endpoint", "server", "backend"]],
      [
        "frontend",
        ["ui", "component", "react", "vue", "frontend", "css", "html"],
      ],
      [
        "infrastructure",
        ["docker", "kubernetes", "k8s", "terraform", "deploy", "ci/cd"],
      ],
      // ... más mappings
    ]);
  }
}
```

---

## Comandos del CLI

### Comandos Propuestos

```bash
# Iniciar orquestación interactiva
ai-core start "Crea un API REST para usuarios"

# Iniciar con rol específico forzado
ai-core start --role=architect "Diseña la arquitectura"
ai-core start --role=executor "Implementa el archivo user.ts"

# Ver estado actual
ai-core status

# Continuar tarea pendiente
ai-core continue

# Ver historial
ai-core history

# Ejecutar solo un agente específico
ai-core run architect "Planifica esto"
ai-core run executor --plan=.orchestra/plan.md
ai-core run auditor --files=src/

# Configuración
ai-core config set architect.model opus
ai-core config set executor.model glm-4.7
ai-core config list

# Verificar CLIs disponibles
ai-core doctor
```

### Implementación del CLI

```typescript
// orchestra/src/cli/index.ts

import { Command } from "commander";
import { Orchestrator } from "../orchestrator/Orchestrator";

const program = new Command();

program
  .name("ai-core")
  .description("Meta-Orchestrator for AI development tools")
  .version("0.1.0");

program
  .command("start <prompt>")
  .description("Start orchestrated development task")
  .option(
    "-r, --role <role>",
    "Force specific role (architect|executor|auditor|consultant)",
  )
  .option("--no-audit", "Skip auditor phase")
  .option("--max-iterations <n>", "Max audit iterations", "3")
  .action(async (prompt, options) => {
    const orchestrator = new Orchestrator();
    await orchestrator.run(prompt, options);
  });

program
  .command("status")
  .description("Show current orchestration status")
  .action(async () => {
    // Show .orchestra/ status
  });

program
  .command("doctor")
  .description("Check CLI availability")
  .action(async () => {
    console.log("Checking available CLIs...\n");

    const checks = [
      { name: "Claude CLI", cmd: "claude --version" },
      { name: "Gemini CLI", cmd: "gemini --version" },
      { name: "Codex CLI", cmd: "codex --version" },
    ];

    for (const check of checks) {
      // Run check and display result
    }
  });

program.parse();
```

---

## Modificación de run.sh

### Cambios Propuestos

```bash
# Agregar al final de run.sh (después de la instalación actual)

# ============================================================================
# INSTALACIÓN DEL ORQUESTADOR
# ============================================================================

echo ""
echo -e "${BLUE}Instalando Meta-Orquestador...${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js no encontrado. El orquestador requiere Node.js 18+${NC}"
    echo -e "   Instala Node.js y ejecuta: cd ai-core/orchestra && npm install"
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}⚠️  Node.js ${NODE_VERSION} detectado. Se requiere 18+${NC}"
    else
        echo -e "  ✓ ${GREEN}Node.js $(node -v) detectado${NC}"

        # Instalar dependencias si existen
        if [ -f "$AI_CORE_DIR/orchestra/package.json" ]; then
            echo -e "${CYAN}Instalando dependencias del orquestador...${NC}"
            cd "$AI_CORE_DIR/orchestra" && npm install --silent

            # Crear symlink global (opcional)
            # npm link

            echo -e "  ✓ ${GREEN}Orquestador instalado${NC}"
        fi
    fi
fi

# Crear directorio .orchestra en el proyecto
echo -e "${CYAN}Creando directorio .orchestra/...${NC}"
mkdir -p "$PROJECT_ROOT/.orchestra"
touch "$PROJECT_ROOT/.orchestra/.gitkeep"
echo -e "  ✓ ${GREEN}.orchestra/ creado${NC}"

# Agregar .orchestra a .gitignore si no existe
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
    if ! grep -q "^\.orchestra" "$PROJECT_ROOT/.gitignore"; then
        echo "" >> "$PROJECT_ROOT/.gitignore"
        echo "# AI-Core Orchestrator state" >> "$PROJECT_ROOT/.gitignore"
        echo ".orchestra/" >> "$PROJECT_ROOT/.gitignore"
        echo -e "  ✓ ${GREEN}.orchestra/ agregado a .gitignore${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Orquestador listo. Uso:${NC}"
echo -e "  ${CYAN}cd $PROJECT_ROOT${NC}"
echo -e "  ${CYAN}./ai-core/orchestra/bin/orchestra start \"Tu tarea aquí\"${NC}"
```

---

## MVP: Alcance Mínimo (Plan Simplificado v2)

### Filosofía: Validar Rápido, Iterar Después

```
MVP v0.1: Solo 2 agentes (Arquitecto + Ejecutor)
MVP v0.2: Agregar Auditor (si v0.1 funciona)
MVP v0.3: Agregar Consultor (si v0.2 funciona)
MVP v1.0: TUI completa y pulido
```

### Fase 1: Proof of Concept (1 día)

```yaml
Objetivo: Validar control de CLIs con modo --print

Entregables:
  - [ ] Script bash simple que:
        1. Llama a claude --print "Crea un plan para hello.py"
        2. Verifica que el agente escribió .orchestra/plan.md
        3. Llama a claude --print --model glm-4.7 "Lee plan.md e implementa"
        4. Verifica que hello.py existe

Criterio de éxito:
  - El script completa sin intervención manual
  - Los archivos esperados existen

Código del PoC (bash):
  #!/bin/bash
  mkdir -p .orchestra

  # Arquitecto
  claude --print "Eres un arquitecto. Crea un plan para 'hello.py' \
    que imprima 'Hola Mundo'. Escribe el plan en .orchestra/plan.md"

  # Verificar
  if [ ! -f .orchestra/plan.md ]; then
    echo "ERROR: plan.md no fue creado"
    exit 1
  fi

  # Ejecutor
  claude --print --model glm-4.7 "Eres un desarrollador. \
    Lee .orchestra/plan.md e implementa el código."

  # Verificar
  if [ ! -f hello.py ]; then
    echo "ERROR: hello.py no fue creado"
    exit 1
  fi

  echo "SUCCESS: MVP PoC completado"
```

### Fase 2: Orquestador Mínimo en TypeScript (3 días)

```yaml
Objetivo: Convertir el PoC a código estructurado

Entregables:
  - [ ] ClaudeAdapter funcional
  - [ ] Orchestrator básico (solo 2 agentes)
  - [ ] SkillResolver simple
  - [ ] CLI con comando "start"

Estructura mínima:
  orchestra/
  ├── src/
  │   ├── index.ts           # Entry point
  │   ├── adapters/
  │   │   └── ClaudeAdapter.ts
  │   ├── orchestrator/
  │   │   ├── Orchestrator.ts
  │   │   └── SkillResolver.ts
  │   └── prompts/
  │       ├── architect.txt
  │       └── executor.txt
  ├── package.json
  └── tsconfig.json

Criterio de éxito:
  ./orchestra start "Crea un API REST básico"
  → Arquitecto planifica
  → Ejecutor implementa
  → Archivos creados correctamente
```

### Fase 3: Checkpoints y Recuperación (2 días)

```yaml
Objetivo: Poder retomar si algo falla

Entregables:
  - [ ] state.json con fase actual
  - [ ] Directorio checkpoints/
  - [ ] Comando "resume" y "retry"

Sistema de checkpoints:
  .orchestra/
  ├── state.json
  │   {
  │     "sessionId": "abc123",
  │     "phase": "executing",
  │     "iteration": 1,
  │     "startedAt": "2025-01-27T10:00:00Z",
  │     "lastCheckpoint": "001-plan"
  │   }
  └── checkpoints/
      └── 001-plan.md

Comandos:
  ./orchestra resume      # Continúa desde último checkpoint
  ./orchestra retry       # Reintenta último paso fallido
  ./orchestra status      # Muestra estado actual
```

### Fase 4: Agregar Auditor (2 días)

```yaml
Objetivo: Loop de revisión funcional

Entregables:
  - [ ] GeminiAdapter
  - [ ] Integración del Auditor
  - [ ] Loop hasta APPROVED o MAX_ITERATIONS

Flujo:
  Arquitecto → Ejecutor → Auditor
                  ↑          │
                  └──────────┘
                  (si NEEDS_WORK)
```

### Fase 5: Agregar Consultor (1 día)

```yaml
Objetivo: Soporte algorítmico bajo demanda

Entregables:
  - [ ] CodexAdapter
  - [ ] Detección de help-needed.md
  - [ ] Integración con flujo de Ejecutor

Trigger:
  Si Ejecutor escribe a .orchestra/help-needed.md
  → Orquestador detecta
  → Llama a Consultor
  → Consultor escribe a .orchestra/solution.md
  → Ejecutor continúa
```

### Fase 6: Rate Limiting y Fallbacks (1 día)

```yaml
Objetivo: Manejo inteligente de límites

Entregables:
  - [ ] rate-limits.json tracking
  - [ ] Fallback automático entre CLIs
  - [ ] Warnings cuando se acerca al límite

rate-limits.json:
  {
    "claude": {
      "used": 35,
      "estimatedLimit": 45,
      "lastReset": "2025-01-27T00:00:00Z",
      "resetsEvery": "3h"
    },
    "gemini": { ... },
    "codex": { ... }
  }
```

### Fase 7: TUI y Pulido (2 días)

```yaml
Objetivo: Experiencia de usuario premium

Entregables:
  - [ ] TUI con Ink
  - [ ] Spinners por fase
  - [ ] Progress de iteraciones
  - [ ] Modos --simple, --json, --quiet
  - [ ] Documentación

Output final:
  ┌─────────────────────────────────────────────────┐
  │  🎯 META-ORCHESTRATOR v0.1.0                    │
  ├─────────────────────────────────────────────────┤
  │  Task: "Crea un API REST para usuarios"         │
  │                                                 │
  │  ✓ Arquitecto completado           [00:45]     │
  │  ⠸ Ejecutor trabajando...          [01:23]     │
  │  ○ Auditor                          pending     │
  │                                                 │
  │  Iteration: 1/3  │  Rate: Claude 38/45         │
  └─────────────────────────────────────────────────┘
```

### Timeline Estimado

```
Semana 1:
  Día 1: PoC bash ✓
  Día 2-4: Orquestador mínimo TypeScript
  Día 5: Checkpoints

Semana 2:
  Día 1-2: Auditor
  Día 3: Consultor
  Día 4: Rate limiting
  Día 5: TUI básica

Semana 3 (opcional):
  - Pulido
  - Documentación
  - Tests
```

---

## Sistema de Checkpoints y Recuperación

### Estructura de state.json

```json
{
  "sessionId": "sess_20250127_103045",
  "task": "Crea un API REST para usuarios",
  "phase": "executing",
  "iteration": 2,
  "startedAt": "2025-01-27T10:30:45Z",
  "lastActivity": "2025-01-27T10:45:23Z",
  "agents": {
    "architect": { "status": "completed", "duration": 45000 },
    "executor": { "status": "in_progress", "duration": null },
    "auditor": { "status": "pending" },
    "consultant": { "status": "not_needed" }
  },
  "checkpoints": [
    { "id": "001", "phase": "planning", "file": "checkpoints/001-plan.md" },
    {
      "id": "002",
      "phase": "executing_1",
      "file": "checkpoints/002-exec-1.md"
    },
    { "id": "003", "phase": "auditing_1", "file": "checkpoints/003-audit-1.md" }
  ],
  "canResume": true,
  "lastError": null
}
```

### Comandos de Recuperación

```bash
# Ver estado actual
./orchestra status
# Output:
#   Session: sess_20250127_103045
#   Task: "Crea un API REST para usuarios"
#   Phase: executing (iteration 2/3)
#   Last activity: 5 minutes ago
#   Checkpoints: 3

# Continuar desde donde quedó
./orchestra resume
# Detecta el último checkpoint y continúa

# Reintentar el último paso fallido
./orchestra retry
# Útil si hubo un error temporal (rate limit, network, etc.)

# Ver historial de checkpoints
./orchestra checkpoints
# Output:
#   001 │ planning    │ 00:45 │ ✓
#   002 │ executing_1 │ 02:15 │ ✓
#   003 │ auditing_1  │ 00:30 │ ✓
#   004 │ executing_2 │ --:-- │ ← current

# Rollback a un checkpoint específico
./orchestra rollback 002
# Vuelve al estado después del checkpoint 002
```

### Lógica de Recuperación

```typescript
// orchestra/src/orchestrator/RecoveryManager.ts

export class RecoveryManager {
  async canResume(): Promise<boolean> {
    const state = await this.loadState();
    return state.canResume && !state.lastError?.fatal;
  }

  async resume(): Promise<void> {
    const state = await this.loadState();

    switch (state.phase) {
      case "planning":
        // Reiniciar desde el principio
        await this.orchestrator.startPlanning(state.task);
        break;

      case "executing":
        // Continuar ejecución
        await this.orchestrator.continueExecuting(state.iteration);
        break;

      case "auditing":
        // Continuar auditoría
        await this.orchestrator.continueAuditing(state.iteration);
        break;

      case "consulting":
        // El ejecutor estaba esperando al consultor
        await this.orchestrator.continueConsulting();
        break;
    }
  }

  async retry(): Promise<void> {
    const state = await this.loadState();
    const lastCheckpoint = state.checkpoints[state.checkpoints.length - 1];

    // Restaurar estado del checkpoint
    await this.restoreCheckpoint(lastCheckpoint.id);

    // Reintentar el paso siguiente
    await this.resume();
  }

  private async createCheckpoint(phase: string): Promise<void> {
    const state = await this.loadState();
    const id = String(state.checkpoints.length + 1).padStart(3, "0");

    // Copiar archivos relevantes
    await fs.copy(".orchestra/plan.md", `.orchestra/checkpoints/${id}-plan.md`);

    // Actualizar state.json
    state.checkpoints.push({
      id,
      phase,
      file: `checkpoints/${id}-${phase}.md`,
    });
    await this.saveState(state);
  }
}
```

---

## Sistema de Rate Limiting

### Tracking de Uso

```json
// .orchestra/rate-limits.json
{
  "lastUpdated": "2025-01-27T10:45:00Z",
  "limits": {
    "claude": {
      "used": 38,
      "estimated": 45,
      "confidence": 0.8,
      "lastReset": "2025-01-27T08:00:00Z",
      "resetPeriod": "3h",
      "nextReset": "2025-01-27T11:00:00Z",
      "history": [
        { "date": "2025-01-26", "totalUsed": 120 },
        { "date": "2025-01-25", "totalUsed": 95 }
      ]
    },
    "gemini": {
      "used": 12,
      "estimated": 50,
      "confidence": 0.7,
      "lastReset": "2025-01-27T00:00:00Z",
      "resetPeriod": "24h"
    },
    "codex": {
      "used": 5,
      "estimated": 20,
      "confidence": 0.6,
      "lastReset": "2025-01-27T00:00:00Z",
      "resetPeriod": "24h"
    }
  }
}
```

### Lógica de Rate Limiting

```typescript
// orchestra/src/orchestrator/RateLimiter.ts

export class RateLimiter {
  private readonly WARNING_THRESHOLD = 0.8; // 80% usado
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% usado

  async checkBeforeCall(cli: string): Promise<RateLimitDecision> {
    const limits = await this.loadLimits();
    const cliLimits = limits[cli];

    const usageRatio = cliLimits.used / cliLimits.estimated;

    if (usageRatio >= this.CRITICAL_THRESHOLD) {
      // Buscar fallback
      const fallback = this.findFallback(cli);
      if (fallback) {
        return {
          proceed: true,
          useFallback: true,
          fallbackCli: fallback,
          reason: `${cli} at ${Math.round(usageRatio * 100)}% capacity`,
        };
      } else {
        return {
          proceed: false,
          reason: `${cli} at limit and no fallback available`,
          waitUntil: cliLimits.nextReset,
        };
      }
    }

    if (usageRatio >= this.WARNING_THRESHOLD) {
      console.warn(`⚠️  ${cli} at ${Math.round(usageRatio * 100)}% capacity`);
    }

    return { proceed: true, useFallback: false };
  }

  private findFallback(cli: string): string | null {
    const fallbacks: Record<string, string[]> = {
      claude: ["gemini", "codex"],
      gemini: ["claude", "codex"],
      codex: ["claude", "gemini"],
    };

    for (const fallback of fallbacks[cli] || []) {
      const limits = this.limits[fallback];
      if (limits.used / limits.estimated < this.WARNING_THRESHOLD) {
        return fallback;
      }
    }

    return null;
  }

  async recordUsage(cli: string): Promise<void> {
    const limits = await this.loadLimits();
    limits[cli].used++;
    limits.lastUpdated = new Date().toISOString();
    await this.saveLimits(limits);
  }

  // Estimar límites basándose en errores de rate limit
  async handleRateLimitError(cli: string): Promise<void> {
    const limits = await this.loadLimits();

    // Si llegamos a un error de rate limit, ajustar estimado
    limits[cli].estimated = limits[cli].used;
    limits[cli].confidence = 1.0; // Ahora estamos seguros

    await this.saveLimits(limits);
  }
}
```

### Integración con Orquestador

```typescript
// En Orchestrator.ts

async executeAgent(role: string, prompt: string): Promise<void> {
  const adapter = this.getAdapter(role);

  // Verificar rate limit antes de llamar
  const decision = await this.rateLimiter.checkBeforeCall(adapter.name);

  if (!decision.proceed) {
    throw new RateLimitError(decision.reason, decision.waitUntil);
  }

  if (decision.useFallback) {
    console.log(`📊 Using ${decision.fallbackCli} as fallback for ${adapter.name}`);
    adapter = this.getAdapter(decision.fallbackCli);
  }

  try {
    await adapter.execute({ prompt });
    await this.rateLimiter.recordUsage(adapter.name);
  } catch (error) {
    if (this.isRateLimitError(error)) {
      await this.rateLimiter.handleRateLimitError(adapter.name);
      // Reintentar con fallback
      return this.executeAgent(role, prompt);
    }
    throw error;
  }
}
```

---

## Riesgos y Mitigaciones (Actualizado v2)

### 1. Control de CLIs (MITIGADO)

| Riesgo                 | Probabilidad | Impacto   | Mitigación                       | Estado      |
| ---------------------- | ------------ | --------- | -------------------------------- | ----------- |
| CLI requiere TTY real  | ~~Alta~~     | ~~Alto~~  | Usar modo `--print`              | ✅ Resuelto |
| Output no estructurado | ~~Media~~    | ~~Medio~~ | Archivos como interfaz           | ✅ Resuelto |
| CLI actualiza y rompe  | Media        | Medio     | Tests de humo antes de orquestar | Pendiente   |

### 2. Consumo de Tokens/Límites (MITIGADO)

| Riesgo                     | Probabilidad | Impacto  | Mitigación                        | Estado      |
| -------------------------- | ------------ | -------- | --------------------------------- | ----------- |
| Loop infinito              | ~~Alta~~     | ~~Alto~~ | MAX_ITERATIONS=3 + timeout total  | ✅ Resuelto |
| Rate limit alcanzado       | Media        | Medio    | Sistema de fallback automático    | ✅ Diseñado |
| Contexto crece sin control | Baja         | Bajo     | Cada agente lee solo lo necesario | ✅ Resuelto |

### 3. Coordinación entre Agentes

| Riesgo                 | Probabilidad | Impacto | Mitigación                     | Estado    |
| ---------------------- | ------------ | ------- | ------------------------------ | --------- |
| Plan ambiguo           | Media        | Medio   | Template estricto + SKILLS     | Pendiente |
| Ejecutor no sigue plan | Media        | Alto    | Validación de archivos creados | Pendiente |
| Auditor muy estricto   | Baja         | Bajo    | Criterios configurables        | Pendiente |

### 4. Recuperación y Estado

| Riesgo                 | Probabilidad | Impacto | Mitigación               | Estado      |
| ---------------------- | ------------ | ------- | ------------------------ | ----------- |
| Falla a mitad de tarea | Media        | Alto    | Sistema de checkpoints   | ✅ Diseñado |
| Estado corrupto        | Baja         | Alto    | Validación de state.json | Pendiente   |
| Pérdida de sesión      | Baja         | Medio   | Checkpoints en disco     | ✅ Diseñado |

---

## Decisiones Técnicas

### ¿Por qué TypeScript?

```yaml
Pros:
  - Tipado estático para APIs de adaptadores
  - Ecosistema npm maduro
  - Compatible con Claude Code (mismo stack)
  - Fácil integración con Ink para TUI

Contras:
  - Requiere compilación
  - Node.js como dependencia

Alternativas consideradas:
  - Bash puro: Demasiado limitado para lógica compleja
  - Python: Buen candidato, pero menos afinidad con Claude Code
  - Go: Binario único, pero curva de aprendizaje
```

### ¿Por qué no usar APIs directamente?

```yaml
Decisión: Usar CLIs de suscripción en lugar de APIs

Razón principal:
  - Suscripciones mensuales (~$20-50/mes) vs APIs ($0.01-0.15/1K tokens)
  - Para desarrollo intensivo, suscripciones son más económicas
  - Ya tienes las suscripciones activas

Trade-offs:
  - Menos control sobre el formato de respuesta
  - Dependencia de estabilidad del CLI
  - Posibles limitaciones de rate en suscripciones

Mitigación:
  - Estructura de adaptadores permite agregar API providers después
  - Si un CLI falla, se puede implementar fallback a API
```

### Ubicación del Código

```yaml
Decisión: Dentro de ai-core/orchestra/

Razones:
  - ai-core ya se instala en proyectos
  - run.sh ya existe como punto de entrada
  - SKILLS y SUBAGENTS accesibles directamente
  - Un solo repositorio a mantener

Alternativa descartada: Proyecto separado
  - Requeriría manejar dos repos
  - Sincronización de versiones compleja
  - ai-core ya tiene la infraestructura
```

---

## Configuración de Agentes

### Archivo de Configuración (.orchestrarc.json)

```json
{
  "agents": {
    "architect": {
      "adapter": "claude",
      "model": "opus",
      "timeout": 300000,
      "maxTokens": 8000
    },
    "executor": {
      "adapter": "claude",
      "model": "glm-4.7",
      "timeout": 600000,
      "maxTokens": 16000
    },
    "auditor": {
      "adapter": "gemini",
      "model": "pro",
      "timeout": 300000
    },
    "consultant": {
      "adapter": "codex",
      "timeout": 120000
    }
  },
  "orchestration": {
    "maxIterations": 3,
    "autoApprove": false,
    "verboseLogging": true
  },
  "skills": {
    "autoDetect": true,
    "always": ["security", "testing"]
  }
}
```

---

## Decisiones del Usuario (Aprobadas)

### 1. Fallback de CLI: Usar segundo mejor

```yaml
Decisión: Si un CLI no está disponible, usar el siguiente mejor para esa tarea

Orden de fallback por rol:
  Arquitecto: 1. Claude Opus (preferido - mejor razonamiento)
    2. Gemini Pro (alternativa)
    3. GLM 4.7 (último recurso)

  Ejecutor: 1. GLM 4.7 (preferido - optimizado para código)
    2. Claude Sonnet (alternativa - rápido)
    3. Codex (último recurso)

  Auditor: 1. Gemini Pro (preferido - bueno en revisión)
    2. Claude Opus (alternativa - crítico)
    3. GLM 4.7 (último recurso)

  Consultor: 1. Codex (preferido - algoritmos)
    2. Claude Opus (alternativa)
    3. Gemini Pro (último recurso)

Implementación:
  - Cada adaptador tiene método isAvailable()
  - Router intenta en orden hasta encontrar disponible
  - Log indica cuál CLI se usó y por qué
```

### 2. Autonomía: Totalmente autónomo

```yaml
Decisión: El orquestador ejecuta sin intervención hasta completar

Comportamiento:
  - No pide confirmación en ningún paso
  - Loop automático hasta APPROVED o MAX_ITERATIONS
  - Solo notifica al final con resumen

Safeguards (para evitar loops infinitos):
  - MAX_ITERATIONS = 3 (hardcoded)
  - Timeout por agente = 10 min
  - Timeout total = 30 min
  - Si mismo error 2 veces → abortar con reporte

Flags opcionales para override:
  --interactive    # Pedir confirmación en cada paso
  --approve-plan   # Solo aprobar plan, resto autónomo
```

### 3. Persistencia: Ignorar (con excepciones)

```yaml
Decisión: .orchestra/ ignorado por defecto, con subdirectorio versionable

Estructura:
  .orchestra/
  ├── .gitkeep              # Solo para crear directorio
  ├── context.md            # IGNORADO - estado temporal
  ├── plan.md               # IGNORADO - sesión actual
  ├── audit.md              # IGNORADO - feedback temporal
  ├── history/              # IGNORADO - sesiones pasadas
  │
  └── templates/            # VERSIONADO - templates reutilizables
      ├── plan-template.md
      └── audit-criteria.md

Razones:
  - Estado temporal no debe commitearse
  - Evita conflictos entre desarrolladores
  - Planes pueden contener contexto sensible
  - Templates sí son útiles compartir

.gitignore agregado:
  # AI-Core Orchestrator
  .orchestra/*
  !.orchestra/templates/
  !.orchestra/.gitkeep
```

### 4. Output: TUI rica con modos alternativos

```yaml
Decisión: TUI por defecto, con flags para otros modos

Modos disponibles:
  default (TUI):
    - Spinners animados por fase
    - Colores por estado (🟢 success, 🟡 working, 🔴 error)
    - Progress bar para iteraciones
    - Resumen final formateado

  --simple:
    - Solo texto plano con timestamps
    - Compatible con CI/CD
    - Sin códigos ANSI

  --json:
    - Output JSON estructurado
    - Para integración programática
    - Incluye métricas de tiempo

  --quiet:
    - Solo errores y resultado final
    - Para scripts

Ejemplo TUI:
  ┌─────────────────────────────────────────────┐
  │  🎯 META-ORCHESTRATOR v0.1.0                │
  ├─────────────────────────────────────────────┤
  │  Task: "Crea un API REST para usuarios"     │
  │                                             │
  │  ⠸ Arquitecto planificando...    [00:23]   │
  │  ○ Ejecutor                       pending   │
  │  ○ Auditor                        pending   │
  │                                             │
  │  Iteration: 1/3                             │
  └─────────────────────────────────────────────┘
```

---

## Próximos Pasos (Orden de Ejecución)

### Paso 1: PoC Bash (30 minutos)

```bash
# Crear y ejecutar el PoC para validar la idea
mkdir -p ai-core/orchestra/poc
cat > ai-core/orchestra/poc/test-flow.sh << 'EOF'
#!/bin/bash
# PoC: Validar que podemos orquestar CLIs

mkdir -p .orchestra
echo "Testing Architect (Claude Opus)..."
claude --print "Crea un plan simple para un script hello.py. \
  Escribe el plan en .orchestra/plan.md"

if [ -f .orchestra/plan.md ]; then
  echo "✓ Plan creado"
else
  echo "✗ Plan no fue creado"
  exit 1
fi

echo "Testing Executor (GLM 4.7)..."
claude --print --model glm-4.7 "Lee .orchestra/plan.md e implementa hello.py"

if [ -f hello.py ]; then
  echo "✓ Script creado"
  python hello.py
else
  echo "✗ Script no fue creado"
  exit 1
fi

echo "SUCCESS: PoC completado"
EOF
chmod +x ai-core/orchestra/poc/test-flow.sh
```

### Paso 2: Estructura del Proyecto (1 hora)

```bash
# Crear estructura inicial
mkdir -p ai-core/orchestra/{src/{adapters,orchestrator,cli},bin}
cd ai-core/orchestra
npm init -y
npm install typescript commander chalk ora
npm install -D @types/node ts-node
npx tsc --init
```

### Paso 3: Implementar MVP v0.1 (3 días)

```
Prioridad:
1. ClaudeAdapter con modo --print
2. Orchestrator básico (2 agentes)
3. CLI con comando "start"
4. Test con caso real
```

### Paso 4: Validar y Expandir

```
Si v0.1 funciona:
  → Agregar GeminiAdapter (Auditor)
  → Agregar checkpoints
  → Agregar rate limiting

Si v0.1 falla:
  → Analizar por qué
  → Ajustar enfoque
  → Documentar aprendizajes
```

---

## Métricas de Éxito

| Métrica                          | Target MVP | Target v1.0 |
| -------------------------------- | ---------- | ----------- |
| Tasa de éxito (tarea completada) | >70%       | >90%        |
| Tiempo promedio por tarea        | <10 min    | <5 min      |
| Iteraciones promedio             | <2         | <1.5        |
| Intervención manual requerida    | <30%       | <5%         |

---

## Referencias

- [z.ai GLM 4.7 + Claude Integration](https://docs.z.ai/devpack/tool/claude)
- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Claude Code Architecture](https://github.com/anthropics/claude-code)
- [Ink - React for CLIs](https://github.com/vadimdemedes/ink)

---

> **Nota**: Este documento es un plan vivo. Se actualizará según avance la implementación y se descubran nuevos requisitos o limitaciones técnicas.
