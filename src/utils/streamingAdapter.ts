/**
 * Streaming Adapter Utilities
 *
 * Provides streaming support for API responses to reduce latency.
 * When streaming is enabled, partial results are processed as they arrive.
 */

/**
 * Stream chunk from API
 */
export interface StreamChunk {
  content: string;
  done: boolean;
  index?: number;
}

/**
 * Stream options
 */
export interface StreamOptions {
  /** Enable streaming (default: false) */
  enabled?: boolean;
  /** Minimum chunk size to process (default: 10 characters) */
  minChunkSize?: number;
  /** Callback for partial results */
  onChunk?: (chunk: StreamChunk) => void;
  /** Callback for complete result */
  onComplete?: (result: string) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

/**
 * Stream result with partial results
 */
export interface StreamResult {
  /** Full accumulated result */
  result: string;
  /** Partial results received */
  chunks: string[];
  /** Number of chunks */
  chunkCount: number;
  /** Total time to first byte */
  timeToFirstByte: number;
  /** Total time to complete */
  totalTime: number;
}

/**
 * Process a streamable response
 *
 * @example
 * ```typescript
 * const result = await processStream(
 *   async () => await api.call(),
 *   {
 *     enabled: true,
 *     onChunk: (chunk) => console.log('Received:', chunk.content),
 *   }
 * );
 * ```
 */
export async function processStream<T>(
  executor: () => Promise<T>,
  options?: StreamOptions,
): Promise<StreamResult & { data: T }> {
  const startTime = Date.now();
  const chunks: string[] = [];
  let timeToFirstByte = 0;
  let firstByteReceived = false;
  let result = '';

  try {
    // Execute the request
    const data = await executor();

    // If data is a string with streaming support
    if (typeof data === 'string' && options?.enabled) {
      result = data;

      if (!firstByteReceived) {
        timeToFirstByte = Date.now() - startTime;
        firstByteReceived = true;
      }

      // Simulate chunking (in real implementation, API would provide actual chunks)
      const chunkSize = options.minChunkSize ?? 10;
      for (let i = 0; i < result.length; i += chunkSize) {
        const chunk = result.slice(i, i + chunkSize);
        chunks.push(chunk);
        options.onChunk?.({
          content: chunk,
          done: i + chunkSize >= result.length,
          index: chunks.length - 1,
        });
      }
    } else {
      // Non-streaming mode
      result = String(data);
      chunks.push(result);
      timeToFirstByte = Date.now() - startTime;
    }

    const totalTime = Date.now() - startTime;

    options?.onComplete?.(result);

    return {
      result,
      chunks,
      chunkCount: chunks.length,
      timeToFirstByte,
      totalTime,
      data: data as T,
    };
  } catch (error) {
    options?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Accumulator for streaming responses
 */
export class StreamAccumulator {
  private buffer: string[] = [];
  private startTime: number;
  private firstByteTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Add a chunk to the accumulator
   */
  addChunk(chunk: string): void {
    if (!this.firstByteTime) {
      this.firstByteTime = Date.now();
    }
    this.buffer.push(chunk);
  }

  /**
   * Get the accumulated result
   */
  getResult(): string {
    return this.buffer.join('');
  }

  /**
   * Get time to first byte
   */
  getTimeToFirstByte(): number {
    return this.firstByteTime ? this.firstByteTime - this.startTime : 0;
  }

  /**
   * Get total elapsed time
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get number of chunks
   */
  getChunkCount(): number {
    return this.buffer.length;
  }

  /**
   * Reset the accumulator
   */
  reset(): void {
    this.buffer = [];
    this.startTime = Date.now();
    this.firstByteTime = undefined;
  }
}

/**
 * Transform stream chunks
 */
export function transformStream(
  stream: AsyncIterable<StreamChunk>,
  transform: (chunk: string) => string,
): AsyncIterable<StreamChunk> {
  return (async function* () {
    for await (const chunk of stream) {
      yield {
        ...chunk,
        content: transform(chunk.content),
      };
    }
  })();
}

/**
 * Batch stream chunks
 */
export function batchStream(
  stream: AsyncIterable<StreamChunk>,
  batchSize: number,
  delayMs = 0,
): AsyncIterable<StreamChunk[]> {
  return (async function* () {
    const batch: StreamChunk[] = [];

    for await (const chunk of stream) {
      batch.push(chunk);

      if (batch.length >= batchSize) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        yield [...batch];
        batch.length = 0;
      }
    }

    // Yield remaining chunks
    if (batch.length > 0) {
      yield batch;
    }
  })();
}

/**
 * Filter stream chunks
 */
export function filterStream(
  stream: AsyncIterable<StreamChunk>,
  predicate: (chunk: string) => boolean,
): AsyncIterable<StreamChunk> {
  return (async function* () {
    for await (const chunk of stream) {
      if (predicate(chunk.content)) {
        yield chunk;
      }
    }
  })();
}

/**
 * Merge multiple streams
 */
export function mergeStreams(
  ...streams: Array<AsyncIterable<StreamChunk>>
): AsyncIterable<StreamChunk & { streamIndex: number }> {
  return (async function* () {
    const iterators = streams.map((s, i) => ({
      iterator: s[Symbol.asyncIterator](),
      index: i,
    }));

    while (iterators.length > 0) {
      let hasValues = false;

      for (let i = iterators.length - 1; i >= 0; i--) {
        const { iterator, index } = iterators[i];
        const result = await iterator.next();

        if (result.done) {
          iterators.splice(i, 1);
        } else {
          hasValues = true;
          yield {
            ...result.value,
            streamIndex: index,
          };
        }
      }

      if (!hasValues) {
        break;
      }
    }
  })();
}

/**
 * Rate-limited stream
 */
export function rateLimitStream(
  stream: AsyncIterable<StreamChunk>,
  maxChunksPerSecond: number,
): AsyncIterable<StreamChunk> {
  const interval = 1000 / maxChunksPerSecond;
  let lastYield = 0;

  return (async function* () {
    for await (const chunk of stream) {
      const now = Date.now();
      const elapsed = now - lastYield;

      if (elapsed < interval) {
        await new Promise((resolve) => setTimeout(resolve, interval - elapsed));
      }

      lastYield = Date.now();
      yield chunk;
    }
  })();
}

/**
 * Split stream into lines
 */
export function splitLines(
  stream: AsyncIterable<StreamChunk>,
): AsyncIterable<string> {
  return (async function* () {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.content;
      const lines = buffer.split('\n');

      // Keep the last (potentially incomplete) line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        yield line;
      }
    }

    // Yield remaining buffer
    if (buffer) {
      yield buffer;
    }
  })();
}

