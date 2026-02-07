/**
 * Tests for Header TUI Component
 */

import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Header } from './Header.js';

describe('Header Component', () => {
  describe('compact header (always)', () => {
    it('should render with default props', () => {
      const { lastFrame } = render(<Header />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('orchestra');
    });

    it('should display current working directory', () => {
      const { lastFrame } = render(<Header />);

      const frame = lastFrame();
      expect(frame).toBeDefined();
      if (frame) {
        // Should contain a path-like string (cwd)
        expect(frame).toContain(process.cwd());
      }
    });

    it('should be a single line (compact)', () => {
      const { lastFrame } = render(<Header />);

      const frame = lastFrame();
      expect(frame).toBeDefined();
      if (frame) {
        const lines = frame.split('\n').filter(l => l.trim().length > 0);
        expect(lines.length).toBe(1);
      }
    });
  });

  describe('structure and layout', () => {
    it('should render without crashing', () => {
      expect(() => render(<Header />)).not.toThrow();
    });

    it('should handle re-renders', () => {
      const { rerender } = render(<Header />);

      expect(() => rerender(<Header />)).not.toThrow();
    });
  });

  describe('content verification', () => {
    it('should display orchestra in lowercase', () => {
      const { lastFrame } = render(<Header />);

      expect(lastFrame()).toContain('orchestra');
    });
  });
});
