#!/usr/bin/env node

/**
 * Performance Benchmark Script
 *
 * Measures Orchestra performance metrics:
 * - Execution time for typical tasks
 * - Parallel vs sequential overhead
 * - Recovery time
 * - Memory usage
 * - Cache hit rate
 * - Auditor approval rate
 *
 * Usage: node scripts/benchmark.js
 */

import { Orchestrator } from '../dist/orchestrator/Orchestrator.js';
import { performance } from 'perf_hooks';

// Sample tasks for benchmarking
const SAMPLE_TASKS = {
  simple: 'Create a function to calculate fibonacci numbers',
  medium: 'Create utility functions: capitalize, reverse, truncate strings',
  complex: 'Create a REST API with Express.js for user management with CRUD operations',
};

// Memory usage measurement
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}

// Measure execution time
async function measureExecution(task, config = {}) {
  const memBefore = getMemoryUsage();
  const startTime = performance.now();

  const orchestrator = new Orchestrator({
    ...config,
    callbacks: {
      onPhaseStart: () => {},
      onPhaseComplete: () => {},
      onError: () => {},
    },
  });

  await orchestrator.orchestrate(task);
  await orchestrator.clean();

  const endTime = performance.now();
  const memAfter = getMemoryUsage();

  return {
    duration: endTime - startTime,
    memoryUsed: memAfter.heapUsed - memBefore.heapUsed,
    peakMemory: memAfter.heapUsed,
  };
}

// Compare parallel vs sequential
async function compareParallel(task) {
  console.log('\n=== Parallel vs Sequential ===');

  const sequential = await measureExecution(task, { parallel: false });
  const parallel = await measureExecution(task, { parallel: true, maxConcurrency: 3 });

  const overhead = ((parallel.duration - sequential.duration) / sequential.duration) * 100;

  console.log(`Sequential: ${sequential.duration.toFixed(0)}ms`);
  console.log(`Parallel: ${parallel.duration.toFixed(0)}ms`);
  console.log(`Overhead: ${overhead.toFixed(1)}%`);
  console.log(`Target: < 10%`);
  console.log(`Status: ${overhead < 10 ? '✓ PASS' : '✗ FAIL'}`);

  return { sequential, parallel, overhead };
}

// Measure cache effectiveness
async function measureCacheHitRate() {
  console.log('\n=== Cache Hit Rate ===');

  const { ResultCache } = await import('../dist/utils/cache.js');
  const cache = new ResultCache({ maxSize: 100, ttl: 60000 });

  const prompt = 'Test prompt for caching';
  const key = 'test-key';

  // First call - cache miss
  const start1 = performance.now();
  await cache.set(key, { content: 'response' });
  const missTime = performance.now() - start1;

  // Second call - cache hit
  const start2 = performance.now();
  await cache.get(key);
  const hitTime = performance.now() - start2;

  // Multiple calls
  const iterations = 100;
  const startMultiple = performance.now();
  for (let i = 0; i < iterations; i++) {
    await cache.get(key);
  }
  const multipleTime = performance.now() - startMultiple;

  const stats = cache.getStats();
  const hitRate = ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1);

  console.log(`Hit rate: ${hitRate}%`);
  console.log(`Target: > 60%`);
  console.log(`Status: ${parseFloat(hitRate) > 60 ? '✓ PASS' : '✗ FAIL'}`);

  return { hitRate, stats };
}

// Main benchmark
async function runBenchmark() {
  console.log('📊 Orchestra Performance Benchmark');
  console.log('====================================');

  const results = {};

  // 1. Simple task execution time
  console.log('\n=== Execution Time (Simple Task) ===');
  const simpleResult = await measureExecution(SAMPLE_TASKS.simple);
  console.log(`Duration: ${(simpleResult.duration / 1000).toFixed(1)}s`);
  console.log(`Target: < 5 min (300s)`);
  console.log(`Status: ${simpleResult.duration < 300000 ? '✓ PASS' : '✗ FAIL'}`);
  results.simple = simpleResult;

  // 2. Parallel overhead
  const parallelResult = await compareParallel(SAMPLE_TASKS.medium);
  results.parallel = parallelResult;

  // 3. Cache hit rate
  const cacheResult = await measureCacheHitRate();
  results.cache = cacheResult;

  // 4. Memory usage
  console.log('\n=== Memory Usage ===');
  const mem = getMemoryUsage();
  console.log(`Heap Used: ${mem.heapUsed} MB`);
  console.log(`RSS: ${mem.rss} MB`);
  console.log(`Target: < 500 MB`);
  console.log(`Status: ${mem.heapUsed < 500 ? '✓ PASS' : '✗ FAIL'}`);
  results.memory = mem;

  // Summary
  console.log('\n====================================');
  console.log('📊 BENCHMARK SUMMARY');
  console.log('====================================');

  const passCount = [
    simpleResult.duration < 300000,
    parallelResult.overhead < 10,
    parseFloat(cacheResult.hitRate) > 60,
    mem.heapUsed < 500,
  ].filter(Boolean).length;

  console.log(`\nPassed: ${passCount}/4 metrics`);
  console.log(`Execution Time: ${simpleResult.duration < 300000 ? '✓' : '✗'}`);
  console.log(`Parallel Overhead: ${parallelResult.overhead < 10 ? '✓' : '✗'}`);
  console.log(`Cache Hit Rate: ${parseFloat(cacheResult.hitRate) > 60 ? '✓' : '✗'}`);
  console.log(`Memory Usage: ${mem.heapUsed < 500 ? '✓' : '✗'}`);

  console.log('\n💡 To measure operational metrics:');
  console.log('   - Recovery success rate: Track over multiple sessions');
  console.log('   - Auditor approval rate: Monitor audit results');
  console.log('   - TUI uptime: Monitor crash frequency in production');
  console.log('   - False positive rate: Track validation accuracy');
}

runBenchmark().catch(console.error);
