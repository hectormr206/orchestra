/**
 * Performance Optimization Utilities
 *
 * Provides utilities for optimizing performance including:
 * - Optimized concurrent execution with batched progress updates
 * - Prompt template caching
 * - Memory-efficient data structures
 */

import { createHash } from 'crypto';

/**
 * Cached prompt entry
 */
interface CachedPrompt {
  template: string;
  hash: string;
  timestamp: number;
}

/**
 * Progress update batch
 */
interface ProgressBatch {
  completed: number;
  total: number;
  inProgress: number;
}

/**
 * Prompt Cache - caches compiled prompts to reduce string concatenation overhead
 */
export class PromptCache {
  private cache = new Map<string, CachedPrompt>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 100, ttlMinutes = 30) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Generate a hash for the prompt components
   */
  private hashKey(components: string[]): string {
    return createHash('sha256').update(components.join('||')).digest('hex');
  }

  /**
   * Get or create a cached prompt
   */
  getOrCreate(
    builder: () => string,
    cacheKeyParts: string[],
  ): string {
    const key = this.hashKey(cacheKeyParts);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.template;
    }

    // Build prompt
    const template = builder();

    // Cache it
    if (this.cache.size >= this.maxSize) {
      // Evict oldest entry
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [k, v] of this.cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      template,
      hash: key,
      timestamp: Date.now(),
    });

    return template;
  }

  /**
   * Clear all cached prompts
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need tracking hits/misses
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

/**
 * Global prompt cache instance
 */
export const globalPromptCache = new PromptCache();

/**
 * Optimized concurrent execution with batched progress updates
 *
 * Reduces overhead by:
 * - Batching progress updates (instead of calling callback on every item)
 * - Using a queue-based approach for better memory locality
 * - Minimizing function call overhead
 */
export async function runWithConcurrencyOptimized<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  maxConcurrency: number,
  onProgress?: (completed: number, total: number, inProgress: number) => void,
  options?: {
    /** Batch progress updates to reduce callback overhead (default: 100ms) */
    progressBatchInterval?: number;
    /** Minimum number of items to complete before reporting progress */
    progressMinBatchSize?: number;
  },
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  const queue: Array<{ item: T; index: number }> = [];
  let currentIndex = 0;
  let completedCount = 0;
  let activeWorkers = 0;

  // Progress batching
  const progressBatchInterval = options?.progressBatchInterval ?? 100;
  const progressMinBatchSize = options?.progressMinBatchSize ?? 1;
  let lastProgressUpdate = Date.now();
  let pendingProgressUpdate = false;

  // Populate queue
  for (let i = 0; i < items.length; i++) {
    queue.push({ item: items[i], index: i });
  }

  const updateProgress = () => {
    onProgress?.(completedCount, items.length, activeWorkers);
    lastProgressUpdate = Date.now();
    pendingProgressUpdate = false;
  };

  const shouldUpdateProgress = () => {
    const now = Date.now();
    const timeElapsed = now - lastProgressUpdate;
    const minItemsCompleted = completedCount >= progressMinBatchSize;

    return (minItemsCompleted && timeElapsed >= progressBatchInterval) ||
           completedCount === items.length;
  };

  const processNext = async (): Promise<void> => {
    while (queue.length > 0) {
      const { item, index } = queue.shift()!;

      try {
        activeWorkers++;
        results[index] = await fn(item, index);
      } catch (error) {
        // Store error as result - caller should handle
        results[index] = { error } as R;
      } finally {
        activeWorkers--;
        completedCount++;

        // Batch progress updates
        if (shouldUpdateProgress() || !pendingProgressUpdate) {
          pendingProgressUpdate = true;
          if (shouldUpdateProgress()) {
            updateProgress();
          }
        }
      }
    }
  };

  // Start workers
  const workers = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    () => processNext(),
  );

  await Promise.all(workers);

  // Final progress update
  if (pendingProgressUpdate) {
    updateProgress();
  }

  return results;
}

/**
 * Object pool for reusing expensive-to-create objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxPoolSize: number;

  constructor(
    factory: () => T,
    reset?: (obj: T) => void,
    maxPoolSize = 10,
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxPoolSize = maxPoolSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxPoolSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }

  get size(): number {
    return this.pool.length;
  }
}

/**
 * Debounced function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttled function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= interval) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, interval - timeSinceLastCall);
    }
  };
}

/**
 * Memoize expensive function calls with TTL
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    maxSize?: number;
  },
): T {
  const cache = new Map<string, { value: ReturnType<T>; expires: number }>();
  const ttl = options?.ttl ?? 60000; // Default 1 minute
  const maxSize = options?.maxSize ?? 100;
  const keyGenerator = options?.keyGenerator ?? ((...args: Parameters<T>) =>
    JSON.stringify(args)
  );

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const now = Date.now();

    // Check cache
    const cached = cache.get(key);
    if (cached && cached.expires > now) {
      return cached.value;
    }

    // Execute function
    const value = fn(...args);

    // Clean expired entries if cache is full
    if (cache.size >= maxSize) {
      for (const [k, v] of cache.entries()) {
        if (v.expires <= now) {
          cache.delete(k);
        }
      }
    }

    // Cache result
    cache.set(key, { value, expires: now + ttl });

    return value;
  }) as T;
}

/**
 * Lazy evaluation wrapper
 */
export class Lazy<T> {
  private value?: T;
  private computed = false;
  private factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get(): T {
    if (!this.computed) {
      this.value = this.factory();
      this.computed = true;
    }
    return this.value!;
  }

  isComputed(): boolean {
    return this.computed;
  }

  reset(): void {
    this.value = undefined;
    this.computed = false;
  }
}
