/**
 * Orquestador Principal
 *
 * Coordina el flujo: Arquitecto → Ejecutor → Consultor → Auditor
 *
 * Agentes con Fallback por límite de uso:
 * - Arquitecto: Codex → Gemini → GLM 4.7 (crea el plan de implementación)
 * - Ejecutor: GLM 4.7 (implementa el código)
 * - Auditor: Gemini → GLM 4.7 (revisa el código generado)
 * - Consultor: Codex → Gemini → GLM 4.7 (ayuda con problemas algorítmicos)
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { GLMAdapter } from '../adapters/GLMAdapter.js';
import { CodexAdapter } from '../adapters/CodexAdapter.js';
import { GeminiAdapter } from '../adapters/GeminiAdapter.js';
import { FallbackAdapter, type Adapter } from '../adapters/FallbackAdapter.js';
import { StateManager } from '../utils/StateManager.js';
import { buildArchitectPrompt } from '../prompts/architect.js';
import { buildExecutorPrompt, extractFilesFromPlan } from '../prompts/executor.js';
import {
  buildAuditorPrompt,
  buildSingleFileAuditorPrompt,
  parseAuditResponse,
  parseSingleFileAuditResponse,
  buildFixPrompt,
  isValidPythonCode,
  type AuditResult,
  type AuditIssue,
  type SingleFileAuditResult,
} from '../prompts/auditor.js';
import {
  buildSyntaxFixPrompt,
  buildCompleteCodePrompt,
  detectIncompleteCode,
  parseConsultantResponse,
} from '../prompts/consultant.js';
import { validateSyntax, detectLanguage } from '../utils/validators.js';
import { runTests, detectTestFramework } from '../utils/testRunner.js';
import { loadProjectConfig, mergeConfig } from '../utils/configLoader.js';
import { autoCommit, getGitStatus, type CommitResult } from '../utils/gitIntegration.js';
import type { OrchestratorConfig, AgentResult, TestResult, SyntaxValidationResult } from '../types.js';

const execFileAsync = promisify(execFile);

/**
 * Ejecuta tareas en paralelo con control de concurrencia
 */
async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  maxConcurrency: number,
  onProgress?: (completed: number, total: number, inProgress: number) => void
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  let completedCount = 0;
  let inProgressCount = 0;

  async function processNext(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      inProgressCount++;
      onProgress?.(completedCount, items.length, inProgressCount);

      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        // Store error as result - caller should handle
        results[index] = { error } as R;
      }

      inProgressCount--;
      completedCount++;
      onProgress?.(completedCount, items.length, inProgressCount);
    }
  }

  // Start workers up to maxConcurrency
  const workers = Array(Math.min(maxConcurrency, items.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);
  return results;
}

export type PlanApprovalResult =
  | { approved: true }
  | { approved: false; reason: 'rejected' | 'edit'; editedPlan?: string };

export interface OrchestratorCallbacks {
  onPhaseStart?: (phase: string, agent: string) => void;
  onPhaseComplete?: (phase: string, agent: string, result: AgentResult) => void;
  onError?: (phase: string, error: string) => void;
  onIteration?: (iteration: number, maxIterations: number) => void;
  onSyntaxCheck?: (file: string, valid: boolean, error?: string) => void;
  onConsultant?: (file: string, reason: string) => void;
  onResume?: (sessionId: string, phase: string, iteration: number) => void;
  /** Called when plan is ready for approval. Return approval result. */
  onPlanReady?: (planContent: string, planFile: string) => Promise<PlanApprovalResult>;
  /** Called when a file starts processing (parallel mode) */
  onFileStart?: (file: string, index: number, total: number) => void;
  /** Called when a file completes processing (parallel mode) */
  onFileComplete?: (file: string, success: boolean, duration: number) => void;
  /** Called with parallel execution progress */
  onParallelProgress?: (completed: number, total: number, inProgress: string[]) => void;
  /** Called when a file audit completes (pipeline mode) */
  onFileAudit?: (file: string, status: 'APPROVED' | 'NEEDS_WORK', issues: number) => void;
  /** Called when watch mode detects a change */
  onWatchChange?: (file: string, event: 'add' | 'change' | 'unlink') => void;
  /** Called when watch mode triggers a re-run */
  onWatchRerun?: (trigger: string, runNumber: number) => void;
  /** Called when tests start running */
  onTestStart?: (command: string) => void;
  /** Called when tests complete */
  onTestComplete?: (result: TestResult) => void;
  /** Called when syntax validation completes for a file */
  onSyntaxValidation?: (result: SyntaxValidationResult) => void;
  /** Called when git commit starts */
  onCommitStart?: (files: string[]) => void;
  /** Called when git commit completes */
  onCommitComplete?: (result: CommitResult) => void;
  /** Called when project config is loaded */
  onConfigLoaded?: (configPath: string) => void;
  /** Called when an adapter falls back to another due to rate limit */
  onAdapterFallback?: (from: string, to: string, reason: string) => void;
}

export class Orchestrator {
  private config: OrchestratorConfig;
  private stateManager: StateManager;
  private callbacks: OrchestratorCallbacks;

  // Adaptadores individuales
  private glmAdapter: GLMAdapter;
  private codexAdapter: CodexAdapter;
  private geminiAdapter: GeminiAdapter;

  // Adaptadores con fallback para cada agente
  private architectAdapter: Adapter;  // Codex → Gemini → GLM 4.7
  private executorAdapter: Adapter;   // GLM 4.7 (sin fallback)
  private auditorAdapter: Adapter;    // Gemini → GLM 4.7
  private consultantAdapter: Adapter; // Codex → Gemini → GLM 4.7

