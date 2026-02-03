/**
 * Recovery Mode Optimizer - Enhanced recovery with adaptive strategies
 *
 * Optimizations:
 * - Adaptive timeout based on file complexity
 * - Parallel recovery with controlled concurrency
 * - Analysis caching to avoid redundant work
 * - Incremental fixes before full regeneration
 * - Smart retry strategies
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getLogger, log, perf, Timing } from './logger.js';

const logger = getLogger();

export interface RecoveryConfig {
  maxAttempts: number;
  baseTimeout: number;
  maxConcurrency: number;
  cacheEnabled: boolean;
  incrementalFixesFirst: boolean;
}

export interface FileComplexity {
  size: number;
  lines: number;
  language: string;
  hasDependencies: boolean;
  complexityScore: number;
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  attempt: number;
  timeout: number;
  parallel: boolean;
}

export interface RecoveryCache {
  analyses: Map<string, { analysis: string; timestamp: number }>;
  fixes: Map<string, { fix: string; timestamp: number; success: boolean }>;
}

export interface RecoveryResult {
  file: string;
  success: boolean;
  attempts: number;
  strategy: string;
  duration: number;
}

/**
 * Calculate file complexity for adaptive timeout
 */
export async function calculateFileComplexity(filePath: string): Promise<FileComplexity> {
  const fullPath = path.join(process.cwd(), filePath);
  const ext = path.extname(filePath).toLowerCase();

  let size = 0;
  let lines = 0;
  let hasDependencies = false;

  if (existsSync(fullPath)) {
    try {
      const content = await readFile(fullPath, 'utf-8');
      size = content.length;
      lines = content.split('\n').length;

      // Check for dependencies
      const dependencyPatterns = [
        /import\s+.*from\s+['"](.+)['"]/,
        /require\s*\(\s*['"](.+)['"]\s*\)/,
        /#include\s+['"](.+)['"]/,
        /use\s+\w+::/,
      ];

      hasDependencies = dependencyPatterns.some(pattern => pattern.test(content.toString()));
    } catch {
      // File doesn't exist or can't be read
    }
  }

  // Language complexity weights
  const languageWeights: Record<string, number> = {
    '.rs': 2.5,      // Rust - high complexity
    '.ts': 2.0,      // TypeScript
    '.tsx': 2.2,     // TypeScript + React
    '.cpp': 2.3,     // C++
    '.go': 1.8,      // Go
    '.java': 1.9,    // Java
    '.py': 1.5,      // Python
    '.js': 1.4,      // JavaScript
    '.jsx': 1.6,     // JavaScript + React
    '.rb': 1.3,      // Ruby
    '.php': 1.2,     // PHP
    '.sh': 0.8,      // Shell
    '.yaml': 0.5,    // YAML
    '.yml': 0.5,
    '.json': 0.3,    // JSON
    '.md': 0.2,      // Markdown
  };

  const language = ext || 'unknown';
  const languageWeight = languageWeights[language] || 1.0;

  // Calculate complexity score (0-100)
  const sizeScore = Math.min(size / 10000, 50); // Up to 50 points for size
  const linesScore = Math.min(lines / 500, 30); // Up to 30 points for lines
  const depScore = hasDependencies ? 20 : 0;

  const complexityScore = (sizeScore + linesScore + depScore) * languageWeight;

  return {
    size,
    lines,
    language,
    hasDependencies,
    complexityScore: Math.min(Math.round(complexityScore), 100),
  };
}

/**
 * Calculate adaptive timeout based on file complexity
 */
export async function calculateAdaptiveTimeout(
  file: string,
  baseTimeout: number,
  attemptNumber: number
): Promise<number> {
  const complexity = await calculateFileComplexity(file);

  // Base timeout adjusted by complexity
  let timeout = baseTimeout * (1 + complexity.complexityScore / 100);

  // Increase timeout for later attempts
  timeout *= (1 + (attemptNumber - 1) * 0.5);

  // Cap at 2x base timeout * attempts
  const maxTimeout = baseTimeout * 2 * attemptNumber;

  return Math.min(timeout, maxTimeout);
}

/**
 * Generate recovery strategy for a specific attempt
 */
export function generateRecoveryStrategy(
  attemptNumber: number,
  maxAttempts: number,
  failedFiles: string[]
): RecoveryStrategy {
  const strategies: RecoveryStrategy[] = [
    {
      name: 'incremental-fix',
      description: 'Targeted fixes based on audit feedback',
      attempt: 1,
      timeout: 0.8, // 80% of base timeout
      parallel: true,
    },
    {
      name: 'full-regeneration',
      description: 'Complete regeneration with consultant analysis',
      attempt: 2,
      timeout: 1.0, // 100% of base timeout
      parallel: false,
    },
    {
      name: 'alternative-approach',
      description: 'Alternative implementation approach',
      attempt: 3,
      timeout: 1.5, // 150% of base timeout
      parallel: false,
    },
    {
      name: 'simplified-implementation',
      description: 'Simplified implementation without complexity',
      attempt: 4,
      timeout: 1.2, // 120% of base timeout
      parallel: false,
    },
  ];

  // If we have more attempts than predefined strategies, repeat the last one with longer timeout
  if (attemptNumber > strategies.length) {
    const lastStrategy = strategies[strategies.length - 1];
    return {
      ...lastStrategy,
      attempt: attemptNumber,
      timeout: lastStrategy.timeout * (1 + (attemptNumber - strategies.length) * 0.5),
    };
  }

  return strategies[attemptNumber - 1];
}

/**
 * Recovery cache manager
 */
export class RecoveryCacheManager {
  private cache: RecoveryCache = {
    analyses: new Map(),
    fixes: new Map(),
  };
  private ttl = 5 * 60 * 1000; // 5 minutes TTL

  setAnalysis(file: string, analysis: string): void {
    this.cache.analyses.set(file, {
      analysis,
      timestamp: Date.now(),
    });
  }

  getAnalysis(file: string): string | null {
    const cached = this.cache.analyses.get(file);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.analyses.delete(file);
      return null;
    }

    return cached.analysis;
  }

  setFix(file: string, fix: string, success: boolean): void {
    this.cache.fixes.set(file, {
      fix,
      timestamp: Date.now(),
      success,
    });
  }

  getFix(file: string): { fix: string; success: boolean } | null {
    const cached = this.cache.fixes.get(file);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.fixes.delete(file);
      return null;
    }

    return cached;
  }

  clear(): void {
    this.cache.analyses.clear();
    this.cache.fixes.clear();
  }

  getStats(): { analyses: number; fixes: number } {
    return {
      analyses: this.cache.analyses.size,
      fixes: this.cache.fixes.size,
    };
  }
}

/**
 * Parallel recovery processor
 */
export class ParallelRecoveryProcessor {
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  async processFiles<T>(
    files: string[],
    processor: (file: string) => Promise<T>
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const inProgress = new Set<string>();
    let index = 0;

    const processNext = async (): Promise<void> => {
      while (index < files.length) {
        // Check if we can start a new file
        if (inProgress.size >= this.maxConcurrency) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const file = files[index++];
        inProgress.add(file);

        try {
          const result = await processor(file);
          results.set(file, result);
        } catch (error) {
          log.error(`Failed to process ${file}`, { file, error });
        } finally {
          inProgress.delete(file);
        }
      }
    };

    // Start workers
    const workers = Array.from({ length: this.maxConcurrency }, () => processNext());
    await Promise.all(workers);

    return results;
  }
}

/**
 * Recovery Mode Optimizer - Main class
 */
export class RecoveryOptimizer {
  private config: RecoveryConfig;
  private cache: RecoveryCacheManager;
  private processor: ParallelRecoveryProcessor;

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      baseTimeout: config.baseTimeout ?? 300000, // 5 minutes
      maxConcurrency: config.maxConcurrency ?? 2,
      cacheEnabled: config.cacheEnabled ?? true,
      incrementalFixesFirst: config.incrementalFixesFirst ?? true,
    };

    this.cache = new RecoveryCacheManager();
    this.processor = new ParallelRecoveryProcessor(this.config.maxConcurrency);
  }

  /**
   * Optimize recovery process
   */
  async optimizeRecovery(
    failedFiles: string[],
    recoveryFn: (file: string, strategy: RecoveryStrategy, timeout: number) => Promise<boolean>
  ): Promise<RecoveryResult[]> {
    const results: RecoveryResult[] = [];
    let remainingFiles = [...failedFiles];

    log.info('Starting optimized recovery', {
      files: failedFiles.length,
      maxAttempts: this.config.maxAttempts,
      concurrency: this.config.maxConcurrency,
    });

    const overallTiming = perf.start('recovery-optimization', Date.now().toString());

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const strategy = generateRecoveryStrategy(attempt, this.config.maxAttempts, remainingFiles);

      log.recovery('batch', attempt, this.config.maxAttempts, {
        strategy: strategy.name,
        remainingFiles: remainingFiles.length,
      });

      const fileResults = await this.processAttempt(remainingFiles, strategy, recoveryFn);

      // Separate successful and failed files
      const successful: string[] = [];
      const stillFailing: string[] = [];

      for (const result of fileResults) {
        results.push(result);
        if (result.success) {
          successful.push(result.file);
        } else {
          stillFailing.push(result.file);
        }
      }

      log.info(`Recovery attempt ${attempt} completed`, {
        successful: successful.length,
        failed: stillFailing.length,
      });

      remainingFiles = stillFailing;

      if (remainingFiles.length === 0) {
        log.info('All files recovered successfully');
        break;
      }
    }

    perf.end('recovery-optimization', overallTiming.id, overallTiming.startTime, {
      totalFiles: failedFiles.length,
      recoveredFiles: results.filter(r => r.success).length,
      failedFiles: results.filter(r => !r.success).length,
    });

    return results;
  }

  /**
   * Process a single recovery attempt
   */
  private async processAttempt(
    files: string[],
    strategy: RecoveryStrategy,
    recoveryFn: (file: string, strategy: RecoveryStrategy, timeout: number) => Promise<boolean>
  ): Promise<RecoveryResult[]> {
    const results: RecoveryResult[] = [];

    if (strategy.parallel) {
      // Process files in parallel
      const processingMap = await this.processor.processFiles(files, async (file) => {
        const timeout = await calculateAdaptiveTimeout(file, this.config.baseTimeout, strategy.attempt);
        return await this.processFile(file, strategy, timeout, recoveryFn);
      });

      for (const [file, result] of processingMap.entries()) {
        results.push(result);
      }
    } else {
      // Process files sequentially
      for (const file of files) {
        const timeout = await calculateAdaptiveTimeout(file, this.config.baseTimeout, strategy.attempt);
        const result = await this.processFile(file, strategy, timeout, recoveryFn);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Process a single file
   */
  private async processFile(
    file: string,
    strategy: RecoveryStrategy,
    timeout: number,
    recoveryFn: (file: string, strategy: RecoveryStrategy, timeout: number) => Promise<boolean>
  ): Promise<RecoveryResult> {
    const timing = new Timing(`recovery:${file}`, { file, strategy: strategy.name });

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error(`Recovery timeout for ${file}`)), timeout);
      });

      // Execute recovery with timeout
      const success = await Promise.race([
        recoveryFn(file, strategy, timeout),
        timeoutPromise,
      ]);

      const duration = timing.end();

      return {
        file,
        success,
        attempts: strategy.attempt,
        strategy: strategy.name,
        duration,
      };
    } catch (error) {
      timing.end();
      log.error(`Recovery failed for ${file}`, { file, strategy: strategy.name, error });

      return {
        file,
        success: false,
        attempts: strategy.attempt,
        strategy: strategy.name,
        duration: 0,
      };
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { analyses: number; fixes: number } {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get complexity report for files
   */
  async getComplexityReport(files: string[]): Promise<Array<{ file: string; complexity: FileComplexity }>> {
    const reports = await Promise.all(
      files.map(async file => ({
        file,
        complexity: await calculateFileComplexity(file),
      }))
    );
    return reports;
  }
}

// Singleton instance
let optimizerInstance: RecoveryOptimizer | null = null;

export function getRecoveryOptimizer(config?: Partial<RecoveryConfig>): RecoveryOptimizer {
  if (!optimizerInstance || config) {
    optimizerInstance = new RecoveryOptimizer(config);
  }
  return optimizerInstance;
}
