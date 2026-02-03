/**
 * OpenTelemetry Integration - Metrics and Observability
 *
 * Provides basic observability with OpenTelemetry
 */

export interface TelemetryConfig {
  enabled: boolean;
  serviceName: string;
  serviceVersion: string;
  environment: string;
}

const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: process.env.OTEL_ENABLED === 'true',
  serviceName: 'orchestra',
  serviceVersion: '0.1.0',
  environment: process.env.NODE_ENV || 'development',
};

/**
 * OpenTelemetry Manager - Simplified for now
 *
 * Full OpenTelemetry integration requires compatible package versions.
 * This provides a basic structure that can be extended later.
 */
export class OpenTelemetryManager {
  private config: TelemetryConfig;
  private _initialized = false;

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize OpenTelemetry
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Basic initialization for now
    // Full OpenTelemetry setup requires compatible SDK versions
    this._initialized = true;
    console.log('OpenTelemetry initialized (basic mode)');
  }

  /**
   * Shutdown telemetry
   */
  async shutdown(): Promise<void> {
    this._initialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Get config
   */
  getConfig(): TelemetryConfig {
    return { ...this.config };
  }
}

// Singleton instance
let telemetryManager: OpenTelemetryManager | null = null;

export function getTelemetryManager(): OpenTelemetryManager {
  if (!telemetryManager) {
    telemetryManager = new OpenTelemetryManager();
  }
  return telemetryManager;
}

/**
 * Helper wrappers for future OpenTelemetry integration
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  // Basic implementation - can be enhanced with actual tracing later
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.debug(`[otel] ${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[otel] ${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

export function setSpanAttribute(key: string, value: any): void {
  // Placeholder for future implementation
  console.debug(`[otel] attribute: ${key}=${value}`);
}

export function recordSpanError(error: Error | unknown): void {
  // Placeholder for future implementation
  console.error(`[otel] error:`, error);
}

export function addSpanEvent(name: string, attributes?: Record<string, any>): void {
  // Placeholder for future implementation
  console.debug(`[otel] event: ${name}`, attributes);
}

// Simple metrics collection
const metricsCollection = new Map<string, number>();

export function recordMetric(name: string, value: number): void {
  const current = metricsCollection.get(name) || 0;
  metricsCollection.set(name, current + value);
}

export function getMetric(name: string): number {
  return metricsCollection.get(name) || 0;
}

export function getAllMetrics(): Record<string, number> {
  return Object.fromEntries(metricsCollection);
}

export function resetMetrics(): void {
  metricsCollection.clear();
}