  constructor(
    config: Partial<OrchestratorConfig> = {},
    callbacks: OrchestratorCallbacks = {}
  ) {
    this.config = {
      orchestraDir: config.orchestraDir || '.orchestra',
      aiCorePath: config.aiCorePath || './ai-core',
      timeout: config.timeout || 600000,
      maxIterations: config.maxIterations || 3,
      autoApprove: config.autoApprove ?? false,
      parallel: config.parallel ?? false,
      maxConcurrency: config.maxConcurrency || 3,
      pipeline: config.pipeline ?? false,
      watch: config.watch ?? false,
      watchPatterns: config.watchPatterns || [],
      runTests: config.runTests ?? false,
      testCommand: config.testCommand || '',
      gitCommit: config.gitCommit ?? false,
      commitMessage: config.commitMessage || '',
      languages: config.languages || [],
      customPrompts: config.customPrompts || {},
    };

    this.callbacks = callbacks;
    this.stateManager = new StateManager(this.config.orchestraDir);

    // Crear adaptadores individuales
    this.glmAdapter = new GLMAdapter();
    this.codexAdapter = new CodexAdapter();
    this.geminiAdapter = new GeminiAdapter();

    // Crear callbacks para fallback
    const fallbackCallbacks = {
      onAdapterFallback: (from: string, to: string, reason: string) => {
        this.callbacks.onAdapterFallback?.(from, to, reason);
      },
    };

    // Configurar adaptadores con fallback para cada agente:
    // Arquitecto: Codex → Gemini → GLM 4.7
    this.architectAdapter = new FallbackAdapter(
      [this.codexAdapter, this.geminiAdapter, this.glmAdapter],
      fallbackCallbacks
    );

    // Ejecutor: GLM 4.7 (sin fallback, necesita consistencia)
    this.executorAdapter = this.glmAdapter;

    // Auditor: Gemini → GLM 4.7
    this.auditorAdapter = new FallbackAdapter(
      [this.geminiAdapter, this.glmAdapter],
      fallbackCallbacks
    );

    // Consultor: Codex → Gemini → GLM 4.7
    this.consultantAdapter = new FallbackAdapter(
      [this.codexAdapter, this.geminiAdapter, this.glmAdapter],
      fallbackCallbacks
    );
  }

  /**
   * Carga configuración del proyecto y la combina con la configuración actual
   */
  async loadConfig(): Promise<void> {
    const projectConfig = await loadProjectConfig(process.cwd());
    if (projectConfig) {
      const merged = mergeConfig(this.config, projectConfig);
      this.config = { ...this.config, ...merged };
      this.callbacks.onConfigLoaded?.('.orchestrarc.json');
    }
  }

