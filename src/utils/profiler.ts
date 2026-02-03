/**
 * Performance Profiler - Advanced profiling for optimization
 *
 * Provides:
 * - Memory profiling
 * - CPU usage tracking
 * - Bottleneck detection
 * - Performance recommendations
 */

import { performance } from 'perf_hooks';
import { getLogger, log } from './logger.js';

const logger = getLogger();

export interface ProfilingSnapshot {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  eventLoop: {
    min: number;
    max: number;
    avg: number;
  };
}

export interface PerformanceReport {
  operation: string;
  duration: number;
  memoryDelta: number;
  cpuUsage: number;
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

export interface Bottleneck {
  type: 'memory' | 'cpu' | 'io' | 'network' | 'algorithm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  impact: string;
}

export class PerformanceProfiler {
  private snapshots: Map<string, ProfilingSnapshot[]> = new Map();
  private timers: Map<string, number> = new Map();
  private baseline?: ProfilingSnapshot;

  /**
   * Start profiling an operation
   */
  start(operation: string): void {
    this.timers.set(operation, performance.now());
    this.takeSnapshot(operation);
    logger.debug(`Profiling started: ${operation}`);
  }

  /**
   * End profiling and generate report
   */
  end(operation: string): PerformanceReport {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      throw new Error(`No timer found for operation: ${operation}`);
    }

    const duration = performance.now() - startTime;
    this.takeSnapshot(operation);

    const snapshots = this.snapshots.get(operation) || [];
    const bottlenecks = this.detectBottlenecks(operation, snapshots);
    const recommendations = this.generateRecommendations(bottlenecks);

    const report: PerformanceReport = {
      operation,
      duration,
      memoryDelta: this.calculateMemoryDelta(snapshots),
      cpuUsage: this.calculateCpuUsage(snapshots),
      bottlenecks,
      recommendations,
    };

    this.timers.delete(operation);
    logger.debug(`Profiling ended: ${operation} (${duration.toFixed(2)}ms)`);

    return report;
  }

  /**
   * Take a snapshot of current system state
   */
  private takeSnapshot(operation: string): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const snapshot: ProfilingSnapshot = {
      timestamp: Date.now(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        min: 0,
        max: 0,
        avg: 0,
      },
    };

