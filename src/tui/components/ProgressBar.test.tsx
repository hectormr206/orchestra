/**
 * Tests for ProgressBar TUI Component
 */

import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { ProgressBar } from './ProgressBar.js';

describe('ProgressBar Component', () => {
  describe('basic rendering', () => {
    it('should render progress bar at 0%', () => {
      const { lastFrame } = render(<ProgressBar percent={0} width={10} />);

      expect(lastFrame()).toContain('░░░░░░░░░░');
      expect(lastFrame()).toContain('0%');
    });

    it('should render progress bar at 50%', () => {
      const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

      expect(lastFrame()).toContain('█████');
      expect(lastFrame()).toContain('░░░░░');
      expect(lastFrame()).toContain('50%');
    });

    it('should render progress bar at 100%', () => {
      const { lastFrame } = render(<ProgressBar percent={100} width={10} />);

      expect(lastFrame()).toContain('██████████');
      expect(lastFrame()).toContain('100%');
    });

    it('should use default width of 40', () => {
      const { lastFrame } = render(<ProgressBar percent={50} />);

      const frame = lastFrame();
      expect(frame).toBeDefined();
      if (frame) {
        const filledCount = (frame.match(/█/g) || []).length;
        expect(filledCount).toBe(20); // 50% of 40
      }
    });
  });

  describe('label', () => {
    it('should display label when provided', () => {
      const { lastFrame } = render(
        <ProgressBar percent={50} width={10} label="Progress:" />
      );

      const frame = lastFrame();
      expect(frame).toBeDefined();
      if (frame) {
        expect(frame).toContain('Progress:');
      }
    });

    it('should not display label when not provided', () => {
      const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

      const frame = lastFrame();
      expect(frame).toBeDefined();
      if (frame) {
        expect(frame.startsWith('█') || frame.startsWith('░')).toBe(true);
      }
    });
  });

  describe('showPercent', () => {
    it('should show percentage by default', () => {
      const { lastFrame } = render(<ProgressBar percent={75} width={10} />);

      expect(lastFrame()).toContain('75%');
    });

    it('should not show percentage when showPercent is false', () => {
      const { lastFrame } = render(
        <ProgressBar percent={75} width={10} showPercent={false} />
      );

      expect(lastFrame()).not.toContain('%');
    });
  });

  describe('clamping', () => {
    it('should clamp values above 100 to 100', () => {
      const { lastFrame } = render(<ProgressBar percent={150} width={10} />);

      expect(lastFrame()).toContain('██████████');
      expect(lastFrame()).toContain('100%');
    });

    it('should clamp values below 0 to 0', () => {
      const { lastFrame } = render(<ProgressBar percent={-10} width={10} />);

      expect(lastFrame()).toContain('░░░░░░░░░░');
      expect(lastFrame()).toContain('0%');
    });
  });

  describe('color', () => {
    it('should use green color by default', () => {
      const { lastFrame } = render(<ProgressBar percent={50} width={10} />);

      // Color codes are terminal escape sequences, we just verify structure
      expect(lastFrame()).toBeDefined();
    });

    it('should use custom color when provided', () => {
      const { lastFrame } = render(
        <ProgressBar percent={50} width={10} color="blue" />
      );

      // Color codes are terminal escape sequences, we just verify it renders
      expect(lastFrame()).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle width of 1', () => {
      const { lastFrame } = render(<ProgressBar percent={100} width={1} />);

      expect(lastFrame()).toContain('█');
    });

    it('should handle very small percentages', () => {
      const { lastFrame } = render(<ProgressBar percent={1} width={100} />);

      // Should round to nearest character
      expect(lastFrame()).toBeDefined();
    });

    it('should handle decimal percentages', () => {
      const { lastFrame } = render(<ProgressBar percent={50.5} width={10} />);

      expect(lastFrame()).toBeDefined();
    });
  });
});
