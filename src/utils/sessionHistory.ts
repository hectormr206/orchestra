/**
 * Session History - Historial de sesiones anteriores
 */

import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { SessionData } from './sessionExport.js';

export interface SessionSummary {
  id: string;
  task: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  filesCreated: number;
  duration?: number;
}

export interface HistoryConfig {
  directory: string;
  maxSessions: number;
  autoCleanup: boolean;
}

const DEFAULT_CONFIG: HistoryConfig = {
  directory: '.orchestra/sessions',
  maxSessions: 50,
  autoCleanup: true,
};

export class SessionHistory {
  private config: HistoryConfig;
  private indexPath: string;
  private sessions: Map<string, SessionSummary> = new Map();

  constructor(config: Partial<HistoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.indexPath = path.join(this.config.directory, 'history-index.json');
  }

  /**
   * Inicializa el historial
   */
  async init(): Promise<void> {
    if (!existsSync(this.config.directory)) {
      await mkdir(this.config.directory, { recursive: true });
    }

    if (existsSync(this.indexPath)) {
      try {
        const content = await readFile(this.indexPath, 'utf-8');
        const entries: SessionSummary[] = JSON.parse(content);
        for (const entry of entries) {
          this.sessions.set(entry.id, entry);
        }
      } catch {
        this.sessions.clear();
      }
    }

    if (this.config.autoCleanup) {
      await this.cleanup();
    }
  }

  /**
   * Registra una nueva sesión
   */
  async registerSession(session: SessionData): Promise<void> {
    const summary: SessionSummary = {
      id: session.id,
      task: session.task.substring(0, 100) + (session.task.length > 100 ? '...' : ''),
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      filesCreated: session.files.filter(f => f.status === 'created').length,
      duration: session.metrics?.totalDuration,
    };

    this.sessions.set(session.id, summary);
    await this.saveIndex();
  }

  /**
   * Actualiza el estado de una sesión
   */
  async updateSession(id: string, updates: Partial<SessionSummary>): Promise<void> {
    const existing = this.sessions.get(id);
    if (existing) {
      this.sessions.set(id, { ...existing, ...updates });
      await this.saveIndex();
    }
  }

  /**
   * Obtiene el resumen de una sesión
   */
  getSession(id: string): SessionSummary | undefined {
    return this.sessions.get(id);
  }

  /**
   * Alias de getSession para compatibilidad
   */
  get(id: string): SessionSummary | undefined {
    return this.getSession(id);
  }

  /**
   * Obtiene datos completos de sesión (alias de loadFullSession)
   */
  async getFullSession(id: string): Promise<SessionData | null> {
    return this.loadFullSession(id);
  }

  /**
   * Carga los datos completos de una sesión desde el archivo JSON
   */
  async loadFullSession(id: string): Promise<SessionData | null> {
    const files = await readdir(this.config.directory);
    const sessionFile = files.find(f => f.includes(id) && f.endsWith('.json') && f !== 'history-index.json');

    if (!sessionFile) return null;

    try {
      const content = await readFile(path.join(this.config.directory, sessionFile), 'utf-8');
      return JSON.parse(content) as SessionData;
    } catch {
      return null;
    }
  }

  /**
   * Lista todas las sesiones
   */
  list(options: { limit?: number; status?: string; search?: string } = {}): SessionSummary[] {
    let sessions = Array.from(this.sessions.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (options.status) {
      sessions = sessions.filter(s => s.status === options.status);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      sessions = sessions.filter(s =>
        s.task.toLowerCase().includes(searchLower) ||
        s.id.toLowerCase().includes(searchLower)
      );
    }

    if (options.limit) {
      sessions = sessions.slice(0, options.limit);
    }

    return sessions;
  }

  /**
   * Búsqueda full-text en sesiones (task, plan, logs, errors)
   */
  async fullTextSearch(query: string, options: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    searchFields?: ('task' | 'plan' | 'logs' | 'errors')[];
  } = {}): Promise<SessionSummary[]> {
    const results: SessionSummary[] = [];
    const searchLower = query.toLowerCase();
    const fields = options.searchFields || ['task', 'plan', 'logs', 'errors'];

    for (const summary of this.sessions.values()) {
      // Filter by date range
      if (options.dateFrom && new Date(summary.startTime) < options.dateFrom) continue;
      if (options.dateTo && new Date(summary.startTime) > options.dateTo) continue;
      if (options.status && summary.status !== options.status) continue;

      let match = false;

      // Search in task (from summary)
      if (fields.includes('task') && summary.task.toLowerCase().includes(searchLower)) {
        match = true;
      }

      // For plan, logs, and errors, load full session
      if (!match && (fields.includes('plan') || fields.includes('logs') || fields.includes('errors'))) {
        const fullSession = await this.getFullSession(summary.id);
        if (fullSession) {
          if (fields.includes('plan') && fullSession.plan) {
            if (fullSession.plan.toLowerCase().includes(searchLower)) {
              match = true;
            }
          }

          if (!match && fields.includes('logs')) {
            // Search in logs if available
            const sessionWithLogs = fullSession as any;
            if (sessionWithLogs.logs) {
              const logsText = JSON.stringify(sessionWithLogs.logs).toLowerCase();
              if (logsText.includes(searchLower)) {
                match = true;
              }
            }
          }

          if (!match && fields.includes('errors')) {
            // Search in iterations for errors
            if (fullSession.iterations) {
              const iterText = JSON.stringify(fullSession.iterations).toLowerCase();
              if (iterText.includes(searchLower)) {
                match = true;
              }
            }
          }
        }
      }

      if (match) {
        results.push(summary);
      }
    }

    return results;
  }

