/**
 * Cache de Resultados - Evita re-ejecutar tareas idénticas
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

export interface CacheEntry {
  taskHash: string;
  task: string;
  planFile: string;
  generatedFiles: string[];
  timestamp: string;
  duration: number;
  success: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  directory: string;
  maxAge: number; // milisegundos
  maxEntries: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  directory: '.orchestra/cache',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  maxEntries: 100,
};

export class ResultCache {
  private config: CacheConfig;
  private indexPath: string;
  private index: Map<string, CacheEntry> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.indexPath = path.join(this.config.directory, 'index.json');
  }

  /**
   * Inicializa el cache
   */
  async init(): Promise<void> {
    if (!this.config.enabled) return;

    if (!existsSync(this.config.directory)) {
      await mkdir(this.config.directory, { recursive: true });
    }

    if (existsSync(this.indexPath)) {
      try {
        const content = await readFile(this.indexPath, 'utf-8');
        const entries: CacheEntry[] = JSON.parse(content);
        for (const entry of entries) {
          this.index.set(entry.taskHash, entry);
        }
        await this.cleanup();
      } catch {
        this.index.clear();
      }
    }
  }

  /**
   * Genera hash de una tarea
   */
  hashTask(task: string): string {
    return createHash('sha256').update(task.trim().toLowerCase()).digest('hex').substring(0, 16);
  }

  /**
   * Busca en cache
   */
  async get(task: string): Promise<CacheEntry | null> {
    if (!this.config.enabled) return null;

    const hash = this.hashTask(task);
    const entry = this.index.get(hash);

    if (!entry) return null;

    // Verificar si expiró
    const age = Date.now() - new Date(entry.timestamp).getTime();
    if (age > this.config.maxAge) {
      this.index.delete(hash);
      await this.saveIndex();
      return null;
    }

    // Verificar si los archivos aún existen
    const planExists = existsSync(entry.planFile);
    if (!planExists) {
      this.index.delete(hash);
      await this.saveIndex();
      return null;
    }

    return entry;
  }

  /**
   * Guarda en cache
   */
  async set(task: string, entry: Omit<CacheEntry, 'taskHash'>): Promise<void> {
    if (!this.config.enabled) return;

    const hash = this.hashTask(task);
    const fullEntry: CacheEntry = { ...entry, taskHash: hash };

    this.index.set(hash, fullEntry);
    await this.saveIndex();
  }

  /**
   * Limpia entradas antiguas
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [hash, entry] of this.index) {
      const age = now - new Date(entry.timestamp).getTime();
      if (age > this.config.maxAge) {
        toDelete.push(hash);
      }
    }

    for (const hash of toDelete) {
      this.index.delete(hash);
    }

    // Limitar número de entradas
    if (this.index.size > this.config.maxEntries) {
      const entries = Array.from(this.index.entries())
        .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime());
      
      this.index.clear();
      for (const [hash, entry] of entries.slice(0, this.config.maxEntries)) {
        this.index.set(hash, entry);
      }
    }

    await this.saveIndex();
  }

  /**
   * Guarda el índice
   */
  private async saveIndex(): Promise<void> {
    const entries = Array.from(this.index.values());
    await writeFile(this.indexPath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  /**
   * Lista todas las entradas
   */
  list(): CacheEntry[] {
    return Array.from(this.index.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    this.index.clear();
    await this.saveIndex();
  }

  /**
   * Obtiene estadísticas
   */
  getStats(): { entries: number; oldestEntry: string | null; newestEntry: string | null } {
    const entries = this.list();
    return {
      entries: entries.length,
      oldestEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
      newestEntry: entries.length > 0 ? entries[0].timestamp : null,
    };
  }
}