    if (!this.snapshots.has(operation)) {
      this.snapshots.set(operation, []);
    }
    this.snapshots.get(operation)!.push(snapshot);
  }

  /**
   * Detect performance bottlenecks from snapshots
   */
  private detectBottlenecks(
    operation: string,
    snapshots: ProfilingSnapshot[]
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    if (snapshots.length < 2) {
      return bottlenecks;
    }

    // Memory leak detection
    const memoryGrowth = this.calculateMemoryGrowth(snapshots);
    if (memoryGrowth > 50 * 1024 * 1024) { // 50MB threshold
      bottlenecks.push({
        type: 'memory',
        severity: memoryGrowth > 100 * 1024 * 1024 ? 'critical' : 'high',
        description: `Significant memory growth detected: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
        location: operation,
        impact: 'May cause out-of-memory errors under load',
      });
    }

    // High memory usage detection
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (lastSnapshot.memory.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      bottlenecks.push({
        type: 'memory',
        severity: lastSnapshot.memory.heapUsed > 1024 * 1024 * 1024 ? 'critical' : 'medium',
        description: `High heap usage: ${(lastSnapshot.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        location: operation,
        impact: 'Risk of garbage collection pauses',
      });
    }

    // CPU intensive detection
    const cpuUsage = this.calculateCpuUsage(snapshots);
    if (cpuUsage > 80) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'high',
        description: `High CPU usage: ${cpuUsage.toFixed(1)}%`,
        location: operation,
        impact: 'Blocks event loop, affects responsiveness',
      });
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(bottlenecks: Bottleneck[]): string[] {
    const recommendations: string[] = [];

    for (const bottleneck of bottlenecks) {
      switch (bottleneck.type) {
        case 'memory':
          if (bottleneck.description.includes('growth')) {
            recommendations.push('Consider implementing object pooling or caching limits');
            recommendations.push('Check for unintended closures or circular references');
          } else {
            recommendations.push('Implement streaming or batch processing for large datasets');
            recommendations.push('Consider pagination or lazy loading');
          }
          break;

        case 'cpu':
          recommendations.push('Offload CPU-intensive work to worker threads');
          recommendations.push('Consider using native addons for critical paths');
          recommendations.push('Implement batching and debouncing');
          break;

        case 'io':
          recommendations.push('Use async/await for I/O operations');
          recommendations.push('Implement request coalescing and caching');
          break;

        case 'network':
          recommendations.push('Enable compression and request/response caching');
          recommendations.push('Implement connection pooling and keep-alive');
          break;

        case 'algorithm':
          recommendations.push('Review algorithm complexity - consider more efficient data structures');
          recommendations.push('Profile with Chrome DevTools for hot paths');
          break;
      }
    }

    // General optimizations
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
      recommendations.push('Consider profiling under load for edge cases');
    }

    return Array.from(new Set(recommendations)); // Dedupe
  }

  /**
   * Calculate memory delta between first and last snapshot
   */
  private calculateMemoryDelta(snapshots: ProfilingSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    const first = snapshots[0].memory.heapUsed;
    const last = snapshots[snapshots.length - 1].memory.heapUsed;
    return last - first;
  }

  /**
   * Calculate memory growth rate
   */
  private calculateMemoryGrowth(snapshots: ProfilingSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    let maxGrowth = 0;
    for (let i = 1; i < snapshots.length; i++) {
      const growth = snapshots[i].memory.heapUsed - snapshots[0].memory.heapUsed;
      if (growth > maxGrowth) maxGrowth = growth;
    }
    return maxGrowth;
  }

  /**
   * Calculate average CPU usage from snapshots
   */
  private calculateCpuUsage(snapshots: ProfilingSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    let totalCpu = 0;
    for (let i = 1; i < snapshots.length; i++) {
      const userDelta = snapshots[i].cpu.user - snapshots[i - 1].cpu.user;
      const systemDelta = snapshots[i].cpu.system - snapshots[i - 1].cpu.system;
      const timeDelta = snapshots[i].timestamp - snapshots[i - 1].timestamp;
      totalCpu += ((userDelta + systemDelta) / 1000) / timeDelta * 100;
    }

    return totalCpu / (snapshots.length - 1);
  }

  /**
   * Set baseline for comparison
   */
  setBaseline(): void {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.baseline = {
      timestamp: Date.now(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        min: 0,
        max: 0,
        avg: 0,
      },
    };
  }

  /**
   * Get current memory usage formatted
   */
  static getMemoryUsage(): string {
    const mem = process.memoryUsage();
    const format = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + 'MB';

    return [
      `RSS: ${format(mem.rss)}`,
      `Heap Total: ${format(mem.heapTotal)}`,
      `Heap Used: ${format(mem.heapUsed)}`,
      `External: ${format(mem.external)}`,
    ].join(', ');
  }

  /**
   * Compare against baseline
   */
  compareWithBaseline(): { memory: number; cpu: number } | null {
    if (!this.baseline) return null;

    const current = process.memoryUsage();
    const currentCpu = process.cpuUsage();

    return {
      memory: current.heapUsed - this.baseline.memory.heapUsed,
      cpu: currentCpu.user - this.baseline.cpu.user,
    };
  }

  /**
   * Format performance report for display
   */
  static formatReport(report: PerformanceReport): string {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════');
    lines.push(`           PERFORMANCE REPORT: ${report.operation}`);
    lines.push('═══════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Duration: ${report.duration.toFixed(2)}ms`);
    lines.push(`Memory Delta: ${(report.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    lines.push(`CPU Usage: ${report.cpuUsage.toFixed(1)}%`);
    lines.push('');

    if (report.bottlenecks.length > 0) {
      lines.push('─── Bottlenecks Detected ───');
      for (const b of report.bottlenecks) {
        const severity = b.severity.toUpperCase().padEnd(8);
        lines.push(`  [${severity}] ${b.type}: ${b.description}`);
        lines.push(`            Impact: ${b.impact}`);
        if (b.location) {
          lines.push(`            Location: ${b.location}`);
        }
      }
      lines.push('');
    }

    if (report.recommendations.length > 0) {
      lines.push('─── Recommendations ───');
      for (const rec of report.recommendations) {
        lines.push(`  • ${rec}`);
      }
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.snapshots.clear();
    this.timers.clear();
    this.baseline = undefined;
  }
}

// Singleton instance
let profilerInstance: PerformanceProfiler | null = null;

export function getProfiler(): PerformanceProfiler {
  if (!profilerInstance) {
    profilerInstance = new PerformanceProfiler();
  }
  return profilerInstance;
}

/**
 * Decorator to automatically profile functions
 */
export function profile(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const profiler = getProfiler();

    descriptor.value = async function (...args: any[]) {
      const opName = `${target.constructor.name}.${propertyKey}`;
      profiler.start(opName);

      try {
        const result = await originalMethod.apply(this, args);
        const report = profiler.end(opName);

        if (report.bottlenecks.length > 0) {
          log.warn(`Performance issues detected in ${opName}`, {
            bottlenecks: report.bottlenecks,
          });
        }

        return result;
      } catch (error) {
        profiler.end(opName);
        throw error;
      }
    };

    return descriptor;
  };
}
