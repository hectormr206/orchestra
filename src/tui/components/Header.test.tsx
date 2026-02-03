/**
 * Tests for Header TUI Component
 */

import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { Header } from './Header.js';

describe('Header Component', () => {
  describe('full header mode', () => {
    it('should render with default props', () => {
      const { lastFrame } = render(<Header />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('Meta-Orchestrator');
    });

    it('should display ASCII art logo', () => {
      const { lastFrame } = render(<Header compact={false} />);

      const frame = lastFrame();
      expect(frame).toContain('___');
      expect(frame).toContain('____');
      expect(frame).toContain('_____');
    });

    it('should display tagline', () => {
      const { lastFrame } = render(<Header compact={false} />);

      expect(lastFrame()).toContain('Meta-Orchestrator for AI Development Tools');
    });

    it('should contain colored elements', () => {
      const { lastFrame } = render(<Header />);

      const frame = lastFrame();
      expect(frame).toBeDefined();
      // The frame should contain multiple lines with ASCII art
      expect(frame.split('\n').length).toBeGreaterThan(5);
    });
  });

  describe('compact header mode', () => {
    it('should render compact version', () => {
      const { lastFrame } = render(<Header compact={true} />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('ORCHESTRA');
      expect(lastFrame()).toContain('v0.1.0');
    });

    it('should be shorter than full header', () => {
      const fullHeader = render(<Header compact={false} />);
      const compactHeader = render(<Header compact={true} />);

      const fullLines = fullHeader.lastFrame().split('\n').length;
      const compactLines = compactHeader.lastFrame().split('\n').length;

      expect(compactLines).toBeLessThan(fullLines);
    });

    it('should contain version number', () => {
      const { lastFrame } = render(<Header compact={true} />);

      expect(lastFrame()).toContain('v0.1.0');
    });

    it('should contain Meta-Orchestrator text', () => {
      const { lastFrame } = render(<Header compact={true} />);

      expect(lastFrame()).toContain('Meta-Orchestrator');
    });
  });

  describe('structure and layout', () => {
    it('should render without crashing', () => {
      expect(() => render(<Header />)).not.toThrow();
    });

    it('should render in compact mode without crashing', () => {
      expect(() => render(<Header compact={true} />)).not.toThrow();
    });

    it('should handle re-renders', () => {
      const { rerender } = render(<Header compact={false} />);

      expect(() => rerender(<Header compact={true} />)).not.toThrow();
      expect(() => rerender(<Header compact={false} />)).not.toThrow();
    });
  });

  describe('content verification', () => {
    it('should display correct version', () => {
      const { lastFrame } = render(<Header compact={true} />);

      expect(lastFrame()).toContain('v0.1.0');
    });

    it('should display ORCHESTRA in uppercase in compact mode', () => {
      const { lastFrame } = render(<Header compact={true} />);

      expect(lastFrame()).toContain('ORCHESTRA');
    });

    it('should have separator line in full mode', () => {
      const { lastFrame } = render(<Header compact={false} />);

      expect(lastFrame()).toContain('-');
    });
  });
});
