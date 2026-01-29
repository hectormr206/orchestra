/**
 * Maneja el estado de la sesión de orquestación
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { SessionState, Phase, Checkpoint } from '../types.js';

export class StateManager {
  private orchestraDir: string;
  private stateFile: string;
  private checkpointsDir: string;

  constructor(orchestraDir: string = '.orchestra') {
    this.orchestraDir = orchestraDir;
    this.stateFile = path.join(orchestraDir, 'state.json');
    this.checkpointsDir = path.join(orchestraDir, 'checkpoints');
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
      phase: 'init',
      iteration: 0,
      startedAt: now,
      lastActivity: now,
      agents: {
        architect: { status: 'pending', duration: null },
        executor: { status: 'pending', duration: null },
        auditor: { status: 'pending', duration: null },
        consultant: { status: 'not_needed', duration: null },
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
      const content = await readFile(this.stateFile, 'utf-8');
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
    await writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
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
    agent: 'architect' | 'executor' | 'auditor' | 'consultant',
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    duration?: number
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

    const id = String(state.checkpoints.length + 1).padStart(3, '0');
    const timestamp = new Date().toISOString();
    const file = `checkpoints/${id}-${phase}.json`;

    const checkpoint: Checkpoint = { id, phase, file, timestamp };
    state.checkpoints.push(checkpoint);

    // Guardar snapshot del estado
    const checkpointPath = path.join(this.orchestraDir, file);
    await writeFile(checkpointPath, JSON.stringify(state, null, 2), 'utf-8');

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
    return state !== null && state.canResume && state.phase !== 'completed';
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
}
