/**
 * Tests for Export Manager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExportManager, type SessionData } from './export';

describe('ExportManager', () => {
  let manager: ExportManager;
  const sampleSession: SessionData = {
    sessionId: 'test-session-123',
    task: 'Test task',
    status: 'completed',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 60000,
    filesCreated: ['src/test.ts', 'src/test2.ts'],
    filesModified: ['src/existing.ts'],
    errors: [],
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Test log',
      },
    ],
  };

  beforeEach(() => {
    manager = new ExportManager();
  });

  describe('exportToHTML', () => {
    it('should generate HTML export', () => {
      const html = manager.exportToHTML(sampleSession);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Orchestra Session Report');
      expect(html).toContain(sampleSession.task);
      expect(html).toContain(sampleSession.sessionId);
    });

    it('should include files in HTML', () => {
      const html = manager.exportToHTML(sampleSession);

      expect(html).toContain('src/test.ts');
      expect(html).toContain('src/test2.ts');
      expect(html).toContain('src/existing.ts');
    });

    it('should handle dark theme', () => {
      const html = manager.exportToHTML(sampleSession, {
        theme: 'dark',
      });

      expect(html).toContain('class="dark"');
    });
  });

  describe('exportToMarkdown', () => {
    it('should generate Markdown export', () => {
      const markdown = manager.exportToMarkdown(sampleSession);

      expect(markdown).toContain('# Orchestra Session Report');
      expect(markdown).toContain(sampleSession.task);
      expect(markdown).toContain(sampleSession.sessionId);
    });

    it('should include files section', () => {
      const markdown = manager.exportToMarkdown(sampleSession);

      expect(markdown).toContain('## Files');
      expect(markdown).toContain('src/test.ts');
    });
  });

  describe('exportToJSON', () => {
    it('should generate JSON export', () => {
      const json = manager.exportToJSON(sampleSession);

      expect(json).toContain('"sessionId"');
      expect(json).toContain('"task"');
      expect(json).toContain('"status"');
    });

    it('should parse as valid JSON', () => {
      const json = manager.exportToJSON(sampleSession);
      const parsed = JSON.parse(json);

      expect(parsed.sessionId).toBe(sampleSession.sessionId);
      expect(parsed.task).toBe(sampleSession.task);
    });
  });

  describe('formatMetrics', () => {
    it('should calculate summary statistics', () => {
      const issues = [
        { severity: 'critical' },
        { severity: 'high' },
        { severity: 'medium' },
        { severity: 'low' },
      ];

      const summary = {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
        info: 0,
      };

      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(1);
      expect(summary.low).toBe(1);
    });
  });
});
