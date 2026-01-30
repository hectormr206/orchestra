import { performance } from 'node:perf_hooks';

const DEFAULT_CLEANUP_INTERVAL_MS = 10000;
const WARNING_TRACE_ENV_VAR = 'ORCHESTRA_TRACE_WARNINGS';
const CLEANUP_INTERVAL_ENV_VAR = 'ORCHESTRA_PERF_CLEANUP_INTERVAL_MS';

let cleanupTimer: NodeJS.Timeout | null = null;

function shouldTraceWarnings(): boolean {
  return process.env[WARNING_TRACE_ENV_VAR] === '1';
}

function getCleanupInterval(): number {
  const intervalStr = process.env[CLEANUP_INTERVAL_ENV_VAR];
  if (intervalStr) {
    const parsed = parseInt(intervalStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_CLEANUP_INTERVAL_MS;
}

function cleanupPerformanceEntries(): void {
  try {
    const entries = performance.getEntries();
    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    if (marks.length > 0 || measures.length > 0) {
      if (shouldTraceWarnings()) {
        console.log('[Orchestra] Performance entries cleanup:', {
          timestamp: new Date().toISOString(),
          totalEntries: entries.length,
          marks: marks.length,
          measures: measures.length,
          marksCleared: marks.length,
          measuresCleared: measures.length,
        });
      }

      performance.clearMarks();
      performance.clearMeasures();
    }
  } catch (error) {
    if (shouldTraceWarnings()) {
      console.error('[Orchestra] Error during performance cleanup:', error);
    }
  }
}

function trackWarningTrace(): void {
  if (!shouldTraceWarnings()) {
    return;
  }

  const originalEmit = process.emit;
  process.emit = function (event, ...args) {
    if (event === 'warning') {
      const warning = args[0] as Error;
      if (warning.name === 'MaxPerformanceEntryBufferExceededWarning') {
        console.error('[Orchestra] MaxPerformanceEntryBufferExceededWarning detected:', {
          timestamp: new Date().toISOString(),
          message: warning.message,
          stack: warning.stack,
        });

        const entries = performance.getEntries();
        const marks = performance.getEntriesByType('mark');
        const measures = performance.getEntriesByType('measure');

        console.error('[Orchestra] Current performance buffer state:', {
          totalEntries: entries.length,
          marks: marks.length,
          measures: measures.length,
        });

        cleanupPerformanceEntries();
      }
    }
    return originalEmit.call(this, event, ...args);
  };
}

export function initPerfHooks(): void {
  if (cleanupTimer !== null) {
    return;
  }

  trackWarningTrace();

  const interval = getCleanupInterval();

  if (shouldTraceWarnings()) {
    console.log('[Orchestra] Performance hooks mitigation initialized:', {
      cleanupIntervalMs: interval,
      traceWarnings: true,
      timestamp: new Date().toISOString(),
    });
  }

  cleanupTimer = setInterval(cleanupPerformanceEntries, interval);

  cleanupTimer.unref();
}

export function stopPerfHooks(): void {
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;

    if (shouldTraceWarnings()) {
      console.log('[Orchestra] Performance hooks mitigation stopped');
    }
  }
}

export function getPerformanceMetrics(): {
  totalEntries: number;
  marks: number;
  measures: number;
} {
  const entries = performance.getEntries();
  const marks = performance.getEntriesByType('mark');
  const measures = performance.getEntriesByType('measure');

  return {
    totalEntries: entries.length,
    marks: marks.length,
    measures: measures.length,
  };
}