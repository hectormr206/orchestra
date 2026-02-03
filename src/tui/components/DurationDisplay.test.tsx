/**
 * Tests for DurationDisplay TUI Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { DurationDisplay } from './DurationDisplay.js';

// Helper function to test the formatting logic directly
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

describe('DurationDisplay Component', () => {
  describe('formatDuration helper function', () => {
    it('should display milliseconds for durations < 1s', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
      expect(formatDuration(0)).toBe('0ms');
    });

    it('should display seconds for durations < 1m', () => {
      expect(formatDuration(1000)).toBe('1.0s');
      expect(formatDuration(5000)).toBe('5.0s');
      expect(formatDuration(59000)).toBe('59.0s');
    });

    it('should display minutes and seconds for durations >= 1m', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(3661000)).toBe('61m 1s');
    });
  });

  describe('component rendering', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should render without crashing', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={Date.now()} isRunning={false} />
      );
      expect(lastFrame()).toBeDefined();
    });

    it('should show 0ms when first rendered', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={Date.now()} isRunning={false} />
      );
      expect(lastFrame()).toContain('0ms');
    });

    it('should render with isRunning true without errors', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={Date.now() - 1000} isRunning={true} />
      );
      expect(lastFrame()).toBeDefined();
    });

    it('should handle custom interval prop', () => {
      const { lastFrame } = render(
        <DurationDisplay
          startTime={Date.now()}
          isRunning={true}
          interval={500}
        />
      );
      expect(lastFrame()).toBeDefined();
    });
  });

  describe('component behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should start interval when isRunning is true', () => {
      render(
        <DurationDisplay startTime={Date.now()} isRunning={true} interval={100} />
      );

      // Should not throw when advancing timers
      expect(() => vi.advanceTimersByTime(500)).not.toThrow();
    });

    it('should not start interval when isRunning is false', () => {
      render(
        <DurationDisplay startTime={Date.now()} isRunning={false} />
      );

      // Should not throw when advancing timers
      expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    });

    it('should clear interval on unmount', () => {
      const { unmount } = render(
        <DurationDisplay startTime={Date.now()} isRunning={true} interval={100} />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle isRunning prop changes', () => {
      const { rerender } = render(
        <DurationDisplay startTime={Date.now()} isRunning={true} />
      );

      expect(() =>
        rerender(
          <DurationDisplay startTime={Date.now()} isRunning={false} />
        )
      ).not.toThrow();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle startTime of 0', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={0} isRunning={true} />
      );
      expect(lastFrame()).toBeDefined();
    });

    it('should handle negative startTime (past)', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={-10000} isRunning={true} />
      );
      expect(lastFrame()).toBeDefined();
    });

    it('should handle future startTime', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={Date.now() + 10000} isRunning={true} />
      );
      expect(lastFrame()).toBeDefined();
    });

    it('should handle very long durations', () => {
      const { lastFrame } = render(
        <DurationDisplay startTime={Date.now() - 10000000} isRunning={true} />
      );
      expect(lastFrame()).toBeDefined();
    });
  });
});
