/**
 * Structured Logging with Pino
 *
 * Provides structured logging for better debugging and observability
 */

import pino from 'pino';

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  pretty: boolean;
  file?: string;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.ORCHESTRA_LOG_LEVEL as LoggerConfig['level'] || 'info',
  pretty: process.env.NODE_ENV !== 'production',
};

// Create base logger
function createLogger(config: LoggerConfig = DEFAULT_CONFIG) {
  const options: pino.LoggerOptions = {
    level: config.level,
    formatters: {
      level: (label) => ({
        level: label,
      }),
      log: (object) => {
        // Add timestamp to all logs
        return {
          ...object,
          timestamp: new Date().toISOString(),
        };
      },
    },
  };

  if (config.pretty) {
    // Pretty print for development
    return pino({
      ...options,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(options);
}

// Main logger instance
let logger = createLogger();

/**
 * Initialize logger with custom config
 */
export function initLogger(config: Partial<LoggerConfig> = {}): void {
  logger = createLogger({ ...DEFAULT_CONFIG, ...config });
}

/**
 * Get the current logger instance
 */
export function getLogger(): pino.Logger {
  return logger;
}

/**
 * Create a child logger with additional context
 */
export function childLogger(
  context: Record<string, any>,
  bindings?: Record<string, any>
): pino.Logger<never> {
  return logger.child(context, bindings);
}

/**
 * Log level helpers
 */
export const log = {
  debug: (msg: string, obj?: any) => logger.debug(obj, msg),
  info: (msg: string, obj?: any) => logger.info(obj, msg),
  warn: (msg: string, obj?: any) => logger.warn(obj, msg),
  error: (msg: string, obj?: any) => logger.error(obj, msg),

  // Specialized logging methods
  phase: (phase: string, agent: string, obj?: any) =>
    logger.info({ ...obj, phase, agent, type: 'phase' }, `Phase: ${phase} started`),

  phaseComplete: (phase: string, agent: string, duration: number, obj?: any) =>
    logger.info({ ...obj, phase, agent, duration, type: 'phase_complete' }, `Phase: ${phase} completed in ${duration}ms`),

  file: (file: string, status: string, obj?: any) =>
    logger.info({ ...obj, file, status, type: 'file' }, `File ${file}: ${status}`),

  adapter: (adapter: string, obj?: any) =>
    logger.info({ ...obj, adapter, type: 'adapter' }, `Adapter: ${adapter}`),

  fallback: (from: string, to: string, reason: string, obj?: any) =>
    logger.warn({ ...obj, from, to, reason, type: 'fallback' }, `Fallback: ${from} → ${to} (${reason})`),

  recovery: (file: string, attempt: number, max: number, obj?: any) =>
    logger.info({ ...obj, file, attempt, max, type: 'recovery' }, `Recovery: ${file} (${attempt}/${max})`),

  audit: (status: string, issues: number, obj?: any) =>
    logger.info({ ...obj, status, issues, type: 'audit' }, `Audit: ${status} (${issues} issues)`),
};

/**
 * Performance logging
 */
export const perf = {
  start: (operation: string, id: string) => {
    const startTime = Date.now();
    logger.debug({ operation, id, type: 'perf_start' }, `Started: ${operation}`);
    return { startTime, id };
  },

  end: (operation: string, id: string, startTime: number, metadata?: any) => {
    const duration = Date.now() - startTime;
    logger.info(
      { operation, id, duration, ...metadata, type: 'perf_end' },
      `Completed: ${operation} (${duration}ms)`
    );
  },
};

/**
 * Error logging with context
 */
export const logError = (
  error: Error | unknown,
  context: Record<string, any>
) => {
  if (error instanceof Error) {
    logger.error({
      ...context,
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }, error.message);
  } else {
    logger.error({
      ...context,
      type: 'error',
      error: String(error),
    }, String(error));
  }
};

/**
 * Create correlation ID for request tracing
 */
export function createCorrelationId(): string {
  return `orch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Timing utility for performance measurement
 */
export class Timing {
  private start: number;
  private label: string;
  private metadata: any;

  constructor(label: string, metadata?: any) {
    this.start = Date.now();
    this.label = label;
    this.metadata = metadata;
    logger.debug({ label, ...metadata, type: 'timing_start' }, `Timing: ${label} started`);
  }

  end(additionalMetadata?: any): number {
    const duration = Date.now() - this.start;
    logger.debug(
      {
        label: this.label,
        duration,
        ...this.metadata,
        ...additionalMetadata,
        type: 'timing_end'
      },
      `Timing: ${this.label} took ${duration}ms`
    );
    return duration;
  }
}
