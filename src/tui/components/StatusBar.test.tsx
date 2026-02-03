/**
 * Tests for StatusBar TUI Component
 */

import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { StatusBar } from './StatusBar.js';

describe('StatusBar Component', () => {
  describe('status rendering', () => {
    it('should render idle status', () => {
      const { lastFrame } = render(<StatusBar status="idle" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('IDLE');
      expect(lastFrame()).toContain('◯');
    });

    it('should render planning status', () => {
      const { lastFrame } = render(<StatusBar status="planning" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('PLANNING');
      expect(lastFrame()).toContain('📝');
    });

    it('should render executing status', () => {
      const { lastFrame } = render(<StatusBar status="executing" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('EXECUTING');
      expect(lastFrame()).toContain('⚡');
    });

    it('should render auditing status', () => {
      const { lastFrame } = render(<StatusBar status="auditing" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('AUDITING');
      expect(lastFrame()).toContain('🔍');
    });

    it('should render recovery status', () => {
      const { lastFrame } = render(<StatusBar status="recovery" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('RECOVERY');
      expect(lastFrame()).toContain('🔄');
    });

    it('should render complete status', () => {
      const { lastFrame } = render(<StatusBar status="complete" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('COMPLETE');
      expect(lastFrame()).toContain('✅');
    });

    it('should render error status', () => {
      const { lastFrame } = render(<StatusBar status="error" />);

      expect(lastFrame()).toBeDefined();
      expect(lastFrame()).toContain('ERROR');
      expect(lastFrame()).toContain('❌');
    });
  });

  describe('optional props', () => {
    it('should display sessionId when provided', () => {
      const sessionId = 'abc123def456';
      const { lastFrame } = render(<StatusBar status="executing" sessionId={sessionId} />);

      expect(lastFrame()).toContain('Session:');
      expect(lastFrame()).toContain(sessionId.substring(0, 8));
    });

    it('should not display sessionId when not provided', () => {
      const { lastFrame } = render(<StatusBar status="executing" />);

      expect(lastFrame()).not.toContain('Session:');
    });

    it('should display currentFile when provided', () => {
      const currentFile = 'src/utils/test.ts';
      const { lastFrame } = render(<StatusBar status="executing" currentFile={currentFile} />);

      expect(lastFrame()).toContain(currentFile);
    });

    it('should not display currentFile when not provided', () => {
      const { lastFrame } = render(<StatusBar status="executing" />);

      // Should not have the │ separator without currentFile
      const lines = lastFrame().split('\n');
      expect(lines[0]).not.toContain('│');
    });

    it('should display progress when provided', () => {
      const progress = { current: 5, total: 10 };
      const { lastFrame } = render(<StatusBar status="executing" progress={progress} />);

      expect(lastFrame()).toContain('[5/10]');
    });

    it('should not display progress when not provided', () => {
      const { lastFrame } = render(<StatusBar status="executing" />);

      expect(lastFrame()).not.toContain('[');
      expect(lastFrame()).not.toContain('/');
    });
  });

  describe('combined props', () => {
    it('should display all optional props together', () => {
      const props = {
        status: 'executing' as const,
        sessionId: 'abc123def456',
        currentFile: 'src/utils/test.ts',
        progress: { current: 5, total: 10 }
      };

      const { lastFrame } = render(<StatusBar {...props} />);

      expect(lastFrame()).toContain('EXECUTING');
      expect(lastFrame()).toContain('⚡');
      expect(lastFrame()).toContain('src/utils/test.ts');
      expect(lastFrame()).toContain('[5/10]');
      expect(lastFrame()).toContain('Session:');
    });

    it('should handle only sessionId and progress', () => {
      const { lastFrame } = render(
        <StatusBar
          status="complete"
          sessionId="xyz789"
          progress={{ current: 10, total: 10 }}
        />
      );

      expect(lastFrame()).toContain('COMPLETE');
      expect(lastFrame()).toContain('[10/10]');
      expect(lastFrame()).toContain('Session:');
    });

    it('should handle only currentFile and progress', () => {
      const { lastFrame } = render(
        <StatusBar
          status="auditing"
          currentFile="src/test.ts"
          progress={{ current: 3, total: 5 }}
        />
      );

      expect(lastFrame()).toContain('AUDITING');
      expect(lastFrame()).toContain('src/test.ts');
      expect(lastFrame()).toContain('[3/5]');
    });
  });

  describe('edge cases', () => {
    it('should handle empty sessionId', () => {
      const { lastFrame } = render(<StatusBar status="idle" sessionId="" />);

      expect(lastFrame()).toBeDefined();
    });

    it('should handle empty currentFile', () => {
      const { lastFrame } = render(<StatusBar status="idle" currentFile="" />);

      expect(lastFrame()).toBeDefined();
    });

    it('should handle zero progress', () => {
      const { lastFrame } = render(
        <StatusBar status="idle" progress={{ current: 0, total: 0 }} />
      );

      expect(lastFrame()).toContain('[0/0]');
    });

    it('should handle large progress values', () => {
      const { lastFrame } = render(
        <StatusBar status="executing" progress={{ current: 999, total: 1000 }} />
      );

      expect(lastFrame()).toContain('[999/1000]');
    });

    it('should handle very long currentFile path', () => {
      const longPath = 'src/very/long/path/to/some/file/that/goes/on/and/on/test.ts';
      const { lastFrame } = render(<StatusBar status="executing" currentFile={longPath} />);

      expect(lastFrame()).toContain(longPath);
    });
  });

  describe('structure and layout', () => {
    it('should render without crashing for all statuses', () => {
      const statuses: Array<'idle' | 'planning' | 'executing' | 'auditing' | 'recovery' | 'complete' | 'error'> =
        ['idle', 'planning', 'executing', 'auditing', 'recovery', 'complete', 'error'];

      statuses.forEach((status) => {
        expect(() => render(<StatusBar status={status} />)).not.toThrow();
      });
    });

    it('should handle status changes', () => {
      const { rerender } = render(<StatusBar status="idle" />);

      expect(() => rerender(<StatusBar status="executing" />)).not.toThrow();
      expect(() => rerender(<StatusBar status="complete" />)).not.toThrow();
      expect(() => rerender(<StatusBar status="error" />)).not.toThrow();
    });
  });
});