  /**
   * Ejecuta la orquestación completa
   */
  async run(task: string): Promise<boolean> {
    // Cargar configuración del proyecto
    await this.loadConfig();

    // Verificar si hay sesión pendiente
    if (await this.stateManager.canResume()) {
      const state = await this.stateManager.load();
      if (state) {
        this.callbacks.onError?.(
          'init',
          `Sesión pendiente detectada: ${state.sessionId}\nUsa 'orchestra resume' para continuar o 'orchestra clean' para empezar de nuevo.`
        );
        return false;
      }
    }

    // Inicializar nueva sesión
    await this.stateManager.init(task);

    try {
      // ═══════════════════════════════════════════════════════════════
      // FASE 1: ARQUITECTO
      // ═══════════════════════════════════════════════════════════════
      const planSuccess = await this.runArchitect(task);
      if (!planSuccess) {
        return false;
      }

      // ═══════════════════════════════════════════════════════════════
      // FASE 1.5: APROBACIÓN DEL PLAN (si no es autoApprove)
      // ═══════════════════════════════════════════════════════════════
      const approvalResult = await this.handlePlanApproval(task);
      if (!approvalResult) {
        return false;
      }

      // ═══════════════════════════════════════════════════════════════
      // FASE 2: EJECUTOR
      // ═══════════════════════════════════════════════════════════════
      const execSuccess = await this.runExecutor();
      if (!execSuccess) {
        return false;
      }

      // ═══════════════════════════════════════════════════════════════
      // FASE 3: AUDITOR (con posibles iteraciones)
      // ═══════════════════════════════════════════════════════════════
      const auditSuccess = await this.runAuditLoop(1);
      if (!auditSuccess) {
        return false;
      }

      // ═══════════════════════════════════════════════════════════════
      // FASE 4: TESTS (opcional)
      // ═══════════════════════════════════════════════════════════════
      if (this.config.runTests) {
        const testSuccess = await this.runTestPhase();
        if (!testSuccess) {
          return false;
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // FASE 5: GIT COMMIT (opcional)
      // ═══════════════════════════════════════════════════════════════
      if (this.config.gitCommit) {
        await this.runGitCommit(task);
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.stateManager.setError(errorMessage);
      await this.stateManager.setPhase('failed');
      this.callbacks.onError?.('orchestration', errorMessage);
      return false;
    }
  }

  /**
   * Retoma una sesión interrumpida
   */
  async resume(): Promise<boolean> {
    // Verificar si hay sesión que retomar
    if (!(await this.stateManager.canResume())) {
      this.callbacks.onError?.('resume', 'No hay sesión pendiente para retomar');
      return false;
    }

    const state = await this.stateManager.load();
    if (!state) {
      this.callbacks.onError?.('resume', 'No se pudo cargar el estado de la sesión');
      return false;
    }

    // Notificar que se está retomando
    this.callbacks.onResume?.(state.sessionId, state.phase, state.iteration);

    try {
      // Determinar desde dónde continuar basándose en la fase y estado de agentes
      return await this.resumeFromPhase(state);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.stateManager.setError(errorMessage);
      await this.stateManager.setPhase('failed');
      this.callbacks.onError?.('orchestration', errorMessage);
      return false;
    }
  }

  /**
   * Continúa desde la fase apropiada
   */
  private async resumeFromPhase(state: import('../types.js').SessionState): Promise<boolean> {
    const { phase, iteration } = state;

    // Determinar punto de continuación
    switch (phase) {
      case 'init':
      case 'planning':
        // Re-ejecutar desde el Arquitecto
        return this.resumeFromArchitect(state.task);

      case 'awaiting_approval':
        // Plan listo, esperando aprobación
        return this.resumeFromApproval(state.task);

      case 'rejected':
        // Plan fue rechazado, re-generar desde Arquitecto
        return this.resumeFromArchitect(state.task);

      case 'executing':
        // El plan ya existe, continuar desde el Ejecutor
        return this.resumeFromExecutor(state.iteration);

      case 'fixing':
        // Hubo un error durante fixing, re-ejecutar el ciclo de auditoría
        return this.resumeFromAuditLoop(state.iteration);

      case 'auditing':
        // Re-ejecutar desde el ciclo de auditoría
        return this.resumeFromAuditLoop(state.iteration);

      case 'failed':
        // Intentar recuperar desde el último checkpoint exitoso
        return this.resumeFromLastCheckpoint(state);

      case 'completed':
        this.callbacks.onError?.('resume', 'La sesión ya está completada');
        return true;

      default:
        this.callbacks.onError?.('resume', `Fase desconocida: ${phase}`);
        return false;
    }
  }

  /**
   * Retoma desde el Arquitecto
   */
  private async resumeFromArchitect(task: string): Promise<boolean> {
    const planSuccess = await this.runArchitect(task);
    if (!planSuccess) return false;

    const approvalResult = await this.handlePlanApproval(task);
    if (!approvalResult) return false;

    const execSuccess = await this.runExecutor();
    if (!execSuccess) return false;

    return this.runAuditLoop(1);
  }

  /**
   * Retoma desde la aprobación del plan
   */
  private async resumeFromApproval(task: string): Promise<boolean> {
    const approvalResult = await this.handlePlanApproval(task);
    if (!approvalResult) return false;

    const execSuccess = await this.runExecutor();
    if (!execSuccess) return false;

    return this.runAuditLoop(1);
  }

  /**
   * Retoma desde el Ejecutor
   */
  private async resumeFromExecutor(startIteration: number): Promise<boolean> {
    const execSuccess = await this.runExecutor();
    if (!execSuccess) return false;

    return this.runAuditLoop(startIteration || 1);
  }

  /**
   * Retoma desde el ciclo de auditoría
   */
  private async resumeFromAuditLoop(startIteration: number): Promise<boolean> {
    return this.runAuditLoop(startIteration || 1);
  }

  /**
   * Retoma desde el último checkpoint exitoso
   */
  private async resumeFromLastCheckpoint(
    state: import('../types.js').SessionState
  ): Promise<boolean> {
    const checkpoints = state.checkpoints;
    if (checkpoints.length === 0) {
      // No hay checkpoints, empezar desde el principio
      return this.resumeFromArchitect(state.task);
    }

    // Obtener el último checkpoint
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    const checkpointPhase = lastCheckpoint.phase;

    // Determinar desde dónde continuar basándose en el checkpoint
    if (checkpointPhase.startsWith('plan')) {
      return this.resumeFromExecutor(state.iteration);
    } else if (checkpointPhase.startsWith('exec')) {
      return this.runAuditLoop(state.iteration || 1);
    } else if (checkpointPhase.startsWith('audit') || checkpointPhase.startsWith('fix')) {
      return this.runAuditLoop(state.iteration || 1);
    }

    // Por defecto, ejecutar desde el ejecutor si el plan existe
    const planFile = this.stateManager.getFilePath('plan.md');
    if (existsSync(planFile)) {
      return this.resumeFromExecutor(state.iteration);
    }

    return this.resumeFromArchitect(state.task);
  }

  /**
   * Maneja la aprobación del plan
   */
  private async handlePlanApproval(task: string): Promise<boolean> {
    // Si autoApprove está habilitado, saltar aprobación
    if (this.config.autoApprove) {
      return true;
    }

    // Si no hay callback de aprobación, aprobar automáticamente
    if (!this.callbacks.onPlanReady) {
      return true;
    }

    await this.stateManager.setPhase('awaiting_approval');

    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');

    // Solicitar aprobación del usuario
    const result = await this.callbacks.onPlanReady(planContent, planFile);

    if (result.approved) {
      return true;
    }

    // Plan rechazado
    if (result.reason === 'rejected') {
      await this.stateManager.setPhase('rejected');
      this.callbacks.onError?.('approval', 'Plan rechazado por el usuario');
      return false;
    }

    // Plan editado - guardar cambios y continuar
    if (result.reason === 'edit' && result.editedPlan) {
      await writeFile(planFile, result.editedPlan, 'utf-8');
      await this.stateManager.createCheckpoint('plan-edited');
      return true;
    }

    return false;
  }

  /**
   * Ejecuta el ciclo de auditoría (usado por run y resume)
   */
  private async runAuditLoop(startIteration: number): Promise<boolean> {
    let iteration = startIteration;
    let approved = false;

    while (iteration <= this.config.maxIterations && !approved) {
      this.callbacks.onIteration?.(iteration, this.config.maxIterations);
      await this.stateManager.setIteration(iteration);

      const auditResult = await this.runAuditor();
      if (!auditResult) {
        return false;
      }

      if (auditResult.status === 'APPROVED') {
        approved = true;
      } else {
        // Hay issues - corregir y re-auditar
        if (iteration < this.config.maxIterations) {
          const fixSuccess = await this.runFixes(auditResult.issues);
          if (!fixSuccess) {
            return false;
          }
        } else {
          // Máximo de iteraciones alcanzado
          this.callbacks.onError?.(
            'auditing',
            `Máximo de iteraciones alcanzado (${this.config.maxIterations}). Issues pendientes: ${auditResult.issues.length}`
          );
        }
      }

      iteration++;
    }

    // Marcar como completado
    await this.stateManager.setPhase('completed');
    return approved;
  }

  /**
   * Ejecuta el Arquitecto
   */
  private async runArchitect(task: string): Promise<boolean> {
    this.callbacks.onPhaseStart?.('planning', 'Arquitecto');
    await this.stateManager.setPhase('planning');
    await this.stateManager.setAgentStatus('architect', 'in_progress');

    const prompt = buildArchitectPrompt(task);
    const planFile = this.stateManager.getFilePath('plan.md');

    const result = await this.architectAdapter.execute({
      prompt,
      outputFile: planFile,
    });

    if (!result.success) {
      await this.stateManager.setAgentStatus('architect', 'failed');
      this.callbacks.onError?.('planning', result.error || 'Error desconocido');
      return false;
    }

    // Verificar que el plan fue creado
    if (!existsSync(planFile)) {
      await this.stateManager.setAgentStatus('architect', 'failed');
      this.callbacks.onError?.('planning', 'El Arquitecto no creó el plan');
      return false;
    }

    await this.stateManager.setAgentStatus('architect', 'completed', result.duration);
    await this.stateManager.createCheckpoint('plan');
    this.callbacks.onPhaseComplete?.('planning', 'Arquitecto', result);

    return true;
  }

  /**
   * Procesa un solo archivo (usado por runExecutor)
   */
  private async processFile(
    file: { path: string; description: string },
    planContent: string,
    index: number,
    total: number
  ): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();

    this.callbacks.onFileStart?.(file.path, index, total);

    const prompt = buildExecutorPrompt(planContent, file.path, 1);
    const tempFile = this.stateManager.getFilePath(`temp_${file.path.replace(/\//g, '_')}`);

    const result = await this.executorAdapter.execute({
      prompt,
      outputFile: tempFile,
      workingDir: process.cwd(),
    });

    if (!result.success) {
      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(file.path, false, duration);
      return { success: false, duration, error: result.error };
    }

    try {
      let code = await readFile(tempFile, 'utf-8');
      code = this.cleanGeneratedCode(code);

      const destPath = path.join(process.cwd(), file.path);
      await writeFile(destPath, code, 'utf-8');

      if (file.path.endsWith('.py')) {
        await this.validateAndFixPython(destPath, file.path, planContent);
      }

      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(file.path, true, duration);
      return { success: true, duration };
    } catch (err) {
      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(file.path, false, duration);
      return { success: false, duration, error: String(err) };
    }
  }

  /**
   * Ejecuta el Ejecutor
   */
  private async runExecutor(): Promise<boolean> {
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');

    const filesToCreate = extractFilesFromPlan(planContent);

    if (filesToCreate.length === 0) {
      this.callbacks.onError?.('executing', 'No se encontraron archivos a crear en el plan');
      return false;
    }

    const agentName = this.config.parallel
      ? `Ejecutor (${filesToCreate.length} archivos en paralelo)`
      : 'Ejecutor';

    this.callbacks.onPhaseStart?.('executing', agentName);
    await this.stateManager.setPhase('executing');
    await this.stateManager.setIteration(1);
    await this.stateManager.setAgentStatus('executor', 'in_progress');

    let totalDuration = 0;
    let allSuccess = true;
    const inProgressFiles: string[] = [];

    if (this.config.parallel && filesToCreate.length > 1) {
      // ═══════════════════════════════════════════════════════════════
      // EJECUCIÓN PARALELA
      // ═══════════════════════════════════════════════════════════════
      const results = await runWithConcurrency(
        filesToCreate,
        async (file, index) => {
          inProgressFiles.push(file.path);
          const result = await this.processFile(file, planContent, index, filesToCreate.length);
          const idx = inProgressFiles.indexOf(file.path);
          if (idx > -1) inProgressFiles.splice(idx, 1);
          return result;
        },
        this.config.maxConcurrency,
        (completed, total, inProgress) => {
          this.callbacks.onParallelProgress?.(completed, total, [...inProgressFiles]);
        }
      );

      for (const result of results) {
        totalDuration += result.duration;
        if (!result.success) {
          allSuccess = false;
          if (result.error) {
            this.callbacks.onError?.('executing', result.error);
          }
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════
      // EJECUCIÓN SECUENCIAL (comportamiento original)
      // ═══════════════════════════════════════════════════════════════
      for (let i = 0; i < filesToCreate.length; i++) {
        const file = filesToCreate[i];
        const result = await this.processFile(file, planContent, i, filesToCreate.length);

        totalDuration += result.duration;

        if (!result.success) {
          await this.stateManager.setAgentStatus('executor', 'failed');
          this.callbacks.onError?.('executing', result.error || 'Error desconocido');
          return false;
        }
      }
    }

    if (!allSuccess && this.config.parallel) {
      // En modo paralelo, solo fallar si TODOS los archivos fallaron
      const anySuccess = filesToCreate.some((_, i) => true); // Por ahora continuar
    }

    await this.stateManager.setAgentStatus('executor', 'completed', totalDuration);
    await this.stateManager.createCheckpoint('exec-1');

    this.callbacks.onPhaseComplete?.('executing', agentName, {
      success: true,
      duration: totalDuration,
    });

    return true;
  }

  /**
   * Audita un solo archivo (usado por runAuditor en modo paralelo)
   */
  private async auditFile(
    file: { path: string; content: string },
    planContent: string,
    index: number,
    total: number
  ): Promise<SingleFileAuditResult> {
    const startTime = Date.now();

    this.callbacks.onFileStart?.(file.path, index, total);

    const prompt = buildSingleFileAuditorPrompt(planContent, file);
    const auditFile = this.stateManager.getFilePath(`audit_${file.path.replace(/\//g, '_')}.json`);

    const result = await this.auditorAdapter.execute({
      prompt,
      outputFile: auditFile,
    });

    const duration = Date.now() - startTime;

    if (!result.success) {
      this.callbacks.onFileComplete?.(file.path, false, duration);
      return {
        file: file.path,
        status: 'NEEDS_WORK',
        issues: [{
          file: file.path,
          severity: 'major',
          description: result.error || 'Error del auditor',
          suggestion: 'Revisar manualmente',
        }],
        summary: 'Error en auditoría',
      };
    }

    const auditResponse = await readFile(auditFile, 'utf-8');
    const auditResult = parseSingleFileAuditResponse(auditResponse, file.path);

    this.callbacks.onFileComplete?.(file.path, auditResult.status === 'APPROVED', duration);
    this.callbacks.onFileAudit?.(file.path, auditResult.status, auditResult.issues.length);

    return auditResult;
  }

  /**
   * Ejecuta el Auditor
   */
  private async runAuditor(): Promise<AuditResult | null> {
    // Leer el plan
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');

    // Extraer los archivos creados y leer su contenido
    const filesToCreate = extractFilesFromPlan(planContent);
    const files: { path: string; content: string }[] = [];

    for (const file of filesToCreate) {
      const filePath = path.join(process.cwd(), file.path);
      if (existsSync(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        files.push({ path: file.path, content });
      }
    }

    if (files.length === 0) {
      this.callbacks.onError?.('auditing', 'No se encontraron archivos para auditar');
      return null;
    }

    await this.stateManager.setPhase('auditing');
    await this.stateManager.setAgentStatus('auditor', 'in_progress');

    // ═══════════════════════════════════════════════════════════════
    // MODO PARALELO: Auditar cada archivo por separado
    // ═══════════════════════════════════════════════════════════════
    if (this.config.parallel && files.length > 1) {
      const agentName = `Auditor (${files.length} archivos en paralelo)`;
      this.callbacks.onPhaseStart?.('auditing', agentName);

      const inProgressFiles: string[] = [];
      const startTime = Date.now();

      const results = await runWithConcurrency(
        files,
        async (file, index) => {
          inProgressFiles.push(file.path);
          const result = await this.auditFile(file, planContent, index, files.length);
          const idx = inProgressFiles.indexOf(file.path);
          if (idx > -1) inProgressFiles.splice(idx, 1);
          return result;
        },
        this.config.maxConcurrency,
        (completed, total, inProgress) => {
          this.callbacks.onParallelProgress?.(completed, total, [...inProgressFiles]);
        }
      );

      // Combinar resultados
      const allIssues: AuditIssue[] = [];
      let allApproved = true;

      for (const result of results) {
        if (result.status === 'NEEDS_WORK') {
          allApproved = false;
        }
        allIssues.push(...result.issues);
      }

      const totalDuration = Date.now() - startTime;

      await this.stateManager.setAgentStatus('auditor', 'completed', totalDuration);
      await this.stateManager.createCheckpoint(`audit-${Date.now()}`);

      this.callbacks.onPhaseComplete?.('auditing', agentName, {
        success: true,
        duration: totalDuration,
      });

      return {
        status: allApproved ? 'APPROVED' : 'NEEDS_WORK',
        issues: allIssues,
        summary: allApproved
          ? `Todos los ${files.length} archivos aprobados`
          : `${allIssues.length} issues encontrados en ${files.length} archivos`,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // MODO SECUENCIAL: Auditar todos los archivos en una sola llamada
    // ═══════════════════════════════════════════════════════════════
    this.callbacks.onPhaseStart?.('auditing', 'Auditor');

    const prompt = buildAuditorPrompt(planContent, files);
    const auditFile = this.stateManager.getFilePath('audit-result.json');

    const result = await this.auditorAdapter.execute({
      prompt,
      outputFile: auditFile,
    });

    if (!result.success) {
      await this.stateManager.setAgentStatus('auditor', 'failed');
      this.callbacks.onError?.('auditing', result.error || 'Error del Auditor');
      return null;
    }

    const auditResponse = await readFile(auditFile, 'utf-8');
    const auditResult = parseAuditResponse(auditResponse);

    await this.stateManager.setAgentStatus('auditor', 'completed', result.duration);
    await this.stateManager.createCheckpoint(`audit-${Date.now()}`);

    this.callbacks.onPhaseComplete?.('auditing', 'Auditor', {
      success: true,
      duration: result.duration,
    });

    return auditResult;
  }

  /**
   * Corrige un solo archivo (usado por runFixes)
   */
  private async fixFile(
    fileName: string,
    fileIssues: AuditIssue[],
    planContent: string,
    index: number,
    total: number
  ): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();
    const filePath = path.join(process.cwd(), fileName);

    this.callbacks.onFileStart?.(fileName, index, total);

    if (!existsSync(filePath)) {
      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(fileName, false, duration);
      return { success: false, duration, error: 'Archivo no existe' };
    }

    const originalCode = await readFile(filePath, 'utf-8');
    const prompt = buildFixPrompt(originalCode, fileName, fileIssues, planContent);
    const tempFile = this.stateManager.getFilePath(`fix_${fileName.replace(/\//g, '_')}`);

    const result = await this.executorAdapter.execute({
      prompt,
      outputFile: tempFile,
      workingDir: process.cwd(),
    });

    if (!result.success) {
      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(fileName, false, duration);
      return { success: false, duration, error: result.error };
    }

    let fixedCode = await readFile(tempFile, 'utf-8');
    fixedCode = this.cleanGeneratedCode(fixedCode);

    if (this.isValidCode(fixedCode, fileName)) {
      await writeFile(filePath, fixedCode, 'utf-8');

      if (fileName.endsWith('.py')) {
        await this.validateAndFixPython(filePath, fileName, planContent);
      }

      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(fileName, true, duration);
      return { success: true, duration };
    } else {
      const duration = Date.now() - startTime;
      this.callbacks.onFileComplete?.(fileName, false, duration);
      return { success: false, duration, error: 'Código generado no válido' };
    }
  }

  /**
   * Ejecuta correcciones basadas en el feedback del Auditor
   */
  private async runFixes(issues: AuditIssue[]): Promise<boolean> {
    // Leer el plan para contexto
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');

    // Agrupar issues por archivo
    const issuesByFile = new Map<string, AuditIssue[]>();
    for (const issue of issues) {
      const existing = issuesByFile.get(issue.file) || [];
      existing.push(issue);
      issuesByFile.set(issue.file, existing);
    }

    const filesToFix = Array.from(issuesByFile.entries());
    const agentName = this.config.parallel && filesToFix.length > 1
      ? `Ejecutor (${filesToFix.length} archivos en paralelo)`
      : 'Ejecutor';

    this.callbacks.onPhaseStart?.('fixing', agentName);
    await this.stateManager.setPhase('fixing');
    await this.stateManager.setAgentStatus('executor', 'in_progress');

    let totalDuration = 0;
    const inProgressFiles: string[] = [];

    if (this.config.parallel && filesToFix.length > 1) {
      // ═══════════════════════════════════════════════════════════════
      // CORRECCIONES EN PARALELO
      // ═══════════════════════════════════════════════════════════════
      const results = await runWithConcurrency(
        filesToFix,
        async ([fileName, fileIssues], index) => {
          inProgressFiles.push(fileName);
          const result = await this.fixFile(fileName, fileIssues, planContent, index, filesToFix.length);
          const idx = inProgressFiles.indexOf(fileName);
          if (idx > -1) inProgressFiles.splice(idx, 1);
          return result;
        },
        this.config.maxConcurrency,
        (completed, total, inProgress) => {
          this.callbacks.onParallelProgress?.(completed, total, [...inProgressFiles]);
        }
      );

      for (const result of results) {
        totalDuration += result.duration;
        if (!result.success && result.error) {
          this.callbacks.onError?.('fixing', result.error);
        }
      }
    } else {
      // ═══════════════════════════════════════════════════════════════
      // CORRECCIONES SECUENCIALES (comportamiento original)
      // ═══════════════════════════════════════════════════════════════
      for (let i = 0; i < filesToFix.length; i++) {
        const [fileName, fileIssues] = filesToFix[i];
        const result = await this.fixFile(fileName, fileIssues, planContent, i, filesToFix.length);
        totalDuration += result.duration;

        if (!result.success && result.error) {
          this.callbacks.onError?.('fixing', `Error corrigiendo ${fileName}: ${result.error}`);
        }
      }
    }

    await this.stateManager.setAgentStatus('executor', 'completed', totalDuration);
    await this.stateManager.createCheckpoint(`fix-${Date.now()}`);

    this.callbacks.onPhaseComplete?.('fixing', agentName, {
      success: true,
      duration: totalDuration,
    });

    return true;
  }

  /**
   * Verifica si el código generado es válido
   */
  private isValidCode(code: string, fileName: string): boolean {
    if (!code || code.trim().length < 10) {
      return false;
    }

    const firstLine = code.trim().split('\n')[0].trim();
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Patrones que indican código válido según extensión
    if (extension === 'py') {
      const validPythonStarts = [
        /^#/,                              // Comment or shebang
        /^from\s+/,                        // from import
        /^import\s+/,                      // import
        /^class\s+/,                       // class definition
        /^def\s+/,                         // function definition
        /^@/,                              // decorator
        /^"""/,                            // docstring
        /^'''/,                            // docstring
        /^[a-z_][a-z0-9_]*\s*=/i,          // assignment
      ];
      return validPythonStarts.some(pattern => pattern.test(firstLine));
    }

    if (extension === 'txt') {
      // Para requirements.txt, debe contener nombres de paquetes
      return /^[a-zA-Z][a-zA-Z0-9_-]*/.test(firstLine);
    }

    if (extension === 'js' || extension === 'ts') {
      const validJsStarts = [
        /^import\s+/,
        /^export\s+/,
        /^const\s+/,
        /^let\s+/,
        /^var\s+/,
        /^function\s+/,
        /^class\s+/,
        /^\/\//,
        /^\/\*/,
      ];
      return validJsStarts.some(pattern => pattern.test(firstLine));
    }

    if (extension === 'json') {
      return firstLine.startsWith('{') || firstLine.startsWith('[');
    }

    // Por defecto, aceptar si no parece texto explicativo
    const textPatterns = [
      /^(El archivo|Aquí está|Este código|Based on|I need|Let me|Here's|The file)/i,
      /^(Necesito|Por favor|Este es|La implementación)/i,
    ];
    return !textPatterns.some(pattern => pattern.test(firstLine));
  }

  /**
   * Limpia el código generado de posibles artefactos
   */
  private cleanGeneratedCode(code: string): string {
    let cleaned = code;

    // 1. Si hay bloques de código markdown, extraer el contenido
    const codeBlockMatch = cleaned.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    }

    // 2. Si hay texto antes del código, buscar la primera línea de código real
    const lines = cleaned.split('\n');
    let startIndex = 0;

    // Patrones que indican inicio de código Python
    const codePatterns = [
      /^(from|import)\s+/,           // import statements
      /^(class|def)\s+/,             // class or function definitions
      /^#!.*python/,                 // shebang
      /^#\s*(coding|-\*-)/,          // encoding declaration
      /^"""[^"]*$/,                  // docstring start
      /^'''[^']*$/,                  // docstring start
      /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/, // variable assignment
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && codePatterns.some(pattern => pattern.test(line))) {
        startIndex = i;
        break;
      }
    }

    // Si encontramos código, empezar desde ahí
    if (startIndex > 0) {
      cleaned = lines.slice(startIndex).join('\n');
    }

    // 3. Remover texto basura al final (después del código)
    // Solo eliminar líneas si claramente son texto explicativo
    const resultLines = cleaned.split('\n');
    let endIndex = resultLines.length;

    // Buscar desde el final líneas que son claramente texto basura
    for (let i = resultLines.length - 1; i >= 0; i--) {
      const line = resultLines[i].trim();

      // Líneas vacías al final - continuar buscando
      if (!line) {
        endIndex = i;
        continue;
      }

      // Si es claramente texto explicativo, excluirlo
      if (/^(Based on|I need to|Let me|Here's|This|The|Please|Note:|El archivo|Aquí|Este código|Necesito)/i.test(line)) {
        endIndex = i;
        continue;
      }

      // Si parece código (cualquier carácter de programación), mantener todo hasta aquí
      // Incluye: }, ), ], ', ", números, letras, operadores, etc.
      if (/[{}()\[\]'":,.\d]/.test(line) || /^[a-zA-Z_@#]/.test(line)) {
        break;
      }
    }

    cleaned = resultLines.slice(0, endIndex).join('\n');

    // 4. Remover líneas vacías al inicio y final
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Valida sintaxis Python usando py_compile
   */
  private async validatePythonSyntax(
    filePath: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      await execFileAsync('python3', ['-m', 'py_compile', filePath]);
      return { valid: true };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      return {
        valid: false,
        error: error.stderr || error.message || 'Error de sintaxis desconocido',
      };
    }
  }

  /**
   * Valida y corrige archivos Python usando Codex si es necesario
   */
  private async validateAndFixPython(
    filePath: string,
    fileName: string,
    planContext: string
  ): Promise<boolean> {
    // 1. Leer el código actual
    const code = await readFile(filePath, 'utf-8');

    // 2. Detectar código incompleto
    const incomplete = detectIncompleteCode(code);
    if (incomplete.isIncomplete) {
      this.callbacks.onConsultant?.(fileName, `Código incompleto: ${incomplete.reason}`);

      // Usar Consultor para completar el código
      const prompt = buildCompleteCodePrompt(fileName, code, planContext);
      const tempFile = this.stateManager.getFilePath(`consultant_${fileName}`);

      const result = await this.consultantAdapter.execute({
        prompt,
        outputFile: tempFile,
      });

      if (result.success) {
        let fixedCode = await readFile(tempFile, 'utf-8');
        fixedCode = parseConsultantResponse(fixedCode);

        if (fixedCode && this.isValidCode(fixedCode, fileName)) {
          await writeFile(filePath, fixedCode, 'utf-8');
        }
      }
    }

    // 3. Validar sintaxis Python
    const syntaxResult = await this.validatePythonSyntax(filePath);
    this.callbacks.onSyntaxCheck?.(fileName, syntaxResult.valid, syntaxResult.error);

    if (!syntaxResult.valid) {
      this.callbacks.onConsultant?.(fileName, `Error de sintaxis: ${syntaxResult.error}`);

      // Leer el código actual (posiblemente corregido)
      const currentCode = await readFile(filePath, 'utf-8');

      // Usar Consultor para corregir errores de sintaxis
      const prompt = buildSyntaxFixPrompt(fileName, currentCode, syntaxResult.error || '');
      const tempFile = this.stateManager.getFilePath(`consultant_fix_${fileName}`);

      const result = await this.consultantAdapter.execute({
        prompt,
        outputFile: tempFile,
      });

      if (result.success) {
        let fixedCode = await readFile(tempFile, 'utf-8');
        fixedCode = parseConsultantResponse(fixedCode);

        if (fixedCode && this.isValidCode(fixedCode, fileName)) {
          await writeFile(filePath, fixedCode, 'utf-8');

          // Re-validar después de la corrección
          const recheck = await this.validatePythonSyntax(filePath);
          return recheck.valid;
        }
      }

      return false;
    }

    return true;
  }

  /**
   * Obtiene el estado actual
   */
  async getStatus(): Promise<string> {
    const state = await this.stateManager.load();

    if (!state) {
      return 'No hay sesión activa';
    }

    const lines = [
      `Session: ${state.sessionId}`,
      `Task: "${state.task}"`,
      `Phase: ${state.phase}`,
      `Iteration: ${state.iteration}/${this.config.maxIterations}`,
      `Started: ${state.startedAt}`,
      `Last Activity: ${state.lastActivity}`,
      '',
      'Agents:',
      `  Arquitecto: ${state.agents.architect.status}${state.agents.architect.duration ? ` (${state.agents.architect.duration}ms)` : ''}`,
      `  Ejecutor: ${state.agents.executor.status}${state.agents.executor.duration ? ` (${state.agents.executor.duration}ms)` : ''}`,
      `  Auditor: ${state.agents.auditor.status}`,
      `  Consultor: ${state.agents.consultant.status}`,
      '',
      `Checkpoints: ${state.checkpoints.length}`,
    ];

    if (state.lastError) {
      lines.push('', `Last Error: ${state.lastError}`);
    }

    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PIPELINE MODE: Ejecutar y auditar archivos en paralelo (pipeline)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ejecuta en modo pipeline: procesa y audita archivos simultáneamente
   */
  async runPipeline(task: string): Promise<boolean> {
    // Verificar sesión pendiente
    if (await this.stateManager.canResume()) {
      const state = await this.stateManager.load();
      if (state) {
        this.callbacks.onError?.(
          'init',
          `Sesión pendiente detectada: ${state.sessionId}\nUsa 'orchestra resume' o 'orchestra clean'.`
        );
        return false;
      }
    }

    await this.stateManager.init(task);

    try {
      // Fase 1: Arquitecto
      const planSuccess = await this.runArchitect(task);
      if (!planSuccess) return false;

      // Fase 1.5: Aprobación
      const approvalResult = await this.handlePlanApproval(task);
      if (!approvalResult) return false;

      // Fase 2+3: Pipeline de ejecución y auditoría
      return this.runExecuteAuditPipeline();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.stateManager.setError(errorMessage);
      await this.stateManager.setPhase('failed');
      this.callbacks.onError?.('orchestration', errorMessage);
      return false;
    }
  }

  /**
   * Pipeline de ejecución y auditoría simultánea
   */
  private async runExecuteAuditPipeline(): Promise<boolean> {
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');
    const filesToCreate = extractFilesFromPlan(planContent);

    if (filesToCreate.length === 0) {
      this.callbacks.onError?.('pipeline', 'No se encontraron archivos a crear');
      return false;
    }

    this.callbacks.onPhaseStart?.('pipeline', `Pipeline (${filesToCreate.length} archivos)`);
    await this.stateManager.setPhase('executing');

    const fileResults = new Map<string, {
      executed: boolean;
      audited: boolean;
      approved: boolean;
      issues: AuditIssue[];
    }>();

    // Inicializar estado de cada archivo
    for (const file of filesToCreate) {
      fileResults.set(file.path, {
        executed: false,
        audited: false,
        approved: false,
        issues: [],
      });
    }

    let iteration = 1;
    const startTime = Date.now();

    while (iteration <= this.config.maxIterations) {
      this.callbacks.onIteration?.(iteration, this.config.maxIterations);

      // Obtener archivos que necesitan trabajo
      const filesToProcess = filesToCreate.filter(f => {
        const state = fileResults.get(f.path)!;
        return !state.approved;
      });

      if (filesToProcess.length === 0) {
        break; // Todos aprobados
      }

      // Ejecutar archivos en paralelo
      await runWithConcurrency(
        filesToProcess,
        async (file, index) => {
          // 1. Ejecutar
          this.callbacks.onFileStart?.(file.path, index, filesToProcess.length);
          const execResult = await this.processFile(file, planContent, index, filesToProcess.length);

          if (!execResult.success) {
            return;
          }

          fileResults.get(file.path)!.executed = true;

          // 2. Auditar inmediatamente después de ejecutar
          const filePath = path.join(process.cwd(), file.path);
          if (existsSync(filePath)) {
            const content = await readFile(filePath, 'utf-8');
            const auditResult = await this.auditFile(
              { path: file.path, content },
              planContent,
              index,
              filesToProcess.length
            );

            const state = fileResults.get(file.path)!;
            state.audited = true;
            state.approved = auditResult.status === 'APPROVED';
            state.issues = auditResult.issues;

            // Si no aprobado, corregir inmediatamente
            if (!state.approved && iteration < this.config.maxIterations) {
              await this.fixFile(file.path, auditResult.issues, planContent, index, filesToProcess.length);
            }
          }
        },
        this.config.maxConcurrency
      );

      // Verificar si todos están aprobados
      const allApproved = Array.from(fileResults.values()).every(s => s.approved);
      if (allApproved) {
        break;
      }

      iteration++;
    }

    const totalDuration = Date.now() - startTime;
    const allApproved = Array.from(fileResults.values()).every(s => s.approved);
    const totalIssues = Array.from(fileResults.values()).reduce((sum, s) => sum + s.issues.length, 0);

    await this.stateManager.setPhase(allApproved ? 'completed' : 'max_iterations');
    await this.stateManager.createCheckpoint('pipeline-complete');

    this.callbacks.onPhaseComplete?.('pipeline', `Pipeline`, {
      success: allApproved,
      duration: totalDuration,
    });

    if (!allApproved) {
      this.callbacks.onError?.(
        'pipeline',
        `Pipeline completado con ${totalIssues} issues pendientes`
      );
    }

    return allApproved;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WATCH MODE: Re-ejecutar automáticamente cuando cambian los archivos
  // ═══════════════════════════════════════════════════════════════════════════

  private watchAbortController: AbortController | null = null;
  private watchRunCount = 0;

  /**
   * Inicia el modo watch
   */
  async watch(task: string): Promise<void> {
    const { watch: fsWatch } = await import('fs');

    // Primera ejecución
    console.log('Ejecutando tarea inicial...');
    await this.run(task);

    // Obtener archivos a observar
    const planFile = this.stateManager.getFilePath('plan.md');
    if (!existsSync(planFile)) {
      this.callbacks.onError?.('watch', 'No hay plan para observar archivos');
      return;
    }

    const planContent = await readFile(planFile, 'utf-8');
    const filesToWatch = extractFilesFromPlan(planContent).map(f => f.path);
    const patterns = this.config.watchPatterns.length > 0
      ? this.config.watchPatterns
      : filesToWatch;

    this.watchAbortController = new AbortController();
    const watchers: ReturnType<typeof fsWatch>[] = [];

    let debounceTimer: NodeJS.Timeout | null = null;
    const debounceMs = 500;

    const triggerRerun = async (changedFile: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        this.watchRunCount++;
        this.callbacks.onWatchRerun?.(changedFile, this.watchRunCount);

        // Limpiar estado anterior
        await this.stateManager.init(task);

        // Re-ejecutar solo el ciclo de auditoría si el plan existe
        if (existsSync(planFile)) {
          try {
            await this.runExecutor();
            await this.runAuditLoop(1);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.callbacks.onError?.('watch', errorMessage);
          }
        }
      }, debounceMs);
    };

    // Observar cada archivo
    for (const pattern of patterns) {
      const filePath = path.join(process.cwd(), pattern);

      if (existsSync(filePath)) {
        try {
          const watcher = fsWatch(filePath, { signal: this.watchAbortController.signal }, (event) => {
            this.callbacks.onWatchChange?.(pattern, event as 'add' | 'change' | 'unlink');
            triggerRerun(pattern);
          });
          watchers.push(watcher);
        } catch {
          // Archivo no existe o no se puede observar
        }
      }
    }

    // También observar el directorio de trabajo para nuevos archivos
    const cwd = process.cwd();
    try {
      const dirWatcher = fsWatch(cwd, { signal: this.watchAbortController.signal }, (event, filename) => {
        if (filename && patterns.some(p => filename === p || filename.endsWith(p))) {
          this.callbacks.onWatchChange?.(filename, event as 'add' | 'change' | 'unlink');
          triggerRerun(filename);
        }
      });
      watchers.push(dirWatcher);
    } catch {
      // No se puede observar el directorio
    }

    // Mantener el proceso vivo
    await new Promise<void>((resolve) => {
      this.watchAbortController!.signal.addEventListener('abort', () => {
        for (const watcher of watchers) {
          watcher.close();
        }
        resolve();
      });
    });
  }

  /**
   * Detiene el modo watch
   */
  stopWatch(): void {
    if (this.watchAbortController) {
      this.watchAbortController.abort();
      this.watchAbortController = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST PHASE: Ejecutar tests automáticamente después de la generación
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ejecuta la fase de tests
   */
  private async runTestPhase(): Promise<boolean> {
    this.callbacks.onPhaseStart?.('testing', 'Test Runner');
    await this.stateManager.setPhase('testing');

    const startTime = Date.now();

    // Detectar framework si no hay comando personalizado
    const framework = this.config.testCommand
      ? null
      : await detectTestFramework(process.cwd());

    const command = this.config.testCommand ||
      (framework ? `${framework.command} ${framework.args.join(' ')}` : 'npm test');

    this.callbacks.onTestStart?.(command);

    try {
      const result = await runTests(
        process.cwd(),
        this.config.testCommand || undefined,
        this.config.timeout
      );

      const duration = Date.now() - startTime;

      this.callbacks.onTestComplete?.(result);
      this.callbacks.onPhaseComplete?.('testing', 'Test Runner', {
        success: result.success,
        duration,
      });

      if (!result.success) {
        this.callbacks.onError?.(
          'testing',
          `Tests fallaron: ${result.failed} de ${result.passed + result.failed} tests`
        );
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.callbacks.onError?.('testing', `Error ejecutando tests: ${errorMessage}`);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GIT COMMIT: Auto-commit de archivos generados
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ejecuta el auto-commit de archivos generados
   */
  private async runGitCommit(task: string): Promise<boolean> {
    this.callbacks.onPhaseStart?.('committing', 'Git');
    await this.stateManager.setPhase('committing');

    // Obtener archivos generados del plan
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');
    const filesToCreate = extractFilesFromPlan(planContent);
    const files = filesToCreate.map(f => f.path);

    this.callbacks.onCommitStart?.(files);

    try {
      const result = await autoCommit(
        task,
        files,
        process.cwd(),
        this.config.commitMessage || undefined
      );

      this.callbacks.onCommitComplete?.(result);
      this.callbacks.onPhaseComplete?.('committing', 'Git', {
        success: result.success,
        duration: 0,
      });

      if (!result.success) {
        this.callbacks.onError?.('committing', result.error || 'Error al crear commit');
        return false;
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.callbacks.onError?.('committing', `Error en git: ${errorMessage}`);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTAX VALIDATION: Validar sintaxis de archivos generados
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Valida la sintaxis de todos los archivos generados
   */
  async validateGeneratedFiles(): Promise<SyntaxValidationResult[]> {
    const planFile = this.stateManager.getFilePath('plan.md');
    const planContent = await readFile(planFile, 'utf-8');
    const filesToCreate = extractFilesFromPlan(planContent);
    const results: SyntaxValidationResult[] = [];

    for (const file of filesToCreate) {
      const filePath = path.join(process.cwd(), file.path);
      if (existsSync(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        const lang = detectLanguage(file.path);

        // Skip if language filter is set and doesn't match
        if (this.config.languages.length > 0 && lang && !this.config.languages.includes(lang)) {
          continue;
        }

        const result = await validateSyntax(filePath, content);
        results.push(result);
        this.callbacks.onSyntaxValidation?.(result);
      }
    }

    return results;
  }
}
