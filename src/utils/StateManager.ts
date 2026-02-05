/**
 * Maneja el estado de la sesión de orquestación
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type {
  SessionState,
  Phase,
  Checkpoint,
  EnhancedSessionState,
  TaskStep,
  ModelUsage,
  GlobalMetrics
} from "../types.js";
import { createHash } from 'crypto';

export class StateManager {
  private orchestraDir: string;
  private stateFile: string;
  private checkpointsDir: string;

  constructor(orchestraDir: string = ".orchestra") {
    this.orchestraDir = orchestraDir;
    this.stateFile = path.join(orchestraDir, "state.json");
    this.checkpointsDir = path.join(orchestraDir, "checkpoints");
  }

  /**
   * Inicializa una nueva sesión
   */
  async init(task: string): Promise<SessionState> {
    // Crear directorios
    await mkdir(this.orchestraDir, { recursive: true });
    await mkdir(this.checkpointsDir, { recursive: true });

    const sessionId = `sess_${Date.now()}`;
    const now = new Date().toISOString();

    const state: SessionState = {
      sessionId,
      task,
      phase: "init",
      iteration: 0,
      startedAt: now,
      lastActivity: now,
      agents: {
        architect: { status: "pending", duration: null },
        executor: { status: "pending", duration: null },
        auditor: { status: "pending", duration: null },
        consultant: { status: "not_needed", duration: null },
      },
      checkpoints: [],
      canResume: true,
      lastError: null,
    };

    await this.save(state);
    return state;
  }

  /**
   * Carga el estado actual
   */
  async load(): Promise<SessionState | null> {
    if (!existsSync(this.stateFile)) {
      return null;
    }

    try {
      const content = await readFile(this.stateFile, "utf-8");
      return JSON.parse(content) as SessionState;
    } catch {
      return null;
    }
  }

  /**
   * Guarda el estado
   */
  async save(state: SessionState): Promise<void> {
    state.lastActivity = new Date().toISOString();
    await writeFile(this.stateFile, JSON.stringify(state, null, 2), "utf-8");
  }

  /**
   * Actualiza la fase actual
   */
  async setPhase(phase: Phase): Promise<void> {
    const state = await this.load();
    if (state) {
      state.phase = phase;
      await this.save(state);
    }
  }

  /**
   * Actualiza la iteración actual
   */
  async setIteration(iteration: number): Promise<void> {
    const state = await this.load();
    if (state) {
      state.iteration = iteration;
      await this.save(state);
    }
  }

  /**
   * Actualiza el estado de un agente
   */
  async setAgentStatus(
    agent: "architect" | "executor" | "auditor" | "consultant",
    status: "pending" | "in_progress" | "completed" | "failed",
    duration?: number,
  ): Promise<void> {
    const state = await this.load();
    if (state) {
      state.agents[agent].status = status;
      if (duration !== undefined) {
        state.agents[agent].duration = duration;
      }
      await this.save(state);
    }
  }

  /**
   * Asegura que los directorios necesarios existan
   */
  async ensureDirectories(): Promise<void> {
    await mkdir(this.orchestraDir, { recursive: true });
    await mkdir(this.checkpointsDir, { recursive: true });
  }

  /**
   * Crea un checkpoint
   */
  async createCheckpoint(phase: string): Promise<void> {
    const state = await this.load();
    if (!state) return;

    // Asegurar que el directorio de checkpoints exista
    await this.ensureDirectories();

    const id = String(state.checkpoints.length + 1).padStart(3, "0");
    const timestamp = new Date().toISOString();
    const file = `checkpoints/${id}-${phase}.json`;

    const checkpoint: Checkpoint = { id, phase, file, timestamp };
    state.checkpoints.push(checkpoint);

    // Guardar snapshot del estado
    const checkpointPath = path.join(this.orchestraDir, file);
    await writeFile(checkpointPath, JSON.stringify(state, null, 2), "utf-8");

    await this.save(state);
  }

  /**
   * Registra un error
   */
  async setError(error: string): Promise<void> {
    const state = await this.load();
    if (state) {
      state.lastError = error;
      state.canResume = true; // Aún se puede retomar
      await this.save(state);
    }
  }

  /**
   * Verifica si hay una sesión que se puede retomar
   */
  async canResume(): Promise<boolean> {
    const state = await this.load();
    return state !== null && state.canResume && state.phase !== "completed";
  }

  /**
   * Obtiene el directorio de orchestra
   */
  getOrchestraDir(): string {
    return this.orchestraDir;
  }

  /**
   * Obtiene la ruta de un archivo dentro de .orchestra
   */
  getFilePath(filename: string): string {
    return path.join(this.orchestraDir, filename);
  }

  /**
   * Inicializa el workflow con tracking de modelos
   */
  async initWorkflow(state: SessionState): Promise<void> {
    const enhancedState = state as EnhancedSessionState;

    if (!enhancedState.workflow) {
      enhancedState.workflow = [];
    }

    if (!enhancedState.globalMetrics) {
      enhancedState.globalMetrics = {
        totalCostEstimate: 0,
        startTime: Date.now(),
        totalTokens: 0,
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        fallbackRotations: 0,
        avgLatencyMs: 0,
      };
    }

    await this.save(enhancedState);
  }

  /**
   * Registra el inicio de un intento con un modelo específico
   */
  async recordAttempt(
    stepId: string,
    agentRole: 'architect' | 'executor' | 'auditor' | 'consultant',
    modelId: string,
    provider: string
  ): Promise<void> {
    const state = await this.load() as EnhancedSessionState;
    if (!state) return;

    // Inicializar workflow si no existe
    if (!state.workflow) {
      await this.initWorkflow(state);
      return this.recordAttempt(stepId, agentRole, modelId, provider);
    }

    // Buscar o crear el step
    let step = state.workflow.find(s => s.id === stepId);

    if (!step) {
      step = {
        id: stepId,
        agentRole,
        status: 'running',
        attempts: [],
        startTime: new Date().toISOString(),
      };
      state.workflow.push(step);
    }

    // Registrar nuevo intento
    const attempt: ModelUsage = {
      modelId,
      provider,
      tokensUsed: 0,
      latencyMs: 0,
      success: false,
      timestamp: new Date().toISOString(),
    };

    step.attempts.push(attempt);
    state.globalMetrics.totalAttempts++;

    await this.save(state);
  }

  /**
   * Actualiza el resultado del intento
   */
  async updateAttemptResult(
    stepId: string,
    success: boolean,
    metrics: Partial<ModelUsage>,
    output?: string
  ): Promise<void> {
    const state = await this.load() as EnhancedSessionState;
    if (!state || !state.workflow) return;

    const step = state.workflow.find(s => s.id === stepId);
    if (!step || step.attempts.length === 0) return;

    const lastAttempt = step.attempts[step.attempts.length - 1];

    // Actualizar métricas del intento
    Object.assign(lastAttempt, { ...metrics, success });

    // Actualizar estado del step
    if (success) {
      step.status = 'completed';
      step.endTime = new Date().toISOString();

      if (step.startTime) {
        step.duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
      }

      // Calcular hash del output si se proporciona
      if (output) {
        step.outputHash = createHash('sha256').update(output).digest('hex').substring(0, 16);
      }

      state.globalMetrics.successfulAttempts++;
    } else {
      state.globalMetrics.failedAttempts++;

      // Logging específico por tipo de error
      if (lastAttempt.errorCode === 'RATE_LIMIT_429') {
        console.warn(`⚠️  [StateManager] Modelo ${lastAttempt.modelId} agotado (Rate Limit 429). Rotando al backup.`);
        state.globalMetrics.fallbackRotations++;
      } else if (lastAttempt.errorCode === 'CONTEXT_EXCEEDED') {
        console.warn(`⚠️  [StateManager] Modelo ${lastAttempt.modelId} excedió contexto. Rotando al backup.`);
        state.globalMetrics.fallbackRotations++;
      } else if (lastAttempt.errorCode === 'TIMEOUT') {
        console.warn(`⚠️  [StateManager] Modelo ${lastAttempt.modelId} timeout. Rotando al backup.`);
      }
    }

    // Actualizar métricas globales
    if (metrics.tokensUsed) {
      state.globalMetrics.totalTokens += metrics.tokensUsed;
    }

    if (metrics.estimatedCost) {
      state.globalMetrics.totalCostEstimate += metrics.estimatedCost;
    }

    // Recalcular latencia promedio
    const totalLatency = state.workflow
      .flatMap(s => s.attempts)
      .reduce((sum, a) => sum + a.latencyMs, 0);
    state.globalMetrics.avgLatencyMs = totalLatency / state.globalMetrics.totalAttempts;

    await this.save(state);
  }

  /**
   * Obtiene estadísticas de uso de modelos
   */
  async getModelStats(): Promise<Map<string, { attempts: number; successes: number; failures: number; avgLatency: number; totalCost: number }>> {
    const state = await this.load() as EnhancedSessionState;
    if (!state || !state.workflow) {
      return new Map();
    }

    const stats = new Map<string, { attempts: number; successes: number; failures: number; avgLatency: number; totalCost: number }>();

    for (const step of state.workflow) {
      for (const attempt of step.attempts) {
        const key = attempt.modelId;

        if (!stats.has(key)) {
          stats.set(key, {
            attempts: 0,
            successes: 0,
            failures: 0,
            avgLatency: 0,
            totalCost: 0,
          });
        }

        const modelStats = stats.get(key)!;
        modelStats.attempts++;

        if (attempt.success) {
          modelStats.successes++;
        } else {
          modelStats.failures++;
        }

        modelStats.avgLatency = (modelStats.avgLatency * (modelStats.attempts - 1) + attempt.latencyMs) / modelStats.attempts;
        modelStats.totalCost += attempt.estimatedCost || 0;
      }
    }

    return stats;
  }

  /**
   * Exporta el Experience Buffer para el Learning System
   */
  async exportExperienceBuffer(): Promise<void> {
    const state = await this.load() as EnhancedSessionState;
    if (!state || !state.workflow) return;

    const experienceBufferPath = path.join(this.orchestraDir, 'experience-buffer.jsonl');
    const { appendFile } = await import('fs/promises');

    // Calcular recompensa basada en el rendimiento
    const reward = this.calculateReward(state);

    const experience = {
      sessionId: state.sessionId,
      task: state.task,
      workflow: state.workflow,
      globalMetrics: state.globalMetrics,
      reward,
      timestamp: new Date().toISOString(),
      success: state.phase === 'completed',
    };

    // Agregar al buffer (formato JSONL)
    await appendFile(experienceBufferPath, JSON.stringify(experience) + '\n', 'utf-8');
  }

  /**
   * Calcula la recompensa para el Learning System
   */
  private calculateReward(state: EnhancedSessionState): number {
    let reward = 0;

    // Éxito/Fracaso base
    reward += state.phase === 'completed' ? 100 : -100;

    // Eficiencia de costo
    if (state.globalMetrics.totalCostEstimate < 0.10) {
      reward += 50; // Muy económico (< $0.10)
    } else if (state.globalMetrics.totalCostEstimate < 0.50) {
      reward += 20; // Económico (< $0.50)
    } else if (state.globalMetrics.totalCostEstimate > 2.0) {
      reward -= 30; // Costoso (> $2.00)
    }

    // Penalizar uso excesivo de modelos caros
    const expensiveModelsUsed = state.workflow
      .flatMap(s => s.attempts)
      .filter(a => a.modelId.includes('gpt-5') || a.modelId.includes('opus'))
      .length;

    if (expensiveModelsUsed > 3) {
      reward -= expensiveModelsUsed * 5;
    }

    // Bonus por usar GLM exitosamente (modelo económico)
    const glmSuccesses = state.workflow
      .flatMap(s => s.attempts)
      .filter(a => a.modelId.includes('glm') && a.success)
      .length;

    reward += glmSuccesses * 10;

    // Penalizar rotaciones de fallback excesivas
    reward -= state.globalMetrics.fallbackRotations * 10;

    // Penalizar rate limits
    const rateLimitErrors = state.workflow
      .flatMap(s => s.attempts)
      .filter(a => a.errorCode === 'RATE_LIMIT_429')
      .length;

    reward -= rateLimitErrors * 10;

    return reward;
  }

  /**
   * Limpia el estado actual (borra el directorio de sesión)
   */
  async clear(): Promise<void> {
    const { rm } = await import("fs/promises");
    if (existsSync(this.orchestraDir)) {
      await rm(this.orchestraDir, { recursive: true, force: true });
    }
  }
}
