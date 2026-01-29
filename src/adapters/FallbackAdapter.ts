/**
 * Fallback Adapter
 *
 * Encadena múltiples adaptadores con fallback automático por límite de uso
 */

import type { ExecuteOptions, AgentResult } from '../types.js';

export interface Adapter {
  execute(options: ExecuteOptions): Promise<AgentResult>;
  isAvailable(): Promise<boolean>;
  getInfo(): { name: string; model: string; provider: string };
}

export interface FallbackAdapterCallbacks {
  onAdapterStart?: (adapter: string, index: number, total: number) => void;
  onAdapterFallback?: (from: string, to: string, reason: string) => void;
  onAdapterSuccess?: (adapter: string, duration: number) => void;
}

export class FallbackAdapter implements Adapter {
  private adapters: Adapter[];
  private callbacks: FallbackAdapterCallbacks;
  private currentAdapterIndex: number = 0;
  private rateLimitedAdapters: Set<string> = new Set();

  constructor(adapters: Adapter[], callbacks: FallbackAdapterCallbacks = {}) {
    if (adapters.length === 0) {
      throw new Error('FallbackAdapter requiere al menos un adapter');
    }
    this.adapters = adapters;
    this.callbacks = callbacks;
  }

  /**
   * Ejecuta con fallback automático
   */
  async execute(options: ExecuteOptions): Promise<AgentResult> {
    let lastError: string | undefined;

    for (let i = this.currentAdapterIndex; i < this.adapters.length; i++) {
      const adapter = this.adapters[i];
      const adapterInfo = adapter.getInfo();

      // Saltar adaptadores que ya alcanzaron su límite
      if (this.rateLimitedAdapters.has(adapterInfo.name)) {
        continue;
      }

      // Verificar disponibilidad
      const isAvailable = await adapter.isAvailable();
      if (!isAvailable) {
        lastError = `${adapterInfo.name} no está disponible`;
        if (i < this.adapters.length - 1) {
          const nextAdapter = this.adapters[i + 1].getInfo();
          this.callbacks.onAdapterFallback?.(
            adapterInfo.model,
            nextAdapter.model,
            'No disponible'
          );
        }
        continue;
      }

      this.callbacks.onAdapterStart?.(adapterInfo.model, i, this.adapters.length);

      const result = await adapter.execute(options);

      if (result.success) {
        this.callbacks.onAdapterSuccess?.(adapterInfo.model, result.duration);
        this.currentAdapterIndex = i; // Recordar el adaptador exitoso
        return result;
      }

      // Verificar si es error de límite de uso
      if (result.error?.startsWith('RATE_LIMIT:')) {
        this.rateLimitedAdapters.add(adapterInfo.name);
        lastError = result.error;

        if (i < this.adapters.length - 1) {
          const nextAdapter = this.adapters[i + 1].getInfo();
          this.callbacks.onAdapterFallback?.(
            adapterInfo.model,
            nextAdapter.model,
            'Límite de uso alcanzado'
          );
          continue; // Intentar con el siguiente
        }
      }

      // Otro tipo de error
      lastError = result.error;
      
      // Si no es rate limit, no hacer fallback automático
      // (podría ser un error legítimo del prompt)
      if (!result.error?.startsWith('RATE_LIMIT:')) {
        return result;
      }
    }

    // Todos los adaptadores fallaron o están rate-limited
    return {
      success: false,
      duration: 0,
      error: lastError || 'Todos los adaptadores fallaron o alcanzaron su límite',
    };
  }

  /**
   * Verifica si al menos un adapter está disponible
   */
  async isAvailable(): Promise<boolean> {
    for (const adapter of this.adapters) {
      if (await adapter.isAvailable()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene información del adapter activo
   */
  getInfo(): { name: string; model: string; provider: string } {
    const activeAdapter = this.adapters[this.currentAdapterIndex];
    const info = activeAdapter.getInfo();
    return {
      name: 'FallbackAdapter',
      model: info.model,
      provider: `${info.provider} (con fallback)`,
    };
  }

  /**
   * Obtiene la cadena completa de adaptadores
   */
  getChain(): string[] {
    return this.adapters.map(a => a.getInfo().model);
  }

  /**
   * Resetea el estado de rate limit (útil después de un tiempo)
   */
  resetRateLimits(): void {
    this.rateLimitedAdapters.clear();
    this.currentAdapterIndex = 0;
  }

  /**
   * Obtiene adaptadores que alcanzaron su límite
   */
  getRateLimitedAdapters(): string[] {
    return Array.from(this.rateLimitedAdapters);
  }
}
