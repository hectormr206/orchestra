/**
 * Tests for Session Export - CSV, HTML, Markdown, JSON, and batch export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportToCSV,
  exportToHTML,
  exportToMarkdown,
  exportToJSON,
  batchExport
} from './sessionExport.js';
import type { SessionData } from './sessionExport.js';
import { existsSync } from 'fs';
import { rm, readFile } from 'fs/promises';

describe('Session Export', () => {
  let mockSession: SessionData;

  beforeEach(() => {
    mockSession = {
      id: 'sess_test_123',
      task: 'Implement authentication feature',
      startTime: '2026-01-01T10:00:00Z',
      endTime: '2026-01-01T10:30:00Z',
      status: 'completed',
      plan: '# Plan\n\n1. Create login endpoint\n2. Add JWT validation\n3. Test authentication flow',
      files: [
        {
          path: 'src/auth.ts',
          description: 'Authentication module',
          status: 'created',
          content: 'export function authenticate() { return true; }'
        },
        {
          path: 'src/login.ts',
          description: 'Login handler',
          status: 'created'
        }
      ],
      iterations: [
        {
          number: 1,
          agent: 'architect',
          adapter: 'kimi',
          startTime: '2026-01-01T10:00:00Z',
          endTime: '2026-01-01T10:05:00Z',
          success: true
        },
        {
          number: 2,
          agent: 'executor',
          adapter: 'glm',
          startTime: '2026-01-01T10:05:00Z',
          endTime: '2026-01-01T10:30:00Z',
          success: true
        }
      ],
      metrics: {
        totalDuration: 1800000,
        architectDuration: 300000,
        executorDuration: 1500000,
        auditorDuration: 0,
        filesCreated: 2,
        filesFailed: 0,
        iterations: 2,
        fallbacks: 0
      }
    };
  });

  describe('exportToCSV', () => {
    it('should export session to CSV format', () => {
      const csv = exportToCSV([mockSession]);

      expect(csv).toContain('id,task,status');
      expect(csv).toContain('sess_test_123');
      expect(csv).toContain('completed');
    });

    it('should escape commas in fields', () => {
      const sessionWithComma = {
        ...mockSession,
        task: 'Task with, comma'
      };

      const csv = exportToCSV([sessionWithComma]);

      expect(csv).toContain('"Task with, comma"');
    });

    it('should escape quotes in fields', () => {
      const sessionWithQuotes = {
        ...mockSession,
        task: 'Task with "quotes"'
      };

      const csv = exportToCSV([sessionWithQuotes]);

      expect(csv).toContain('""quotes""');
    });

    it('should escape newlines in fields', () => {
      const sessionWithNewline = {
        ...mockSession,
        task: 'Task with\nnewline'
      };

      const csv = exportToCSV([sessionWithNewline]);

      expect(csv).toContain('"Task with\nnewline"');
    });

    it('should handle empty sessions array', () => {
      const csv = exportToCSV([]);

      expect(csv).toContain('id,task,status');
      expect(csv.split('\n').length).toBe(1); // Solo headers
    });

    it('should include custom fields', () => {
      const csv = exportToCSV([mockSession], ['id', 'status', 'filesCreated']);

      expect(csv).toContain('id,status,filesCreated');
      expect(csv).toContain('2'); // filesCreated count
    });

    it('should calculate duration field correctly', () => {
      const csv = exportToCSV([mockSession], ['id', 'duration']);

      expect(csv).toContain('1800000'); // totalDuration from metrics
    });

    it('should handle sessions without metrics', () => {
      const sessionWithoutMetrics = {
        ...mockSession,
        metrics: undefined
      };

      const csv = exportToCSV([sessionWithoutMetrics], ['id', 'duration']);

      expect(csv).toContain('0'); // Default duration
    });

    it('should export multiple sessions correctly', () => {
      const session2: SessionData = {
        ...mockSession,
        id: 'sess_test_456',
        task: 'Second task'
      };

      const csv = exportToCSV([mockSession, session2]);

      const lines = csv.split('\n');
      expect(lines.length).toBe(3); // Header + 2 data rows
      expect(lines[1]).toContain('sess_test_123');
      expect(lines[2]).toContain('sess_test_456');
    });
  });

  describe('exportToHTML', () => {
    it('should export session to HTML format', () => {
      const html = exportToHTML(mockSession);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Orchestra Session');
      expect(html).toContain(mockSession.id);
      expect(html).toContain(mockSession.task);
    });

    it('should escape HTML special characters', () => {
      const sessionWithHTML = {
        ...mockSession,
        task: '<script>alert("XSS")</script>'
      };

      const html = exportToHTML(sessionWithHTML);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include metrics section', () => {
      const html = exportToHTML(mockSession);

      expect(html).toContain('Total Duration');
      expect(html).toContain('Files Created');
      expect(html).toContain('2'); // filesCreated count
    });

    it('should include iterations table', () => {
      const html = exportToHTML(mockSession);

      expect(html).toContain('architect');
      expect(html).toContain('executor');
      expect(html).toContain('kimi');
      expect(html).toContain('glm');
    });

    it('should handle sessions without plan', () => {
      const sessionWithoutPlan = {
        ...mockSession,
        plan: undefined
      };

      const html = exportToHTML(sessionWithoutPlan);

      expect(html).not.toContain('<h2>📝 Plan</h2>');
    });

    it('should handle sessions without files', () => {
      const sessionWithoutFiles = {
        ...mockSession,
        files: []
      };

      const html = exportToHTML(sessionWithoutFiles);

      expect(html).toContain('📁 Generated Files (0)');
    });

    it('should apply correct status color', () => {
      const html = exportToHTML(mockSession);

      // Completed status should use green color
      expect(html).toContain('#22c55e');
    });
  });

  describe('exportToMarkdown', () => {
    it('should export session to Markdown format', () => {
      const md = exportToMarkdown(mockSession);

      expect(md).toContain('# Orchestra Session Report');
      expect(md).toContain('## Session Info');
      expect(md).toContain(mockSession.id);
      expect(md).toContain(mockSession.task);
    });

    it('should include plan section', () => {
      const md = exportToMarkdown(mockSession);

      expect(md).toContain('## Plan');
      expect(md).toContain('Create login endpoint');
    });

    it('should include files section', () => {
      const md = exportToMarkdown(mockSession);

      expect(md).toContain('## Generated Files');
      expect(md).toContain('src/auth.ts');
      expect(md).toContain('src/login.ts');
    });

    it('should include iterations table', () => {
      const md = exportToMarkdown(mockSession);

      expect(md).toContain('## Execution Log');
      expect(md).toContain('| # | Agent | Adapter | Duration | Status |');
      expect(md).toContain('architect');
      expect(md).toContain('executor');
    });

    it('should format durations correctly', () => {
      const md = exportToMarkdown(mockSession);

      expect(md).toMatch(/\d+m \d+s/); // Duration format
    });
  });

  describe('exportToJSON', () => {
    it('should export session to JSON format', () => {
      const json = exportToJSON(mockSession);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(mockSession.id);
      expect(parsed.task).toBe(mockSession.task);
      expect(parsed.status).toBe(mockSession.status);
    });

    it('should format JSON with indentation by default', () => {
      const json = exportToJSON(mockSession);

      expect(json).toContain('\n');
      expect(json).toContain('  '); // 2-space indentation
    });

    it('should support compact JSON format', () => {
      const json = exportToJSON(mockSession, false);

      expect(json).not.toContain('\n  ');
    });
  });

  describe('batchExport', () => {
    const testOutputDir = '.orchestra-test/exports';

    beforeEach(async () => {
      // Limpiar directorio de prueba si existe
      if (existsSync(testOutputDir)) {
        await rm(testOutputDir, { recursive: true, force: true });
      }
    });

    afterEach(async () => {
      // Limpiar después de las pruebas
      if (existsSync(testOutputDir)) {
        await rm(testOutputDir, { recursive: true, force: true });
      }
    });

    // Nota: Los tests de batchExport requieren mocks más elaborados
    // ya que dependen de SessionHistory.getFullSession()
    // Por ahora, se prueban las funciones individuales

    it('should be defined', () => {
      expect(typeof batchExport).toBe('function');
    });
  });
});
