/**
 * Tests for streaming adapter utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  processStream,
  StreamAccumulator,
  transformStream,
  batchStream,
  filterStream,
  mergeStreams,
  rateLimitStream,
  splitLines,
  parseJsonStream,
  monitorStream,
  type StreamChunk,
} from './streamingAdapter.js';

describe('streamingAdapter', () => {
  describe('processStream', () => {
    it('should process non-streaming response', async () => {
      const executor = async () => 'test result';

      const result = await processStream(executor, {});

      expect(result.result).toBe('test result');
      expect(result.chunks).toEqual(['test result']);
      expect(result.chunkCount).toBe(1);
      expect(result.timeToFirstByte).toBeGreaterThanOrEqual(0);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should process streaming response with chunks', async () => {
      const executor = async () => 'test streaming result';

      const chunks: string[] = [];

      const result = await processStream(executor, {
        enabled: true,
        minChunkSize: 5,
        onChunk: (chunk) => {
          chunks.push(chunk.content);
        },
      });

      expect(result.result).toBe('test streaming result');
      expect(chunks.length).toBeGreaterThan(1);
      expect(result.chunkCount).toBe(chunks.length);
    });

    it('should call onComplete callback', async () => {
      const executor = async () => 'test';
      const onComplete = vi.fn();

      await processStream(executor, {
        enabled: true,
        onComplete,
      });

      expect(onComplete).toHaveBeenCalledWith('test');
    });

    it('should call onError callback on error', async () => {
      const executor = async () => {
        throw new Error('Test error');
      };
      const onError = vi.fn();

      await expect(processStream(executor, { onError })).rejects.toThrow('Test error');
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('StreamAccumulator', () => {
    let accumulator: StreamAccumulator;

    beforeEach(() => {
      accumulator = new StreamAccumulator();
    });

    it('should accumulate chunks', () => {
      accumulator.addChunk('Hello ');
      accumulator.addChunk('World ');

      expect(accumulator.getResult()).toBe('Hello World ');
    });

    it('should track time to first byte', async () => {
      expect(accumulator.getTimeToFirstByte()).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 1));
      accumulator.addChunk('First');

      expect(accumulator.getTimeToFirstByte()).toBeGreaterThan(0);
    });

    it('should track elapsed time', async () => {
      const time1 = accumulator.getElapsedTime();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const time2 = accumulator.getElapsedTime();

      expect(time2).toBeGreaterThan(time1);
    });

    it('should track chunk count', () => {
      expect(accumulator.getChunkCount()).toBe(0);

      accumulator.addChunk('chunk1');
      accumulator.addChunk('chunk2');

      expect(accumulator.getChunkCount()).toBe(2);
    });

    it('should reset accumulator', () => {
      accumulator.addChunk('test');
      expect(accumulator.getResult()).toBe('test');
      expect(accumulator.getChunkCount()).toBe(1);

      accumulator.reset();

      expect(accumulator.getResult()).toBe('');
      expect(accumulator.getChunkCount()).toBe(0);
    });
  });

  describe('transformStream', () => {
    it('should transform chunks', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: 'hello', done: false };
        yield { content: 'world', done: true };
      }

      const transformed = transformStream(generateChunks(), (s) => s.toUpperCase());
      const results: string[] = [];

      for await (const chunk of transformed) {
        results.push(chunk.content);
      }

      expect(results).toEqual(['HELLO', 'WORLD']);
    });
  });

  describe('batchStream', () => {
    it('should batch chunks', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        for (let i = 0; i < 10; i++) {
          yield { content: `chunk${i}`, done: i === 9 };
        }
      }

      const batched = batchStream(generateChunks(), 3);
      const batches: StreamChunk[][] = [];

      for await (const batch of batched) {
        batches.push(batch);
      }

      expect(batches.length).toBe(4); // 3, 3, 3, 1
      expect(batches[0].length).toBe(3);
      expect(batches[3].length).toBe(1);
    });

    it('should delay between batches', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        for (let i = 0; i < 4; i++) {
          yield { content: `chunk${i}`, done: i === 3 };
        }
      }

      const startTime = Date.now();
      const batched = batchStream(generateChunks(), 2, 50);

      for await (const batch of batched) {
        // Consume all batches
      }

      const elapsed = Date.now() - startTime;

      // Should have at least 50ms delay between batches
      expect(elapsed).toBeGreaterThan(40);
    });
  });

  describe('filterStream', () => {
    it('should filter chunks', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: 'keep1', done: false };
        yield { content: 'drop', done: false };
        yield { content: 'keep2', done: true };
      }

      const filtered = filterStream(generateChunks(), (s) => s.startsWith('keep'));
      const results: string[] = [];

      for await (const chunk of filtered) {
        results.push(chunk.content);
      }

      expect(results).toEqual(['keep1', 'keep2']);
    });
  });

  describe('mergeStreams', () => {
    it('should merge multiple streams', async () => {
      async function* stream1(): AsyncIterable<StreamChunk> {
        yield { content: 'a1', done: false };
        yield { content: 'a2', done: true };
      }

      async function* stream2(): AsyncIterable<StreamChunk> {
        yield { content: 'b1', done: false };
        yield { content: 'b2', done: true };
      }

      const merged = mergeStreams(stream1(), stream2());
      const results: Array<{ content: string; streamIndex: number }> = [];

      for await (const chunk of merged) {
        results.push({
          content: chunk.content,
          streamIndex: chunk.streamIndex,
        });
      }

      expect(results.length).toBe(4);
      expect(results.some((r) => r.streamIndex === 0)).toBe(true);
      expect(results.some((r) => r.streamIndex === 1)).toBe(true);
    });
  });

  describe('rateLimitStream', () => {
    it('should rate limit chunks', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        for (let i = 0; i < 5; i++) {
          yield { content: `chunk${i}`, done: i === 4 };
        }
      }

      const rateLimited = rateLimitStream(generateChunks(), 100); // 100 chunks/sec
      const startTime = Date.now();

      let count = 0;
      for await (const chunk of rateLimited) {
        count++;
      }

      const elapsed = Date.now() - startTime;

      expect(count).toBe(5);
      // Should take at least 40ms for 5 chunks at 100/sec
      expect(elapsed).toBeGreaterThan(30);
    });
  });

  describe('splitLines', () => {
    it('should split stream into lines', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: 'line1\nline2\nli', done: false };
        yield { content: 'ne3\nline4', done: true };
      }

      const lines = splitLines(generateChunks());
      const results: string[] = [];

      for await (const line of lines) {
        results.push(line);
      }

      expect(results).toEqual(['line1', 'line2', 'line3', 'line4']);
    });

    it('should handle incomplete final line', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: 'line1\nline2\nincomplete', done: true };
      }

      const lines = splitLines(generateChunks());
      const results: string[] = [];

      for await (const line of lines) {
        results.push(line);
      }

      expect(results).toEqual(['line1', 'line2', 'incomplete']);
    });
  });

  describe('parseJsonStream', () => {
    it('should parse JSON objects from stream', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: '{"a":1}', done: false };
        yield { content: '{"b":2}', done: true };
      }

      const jsonStream = parseJsonStream(generateChunks());
      const results: unknown[] = [];

      for await (const obj of jsonStream) {
        results.push(obj);
      }

      expect(results).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should handle split JSON objects', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: '{"a":1,"b"', done: false };
        yield { content: ':2}', done: true };
      }

      const jsonStream = parseJsonStream(generateChunks());
      const results: unknown[] = [];

      for await (const obj of jsonStream) {
        results.push(obj);
      }

      expect(results).toEqual([{ a: 1, b: 2 }]);
    });

    it('should ignore invalid JSON', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        yield { content: 'not json', done: true };
      }

      const jsonStream = parseJsonStream(generateChunks());
      const results: unknown[] = [];

      for await (const obj of jsonStream) {
        results.push(obj);
      }

      expect(results).toEqual([]);
    });
  });

  describe('monitorStream', () => {
    it('should monitor stream progress', async () => {
      async function* generateChunks(): AsyncIterable<StreamChunk> {
        for (let i = 0; i < 5; i++) {
          yield { content: `chunk${i}`, done: i === 4 };
        }
      }

      const monitored = monitorStream(generateChunks());
      const progresses: unknown[] = [];

      for await (const chunk of monitored) {
        progresses.push(chunk.progress);
      }

      expect(progresses.length).toBe(5);

      // First progress
      expect(progresses[0]).toHaveProperty('totalChunks');
      expect(progresses[0]).toHaveProperty('totalCharacters');
      expect(progresses[0]).toHaveProperty('elapsed');
      expect(progresses[0]).toHaveProperty('chunksPerSecond');
      expect(progresses[0]).toHaveProperty('charactersPerSecond');

      // Last progress should have all chunks
      expect(progresses[4]!.totalChunks).toBe(5);
    });
  });
});