  /**
   * Filtra sesiones por rango de fechas
   */
  filterByDateRange(from: Date, to: Date): SessionSummary[] {
    return Array.from(this.sessions.values()).filter(s => {
      const startTime = new Date(s.startTime);
      return startTime >= from && startTime <= to;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Elimina múltiples sesiones (bulk delete)
   */
  async bulkDelete(sessionIds: string[]): Promise<{ success: boolean; deleted: number }> {
    let deleted = 0;

    for (const id of sessionIds) {
      try {
        const success = await this.deleteSession(id);
        if (success) deleted++;
      } catch (err) {
        console.error(`Failed to delete ${id}:`, err);
      }
    }

    return { success: true, deleted };
  }

  /**
   * Obtiene estadísticas del historial
   */
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    avgDuration: number;
    avgFiles: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const completed = sessions.filter(s => s.status === 'completed');
    const failed = sessions.filter(s => s.status === 'failed');

    const durations = sessions.filter(s => s.duration).map(s => s.duration as number);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const avgFiles = sessions.length > 0
      ? sessions.reduce((a, s) => a + s.filesCreated, 0) / sessions.length
      : 0;

    return {
      total: sessions.length,
      completed: completed.length,
      failed: failed.length,
      avgDuration,
      avgFiles,
    };
  }

  /**
   * Elimina una sesión del historial
   */
  async deleteSession(id: string): Promise<boolean> {
    if (!this.sessions.has(id)) return false;

    this.sessions.delete(id);
    await this.saveIndex();

    // También eliminar archivos de sesión
    try {
      const files = await readdir(this.config.directory);
      for (const file of files) {
        if (file.includes(id)) {
          const filePath = path.join(this.config.directory, file);
          const { unlink } = await import('fs/promises');
          await unlink(filePath);
        }
      }
    } catch {
      // Ignorar errores al eliminar archivos
    }

    return true;
  }

  /**
   * Limpia sesiones antiguas
   */
  private async cleanup(): Promise<void> {
    if (this.sessions.size <= this.config.maxSessions) return;

    const sessions = Array.from(this.sessions.entries())
      .sort((a, b) => new Date(b[1].startTime).getTime() - new Date(a[1].startTime).getTime());

    const toKeep = sessions.slice(0, this.config.maxSessions);
    const toDelete = sessions.slice(this.config.maxSessions);

    this.sessions.clear();
    for (const [id, summary] of toKeep) {
      this.sessions.set(id, summary);
    }

    // Eliminar archivos de sesiones antiguas
    for (const [id] of toDelete) {
      try {
        const files = await readdir(this.config.directory);
        for (const file of files) {
          if (file.includes(id)) {
            const filePath = path.join(this.config.directory, file);
            const { unlink } = await import('fs/promises');
            await unlink(filePath);
          }
        }
      } catch {
        // Ignorar errores
      }
    }

    await this.saveIndex();
  }

  /**
   * Guarda el índice
   */
  private async saveIndex(): Promise<void> {
    const entries = Array.from(this.sessions.values());
    await writeFile(this.indexPath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  /**
   * Formatea una sesión para mostrar en consola
   */
  static formatForConsole(session: SessionSummary): string {
    const statusIcon = getStatusIcon(session.status);
    const duration = session.duration ? formatDuration(session.duration) : '-';
    const date = new Date(session.startTime).toLocaleString();

    return statusIcon + ' ' + session.id.substring(0, 8) + ' | ' + date + ' | ' + duration + ' | ' + session.filesCreated + ' files | ' + session.task;
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'running': return '🔄';
    case 'cancelled': return '⚠️';
    default: return '❓';
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + 'm ' + seconds + 's';
}