/**
 * Parse JSON from stream (for complete JSON objects)
 */
export function parseJsonStream<T = unknown>(
  stream: AsyncIterable<StreamChunk>,
): AsyncIterable<T> {
  return (async function* () {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.content;

      // Try to parse complete JSON objects
      while (true) {
        const trimmed = buffer.trim();
        if (!trimmed) break;

        try {
          // Try to parse the buffer as JSON
          const parsed = JSON.parse(trimmed);
          yield parsed as T;
          buffer = '';
          break;
        } catch {
          // If parsing fails, we need more data
          // Check if we have a potential complete object
          const openBraces = (buffer.match(/{/g) || []).length;
          const closeBraces = (buffer.match(/}/g) || []).length;

          if (openBraces > 0 && openBraces === closeBraces) {
            // Try parsing one more time
            try {
              const parsed = JSON.parse(trimmed);
              yield parsed as T;
              buffer = '';
              break;
            } catch {
              // Still incomplete, wait for more data
              break;
            }
          } else {
            // Incomplete, wait for more data
            break;
          }
        }
      }
    }

    // Try to parse remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        yield parsed as T;
      } catch {
        // Invalid JSON at end of stream, ignore
      }
    }
  })();
}

/**
 * Monitor stream progress
 */
export interface StreamProgress {
  totalChunks: number;
  totalCharacters: number;
  elapsed: number;
  chunksPerSecond: number;
  charactersPerSecond: number;
}

export function monitorStream(
  stream: AsyncIterable<StreamChunk>,
): AsyncIterable<StreamChunk & { progress: StreamProgress }> {
  const startTime = Date.now();
  let totalChunks = 0;
  let totalCharacters = 0;

  return (async function* () {
    for await (const chunk of stream) {
      totalChunks++;
      totalCharacters += chunk.content.length;

      const elapsed = Date.now() - startTime;
      const elapsedSeconds = elapsed / 1000;

      yield {
        ...chunk,
        progress: {
          totalChunks,
          totalCharacters,
          elapsed,
          chunksPerSecond: totalChunks / elapsedSeconds,
          charactersPerSecond: totalCharacters / elapsedSeconds,
        },
      };
    }
  })();
}
