/**
 * Export functionality - Export sessions to PDF and HTML formats
 *
 * Provides:
 * - HTML export with styling
 * - PDF export (via browser print or CLI tools)
 * - Markdown export
 * - JSON export for data interchange
 */

import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

export interface SessionData {
  sessionId: string;
  task: string;
  status: 'completed' | 'failed' | 'in_progress';
  startTime: string;
  endTime?: string;
  duration?: number;
  filesCreated: string[];
  filesModified: string[];
  errors: string[];
  plan?: string;
  logs: LogEntry[];
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  phase?: string;
}

export interface ExportOptions {
  includeLogs?: boolean;
  includeMetadata?: boolean;
  includePlan?: boolean;
  theme?: 'light' | 'dark';
  language?: string;
}

export type ExportFormat = 'html' | 'pdf' | 'markdown' | 'json';

/**
 * Export Manager
 */
export class ExportManager {
  /**
   * Export session to HTML
   */
  exportToHTML(data: SessionData, options: ExportOptions = {}): string {
    const {
      includeLogs = true,
      includeMetadata = true,
      includePlan = true,
      theme = 'light',
    } = options;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orchestra Session - ${data.sessionId}</title>
    <style>
        ${this.getHTMLStyles(theme)}
    </style>
</head>
<body class="${theme}">
    <div class="container">
        <!-- Header -->
        <header>
            <h1>Orchestra Session Report</h1>
            <div class="meta">
                <span class="sessionId">Session: ${data.sessionId}</span>
                <span class="date">${new Date(data.startTime).toLocaleString()}</span>
            </div>
        </header>

        <!-- Summary -->
        <section class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">Task</span>
                    <span class="value">${this.escapeHtml(data.task)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Status</span>
                    <span class="value status status-${data.status}">${data.status}</span>
                </div>
                ${data.duration ? `
                <div class="summary-item">
                    <span class="label">Duration</span>
                    <span class="value">${(data.duration / 1000).toFixed(2)}s</span>
                </div>
                ` : ''}
                ${data.endTime ? `
                <div class="summary-item">
                    <span class="label">Completed</span>
                    <span class="value">${new Date(data.endTime).toLocaleString()}</span>
                </div>
                ` : ''}
            </div>
        </section>

        ${includePlan && data.plan ? `
        <!-- Plan -->
        <section class="plan">
            <h2>Execution Plan</h2>
            <pre class="plan-content">${this.escapeHtml(data.plan)}</pre>
        </section>
        ` : ''}

        <!-- Files -->
        <section class="files">
            <h2>Files</h2>
            <div class="files-grid">
                <div class="file-section">
                    <h3>Created (${data.filesCreated.length})</h3>
                    ${data.filesCreated.length > 0 ? `
                    <ul class="file-list">
                        ${data.filesCreated.map(f => `<li class="file-created">${this.escapeHtml(f)}</li>`).join('')}
                    </ul>
                    ` : '<p class="empty">No files created</p>'}
                </div>
                <div class="file-section">
                    <h3>Modified (${data.filesModified.length})</h3>
                    ${data.filesModified.length > 0 ? `
                    <ul class="file-list">
                        ${data.filesModified.map(f => `<li class="file-modified">${this.escapeHtml(f)}</li>`).join('')}
                    </ul>
                    ` : '<p class="empty">No files modified</p>'}
                </div>
            </div>
        </section>

        ${data.errors.length > 0 ? `
        <!-- Errors -->
        <section class="errors">
            <h2>Errors (${data.errors.length})</h2>
            <ul class="error-list">
                ${data.errors.map(e => `<li class="error-item">${this.escapeHtml(e)}</li>`).join('')}
            </ul>
        </section>
        ` : ''}

        ${includeLogs && data.logs.length > 0 ? `
        <!-- Logs -->
        <section class="logs">
            <h2>Logs (${data.logs.length})</h2>
            <div class="log-container">
                ${data.logs.map(log => `
                <div class="log-entry log-${log.level}">
                    <span class="log-time">${log.timestamp}</span>
                    <span class="log-level">${log.level.toUpperCase()}</span>
                    ${log.phase ? `<span class="log-phase">${this.escapeHtml(log.phase)}</span>` : ''}
                    <span class="log-message">${this.escapeHtml(log.message)}</span>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        ${includeMetadata && data.metadata ? `
        <!-- Metadata -->
        <section class="metadata">
            <h2>Metadata</h2>
            <table class="metadata-table">
                ${Object.entries(data.metadata).map(([key, value]) => `
                <tr>
                    <td class="metadata-key">${this.escapeHtml(key)}</td>
                    <td class="metadata-value">${this.escapeHtml(String(value))}</td>
                </tr>
                `).join('')}
            </table>
        </section>
        ` : ''}

        <!-- Footer -->
        <footer>
            <p>Generated by Orchestra CLI</p>
            <p class="timestamp">${new Date().toISOString()}</p>
        </footer>
    </div>

    <!-- Print button (only visible in browser) -->
    <script>
        if (typeof window !== 'undefined') {
            console.log('To save as PDF: Press Ctrl+P / Cmd+P and select "Save as PDF"');
        }
    </script>
</body>
</html>
`;

    return html;
  }

  /**
   * Export session to Markdown
   */
  exportToMarkdown(data: SessionData, options: ExportOptions = {}): string {
    const {
      includeLogs = true,
      includeMetadata = true,
      includePlan = true,
    } = options;

    const lines: string[] = [];

    lines.push('# Orchestra Session Report');
    lines.push('');
    lines.push(`**Session ID:** ${data.sessionId}`);
    lines.push(`**Task:** ${data.task}`);
    lines.push(`**Status:** ${data.status}`);
    lines.push(`**Started:** ${new Date(data.startTime).toLocaleString()}`);

    if (data.endTime) {
      lines.push(`**Completed:** ${new Date(data.endTime).toLocaleString()}`);
    }

    if (data.duration) {
      lines.push(`**Duration:** ${(data.duration / 1000).toFixed(2)}s`);
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    if (includePlan && data.plan) {
      lines.push('## Execution Plan');
      lines.push('');
      lines.push('```');
      lines.push(data.plan);
      lines.push('```');
      lines.push('');
    }

    lines.push('## Files');
    lines.push('');

    lines.push(`### Created (${data.filesCreated.length})`);
    if (data.filesCreated.length > 0) {
      data.filesCreated.forEach(f => lines.push(`- \`${f}\``));
    } else {
      lines.push('*No files created*');
    }

    lines.push('');
    lines.push(`### Modified (${data.filesModified.length})`);
    if (data.filesModified.length > 0) {
      data.filesModified.forEach(f => lines.push(`- \`${f}\``));
    } else {
      lines.push('*No files modified*');
    }

    lines.push('');

    if (data.errors.length > 0) {
      lines.push('## Errors');
      lines.push('');
      data.errors.forEach(e => {
        lines.push(`- ${e}`);
      });
      lines.push('');
    }

    if (includeLogs && data.logs.length > 0) {
      lines.push('## Logs');
      lines.push('');
      data.logs.forEach(log => {
        const level = log.level.toUpperCase().padEnd(5);
        const phase = log.phase ? `[${log.phase}] ` : '';
        lines.push(`**${level}** ${phase}${log.message}`);
      });
      lines.push('');
    }

    if (includeMetadata && data.metadata) {
      lines.push('## Metadata');
      lines.push('');
      Object.entries(data.metadata).forEach(([key, value]) => {
        lines.push(`- **${key}:** ${value}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push(`*Generated by Orchestra CLI on ${new Date().toISOString()}*`);

    return lines.join('\n');
  }

  /**
   * Export session to JSON
   */
  exportToJSON(data: SessionData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export session to PDF (via HTML)
   */
  async exportToPDF(
    data: SessionData,
    options: ExportOptions = {}
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    // First generate HTML
    const html = this.exportToHTML(data, options);

    // Save HTML file
    const outputDir = path.join(process.cwd(), '.orchestra', 'exports');
    if (!require('fs').existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, `${data.sessionId}.html`);
    writeFileSync(htmlPath, html, 'utf-8');

    // Note: Actual PDF conversion requires a browser or CLI tool
    // Users can open the HTML in a browser and print to PDF
    // Or use tools like wkhtmltopdf, puppeteer, etc.

    return {
      success: true,
      path: htmlPath,
    };
  }

  /**
   * Export session to file
   */
  async exportToFile(
    data: SessionData,
    format: ExportFormat,
    outputPath?: string,
    options: ExportOptions = {}
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    let content: string;
    let extension: string;

    switch (format) {
      case 'html':
        content = this.exportToHTML(data, options);
        extension = 'html';
        break;
      case 'markdown':
        content = this.exportToMarkdown(data, options);
        extension = 'md';
        break;
      case 'json':
        content = this.exportToJSON(data);
        extension = 'json';
        break;
      case 'pdf':
        return await this.exportToPDF(data, options);
      default:
        return {
          success: false,
          error: `Unsupported format: ${format}`,
        };
    }

    // Determine output path
    const finalPath = outputPath || path.join(
      process.cwd(),
      '.orchestra',
      'exports',
      `${data.sessionId}.${extension}`
    );

    // Create directory if it doesn't exist
    const dir = path.dirname(finalPath);
    if (!require('fs').existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write file
    try {
      writeFileSync(finalPath, content, 'utf-8');
      return {
        success: true,
        path: finalPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get HTML styles
   */
  private getHTMLStyles(theme: 'light' | 'dark'): string {
    const colors = theme === 'dark' ? {
      bg: '#1e1e1e',
      text: '#d4d4d4',
      primary: '#4ec9b0',
      secondary: '#569cd6',
      border: '#3e3e42',
      card: '#252526',
      code: '#0e0e0e',
    } : {
      bg: '#ffffff',
      text: '#333333',
      primary: '#0066cc',
      secondary: '#6c757d',
      border: '#dee2e6',
      card: '#f8f9fa',
      code: '#f4f4f4',
    };

    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            background: ${colors.bg};
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            border-bottom: 2px solid ${colors.border};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        header h1 {
            font-size: 2em;
            margin-bottom: 10px;
            color: ${colors.primary};
        }

        .meta {
            display: flex;
            gap: 20px;
            color: ${colors.secondary};
            font-size: 0.9em;
        }

        section {
            margin-bottom: 30px;
            padding: 20px;
            background: ${colors.card};
            border-radius: 8px;
            border: 1px solid ${colors.border};
        }

        h2 {
            font-size: 1.5em;
            margin-bottom: 15px;
            color: ${colors.primary};
        }

        h3 {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: ${colors.secondary};
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .summary-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .label {
            font-weight: 600;
            color: ${colors.secondary};
        }

        .value {
            font-size: 1.1em;
        }

        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
        }

        .status-completed {
            background: #d4edda;
            color: #155724;
        }

        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }

        .status-in_progress {
            background: #fff3cd;
            color: #856404;
        }

        .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .file-list {
            list-style: none;
        }

        .file-list li {
            padding: 8px 12px;
            margin-bottom: 5px;
            background: ${colors.code};
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }

        .file-created {
            border-left: 3px solid #28a745;
        }

        .file-modified {
            border-left: 3px solid ${colors.primary};
        }

        .empty {
            color: ${colors.secondary};
            font-style: italic;
        }

        .plan-content {
            background: ${colors.code};
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }

        .error-list {
            list-style: none;
        }

        .error-item {
            padding: 10px;
            margin-bottom: 8px;
            background: #f8d7da;
            color: #721c24;
            border-left: 3px solid #dc3545;
            border-radius: 4px;
        }

        .log-container {
            max-height: 400px;
            overflow-y: auto;
            background: ${colors.code};
            padding: 15px;
            border-radius: 4px;
        }

        .log-entry {
            display: flex;
            gap: 10px;
            padding: 5px 0;
            border-bottom: 1px solid ${colors.border};
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85em;
        }

        .log-time {
            color: ${colors.secondary};
            min-width: 150px;
        }

        .log-level {
            min-width: 60px;
            font-weight: 600;
        }

        .log-info { color: #17a2b8; }
        .log-warn { color: #ffc107; }
        .log-error { color: #dc3545; }
        .log-debug { color: ${colors.secondary}; }

        .log-phase {
            color: ${colors.primary};
            min-width: 100px;
        }

        .log-message {
            flex: 1;
            word-break: break-word;
        }

        .metadata-table {
            width: 100%;
            border-collapse: collapse;
        }

        .metadata-table td {
            padding: 10px;
            border-bottom: 1px solid ${colors.border};
        }

        .metadata-key {
            font-weight: 600;
            width: 30%;
            color: ${colors.secondary};
        }

        footer {
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid ${colors.border};
            color: ${colors.secondary};
        }

        @media print {
            body {
                background: white;
                color: black;
            }
            section {
                break-inside: avoid;
            }
        }
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * Export session to file (convenience function)
 */
export async function exportSession(
  data: SessionData,
  format: ExportFormat = 'html',
  outputPath?: string,
  options?: ExportOptions
): Promise<{ success: boolean; path?: string; error?: string }> {
  const manager = new ExportManager();
  return await manager.exportToFile(data, format, outputPath, options);
}
