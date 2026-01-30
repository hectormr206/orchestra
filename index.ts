import { performance } from 'node:perf_hooks';

/**
 * Configuration for performance hooks mitigation
 */
export interface PerfHooksConfig {
  /** Enable periodic cleanup of performance entries (default: true) */
  enabled: boolean;
  /** Interval in milliseconds for cleanup (default: 10000 = 10s) */
  cleanupIntervalMs: number;
  /** Enable trace logging for warnings (default: false) */
  traceWarnings: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PerfHooksConfig = {
  enabled: true,
  cleanupIntervalMs: 10000,
  traceWarnings: false,
};

/**
 * Active cleanup interval timer ID
 */
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Number of entries cleaned in each cycle
 */
let entriesCleaned = 0;

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): Partial<PerfHooksConfig> {
  const config: Partial<PerfHooksConfig> = {};

  const enabled = process.env.ORCHESTRA_PERF_CLEANUP_ENABLED;
  if (enabled !== undefined) {
    config.enabled = enabled.toLowerCase() === '1' || enabled.toLowerCase() === 'true';
  }

  const interval = process.env.ORCHESTRA_PERF_CLEANUP_INTERVAL_MS;
  if (interval !== undefined) {
    const parsed = parseInt(interval, 10);
    if (!isNaN(parsed) && parsed > 0) {
      config.cleanupIntervalMs = parsed;
    }
  }

  const trace = process.env.ORCHESTRA_TRACE_WARNINGS;
  if (trace !== undefined) {
    config.traceWarnings = trace.toLowerCase() === '1' || trace.toLowerCase() === 'true';
  }

  return config;
}

/**
 * Perform cleanup of performance entries
 * Removes all marks and measures from the performance buffer
 */
function performCleanup(): void {
  try {
    const beforeMarks = performance.getEntriesByType('mark').length;
    const beforeMeasures = performance.getEntriesByType('measure').length;

    // Clear all marks and measures
    performance.clearMarks();
    performance.clearMeasures();

    const afterMarks = performance.getEntriesByType('mark').length;
    const afterMeasures = performance.getEntriesByType('measure').length;

    entriesCleaned = (beforeMarks - afterMarks) + (beforeMeasures - afterMeasures);

    if (entriesCleaned > 0 && config.traceWarnings) {
      console.warn(
        `[PerfHooks] Cleaned ${entriesCleaned} performance entries ` +
        `(${beforeMarks} marks, ${beforeMeasures} measures)`
      );
    }
  } catch (error) {
    // Ignore errors from performance API (may not be available in all environments)
    if (config.traceWarnings) {
      console.warn('[PerfHooks] Cleanup failed:', error);
    }
  }
}

/**
 * Set up warning listener for trace logging
 * Captures MaxPerformanceEntryBufferExceededWarning and logs stack trace
 */
function setupWarningListener(): void {
  process.on('warning', (warning) => {
    if (warning.name === 'MaxPerformanceEntryBufferExceededWarning' && config.traceWarnings) {
      console.error('\n[PerfHooks] MaxPerformanceEntryBufferExceededWarning detected:');
      console.error('Warning:', warning.message);
      console.error('Stack:', warning.stack);
      console.error('');

      // Force immediate cleanup when warning is detected
      performCleanup();
    }
  });
}

/**
 * Active configuration (merged defaults with env vars)
 */
let config: PerfHooksConfig = {
  ...DEFAULT_CONFIG,
  ...loadConfigFromEnv(),
};

/**
 * Initialize performance hooks mitigation
 * Should be called at application startup (CLI and TUI entrypoints)
 *
 * @param customConfig - Optional custom configuration to override defaults
 */
export function initPerfHooks(customConfig?: Partial<PerfHooksConfig>): void {
  if (cleanupTimer !== null) {
    // Already initialized
    return;
  }

  // Merge configuration: defaults -> env vars -> custom config
  config = {
    ...DEFAULT_CONFIG,
    ...loadConfigFromEnv(),
    ...customConfig,
  };

  if (!config.enabled) {
    return;
  }

  // Set up warning listener for trace logging
  if (config.traceWarnings) {
    setupWarningListener();
  }

  // Perform initial cleanup
  performCleanup();

  // Set up periodic cleanup
  cleanupTimer = setInterval(performCleanup, config.cleanupIntervalMs);

  // Unref the timer to allow Node.js to exit if this is the only active timer
  cleanupTimer.unref();

  if (config.traceWarnings) {
    console.warn(
      `[PerfHooks] Mitigation initialized (interval: ${config.cleanupIntervalMs}ms)`
    );
  }
}

/**
 * Stop performance hooks mitigation
 * Should be called at application shutdown for cleanup
 */
export function stopPerfHooks(): void {
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  if (config.traceWarnings) {
    console.warn('[PerfHooks] Mitigation stopped');
  }
}

/**
 * Get current statistics about performance entries
 * Useful for debugging and monitoring
 */
export function getPerfStats(): {
  marks: number;
  measures: number;
  totalEntries: number;
  lastCleanupCount: number;
  isActive: boolean;
} {
  return {
    marks: performance.getEntriesByType('mark').length,
    measures: performance.getEntriesByType('measure').length,
    totalEntries: performance.getEntries().length,
    lastCleanupCount: entriesCleaned,
    isActive: cleanupTimer !== null,
  };
}

/**
 * Manually trigger performance entries cleanup
 * Can be called by application code when needed
 */
export function cleanupPerformanceEntries(): number {
  performCleanup();
  return entriesCleaned;
}