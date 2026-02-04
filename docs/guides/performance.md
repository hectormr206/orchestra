# Performance Profiling Guide

This guide covers performance profiling and optimization strategies for Orchestra CLI.

## Table of Contents

1. [Profiling Tools](#profiling-tools)
2. [Running Profiles](#running-profiles)
3. [Analyzing Results](#analyzing-results)
4. [Optimization Strategies](#optimization-strategies)
5. [Performance Utilities](#performance-utilities)

---

## Profiling Tools

Orchestra uses several profiling tools to identify performance bottlenecks:

### Clinic.js

[Clinic.js](https://clinicjs.org/) is a suite of tools for Node.js performance profiling:

```bash
npm install --save-dev clinic
```

#### Doctor

General health check to identify issues:

```bash
clinic doctor -- node scripts/profile.js
```

Output: HTML report showing CPU usage, memory, and event loop delay.

#### Bubbleprof

Visualize asynchronous operations:

```bash
clinic bubbleprof -- node scripts/profile.js
```

Output: Bubble chart showing time spent in async operations.

#### Flame

Flame graph for CPU profiling:

```bash
clinic flame -- node scripts/profile.js
```

Output: Interactive flame graph of CPU usage.

### 0x

Alternative flame graph profiler:

```bash
npm install --save-dev 0x
0x -- node scripts/profile.js
```

---

## Running Profiles

### Quick Profile

Run a quick profile on a sample task:

```bash
npm run profile
```

### Custom Profile

Profile a specific workflow:

```bash
clinic doctor -- on -- node dist/cli/index.js start "create a fibonacci function"
```

### TUI Profile

Profile the TUI specifically:

```bash
clinic flame -- on -- node dist/cli/index.js tui
```

---

## Analyzing Results

### Key Metrics to Watch

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Task Duration | < 5 min (3 files) | Profile for bottlenecks |
| Parallel Overhead | < 10% vs sequential | Check concurrency settings |
| Recovery Time | < 30 s per file | Optimize recovery logic |
| Memory Usage | < 500 MB | Check for memory leaks |
| Cache Hit Rate | > 60% | Improve cache keys |
| API Latency (P95) | < 2 s | Check network/adapter |

### Common Bottlenecks

#### 1. API Call Latency

**Symptoms**: Long delays between phases, high time-to-first-byte.

**Solutions**:
- Enable streaming: `streaming: true` in adapter config
- Use prompt caching (automatic)
- Implement request batching
- Consider faster models for simple tasks

#### 2. File I/O Overhead

**Symptoms**: Slow file operations, high I/O wait.

**Solutions**:
- Use `runWithConcurrencyOptimized` for parallel processing
- Batch file operations
- Use async/await consistently

#### 3. Prompt Construction

**Symptoms**: High CPU during phase start.

**Solutions**:
- Prompt caching is enabled by default
- Use prompt templates
- Minimize dynamic prompt content

#### 4. Memory Growth

**Symptoms**: Increasing memory usage over time.

**Solutions**:
- Clear caches between sessions
- Use object pools for frequently created objects
- Limit checkpoint history
- Enable Redis for distributed cache

---

## Optimization Strategies

### 1. Concurrency Optimization

The `runWithConcurrencyOptimized` function provides several optimizations:

```typescript
import { runWithConcurrencyOptimized } from './utils/performanceOptimizer.js';

const results = await runWithConcurrencyOptimized(
  files,
  processFile,
  maxConcurrency,
  onProgress,
  {
    progressBatchInterval: 100,  // Batch progress updates
    progressMinBatchSize: 5,    // Minimum items before update
  },
);
```

**Benefits**:
- Reduced callback overhead
- Better CPU locality
- Lower memory pressure

### 2. Prompt Caching

Compiled prompts are cached automatically:

```typescript
import { globalPromptCache } from './utils/performanceOptimizer.js';

// Automatic caching via buildArchitectPrompt
const prompt = globalPromptCache.getOrCreate(
  () => buildArchitectPrompt(task, skills),
  ['architect', task, ...skills],
);

// Manual cache clearing
globalPromptCache.cleanExpired();
```

**Benefits**:
- Faster prompt construction
- Reduced string operations
- Lower GC pressure

### 3. Memoization

Memoize expensive function calls:

```typescript
import { memoize } from './utils/performanceOptimizer.js';

const expensiveFn = memoize(
  (data: ComplexType) => process(data),
  {
    ttl: 60000,              // 1 minute cache
    maxSize: 100,            // Max 100 entries
    keyGenerator: (data) => data.id,
  },
);
```

**Benefits**:
- Avoid repeated computations
- Configurable TTL
- Automatic cache eviction

### 4. Object Pooling

Reuse expensive objects:

```typescript
import { ObjectPool } from './utils/performanceOptimizer.js';

const bufferPool = new ObjectPool(
  () => new Buffer(1024),
  (buf) => buf.fill(0),
  10,  // Max pool size
);

// Use buffer
const buffer = bufferPool.acquire();
// ... work with buffer ...
bufferPool.release(buffer);
```

**Benefits**:
- Reduced allocation overhead
- Better memory locality
- Lower GC pressure

### 5. Streaming API Responses

Enable streaming for adapter responses:

```typescript
import { processStream } from './utils/streamingAdapter.js';

const result = await processStream(
  () => adapter.execute(prompt),
  {
    enabled: true,
    minChunkSize: 100,
    onChunk: (chunk) => console.log('Received:', chunk.content),
  },
);
```

**Benefits**:
- Lower latency
- Progressive feedback
- Better user experience

---

## Performance Utilities

Orchestra includes several performance optimization utilities in `src/utils/performanceOptimizer.ts`:

### PromptCache

Cache compiled prompts to reduce overhead:

```typescript
const cache = new PromptCache(maxSize, ttlMinutes);
const prompt = cache.getOrCreate(builder, cacheKeyParts);
```

### runWithConcurrencyOptimized

Optimized parallel execution:

```typescript
const results = await runWithConcurrencyOptimized(
  items,
  fn,
  maxConcurrency,
  onProgress,
  options,
);
```

### ObjectPool

Object pooling for expensive allocations:

```typescript
const pool = new ObjectPool(factory, reset, maxSize);
```

### debounce / throttle

Control function call frequency:

```typescript
const debounced = debounce(fn, delay);
const throttled = throttle(fn, interval);
```

### memoize

Cache function results:

```typescript
const memoized = memoize(fn, { ttl, maxSize, keyGenerator });
```

### Lazy

Lazy evaluation wrapper:

```typescript
const lazy = new Lazy(() => expensiveComputation());
const value = lazy.get();  // Only computed once
```

---

## Profiling Checklist

Before optimizing, use this checklist:

- [ ] Run `clinic doctor` to get baseline metrics
- [ ] Identify bottlenecks (API, I/O, CPU, memory)
- [ ] Set realistic targets based on use case
- [ ] Implement one optimization at a time
- [ ] Measure impact of each change
- [ ] Document findings
- [ ] Re-run profile to verify improvement

---

## Best Practices

1. **Profile before optimizing** - Don't guess, measure
2. **Optimize bottlenecks first** - Focus on high-impact areas
3. **Test after each change** - Ensure correctness isn't compromised
4. **Document trade-offs** - Note readability vs performance decisions
5. **Re-profile periodically** - Catch regressions early

---

## See Also

- [Performance Utilities API](../api/performance-optimizer.md)
- [Streaming Adapter API](../api/streaming-adapter.md)
- [Development Guide](development.md)
