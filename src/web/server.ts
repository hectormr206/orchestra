/**
 * Orchestra Web API Server
 * Servidor REST API para la interfaz web de Orchestra
 */

import http from 'http';
import { URL } from 'url';
import { SessionHistory } from '../utils/sessionHistory.js';
import { AnalyticsEngine } from '../utils/analytics.js';
import { compareSessions } from '../utils/sessionCompare.js';
import { exportToCSV, exportToHTML, exportToJSON, exportToMarkdown, batchExport } from '../utils/sessionExport.js';
import type { SessionData } from '../utils/sessionExport.js';

const PORT = process.env.PORT || 3001;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

/**
 * Parse request body as JSON
 */
async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: http.ServerResponse, data: any, status: number = 200) {
  res.writeHead(status, CORS_HEADERS);
  res.end(JSON.stringify(data));
}

/**
 * Send error response
 */
function sendError(res: http.ServerResponse, message: string, status: number = 500) {
  sendJSON(res, { error: message }, status);
}

/**
 * API Router
 */
class APIRouter {
  private history: SessionHistory;

  constructor() {
    this.history = new SessionHistory();
  }

  async init() {
    await this.history.init();
  }

  async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || 'GET';

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    try {
      // Sessions endpoints
      if (path === '/api/sessions' && method === 'GET') {
        await this.getSessions(req, res, url);
      } else if (path.match(/^\/api\/sessions\/[^\/]+$/) && method === 'GET') {
        await this.getSession(req, res, path);
      } else if (path.match(/^\/api\/sessions\/[^\/]+$/) && method === 'DELETE') {
        await this.deleteSession(req, res, path);
      } else if (path === '/api/sessions/bulk-delete' && method === 'POST') {
        await this.bulkDelete(req, res);
      } else if (path === '/api/sessions/search' && method === 'POST') {
        await this.searchSessions(req, res);
      }
      // Analytics endpoints
      else if (path === '/api/analytics/trends' && method === 'GET') {
        await this.getAnalyticsTrends(req, res, url);
      } else if (path === '/api/analytics/agents' && method === 'GET') {
        await this.getAgentPerformance(req, res, url);
      } else if (path === '/api/analytics/errors' && method === 'GET') {
        await this.getTopErrors(req, res, url);
      }
      // Comparison endpoints
      else if (path === '/api/compare' && method === 'POST') {
        await this.compareSessions(req, res);
      }
      // Export endpoints
      else if (path === '/api/export' && method === 'POST') {
        await this.exportSessions(req, res);
      } else if (path === '/api/export/batch' && method === 'POST') {
        await this.batchExportSessions(req, res);
      }
      // Stats endpoint
      else if (path === '/api/stats' && method === 'GET') {
        await this.getStats(req, res);
      }
      // Health check
      else if (path === '/api/health' && method === 'GET') {
        sendJSON(res, { status: 'ok', timestamp: new Date().toISOString() });
      }
      // 404
      else {
        sendError(res, 'Not found', 404);
      }
    } catch (error) {
      console.error('API Error:', error);
      sendError(res, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * GET /api/sessions
   */
  private async getSessions(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const sessions = this.history.list({ limit, status, search });
    sendJSON(res, { sessions, total: sessions.length });
  }

  /**
   * GET /api/sessions/:id
   */
  private async getSession(req: http.IncomingMessage, res: http.ServerResponse, path: string) {
    const id = path.split('/').pop()!;
    const session = await this.history.getFullSession(id);

    if (!session) {
      sendError(res, 'Session not found', 404);
      return;
    }

    sendJSON(res, { session });
  }

  /**
   * DELETE /api/sessions/:id
   */
  private async deleteSession(req: http.IncomingMessage, res: http.ServerResponse, path: string) {
    const id = path.split('/').pop()!;
    const deleted = await this.history.deleteSession(id);

    if (!deleted) {
      sendError(res, 'Session not found', 404);
      return;
    }

    sendJSON(res, { success: true, deleted: id });
  }

  /**
   * POST /api/sessions/bulk-delete
   */
  private async bulkDelete(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = await parseBody(req);
    const { sessionIds } = body;

    if (!Array.isArray(sessionIds)) {
      sendError(res, 'sessionIds must be an array', 400);
      return;
    }

    const result = await this.history.bulkDelete(sessionIds);
    sendJSON(res, result);
  }

  /**
   * POST /api/sessions/search
   */
  private async searchSessions(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = await parseBody(req);
    const { query, dateFrom, dateTo, status, searchFields } = body;

    const options: any = { status };
    if (dateFrom) options.dateFrom = new Date(dateFrom);
    if (dateTo) options.dateTo = new Date(dateTo);
    if (searchFields) options.searchFields = searchFields;

    const results = await this.history.fullTextSearch(query || '', options);
    sendJSON(res, { results, total: results.length });
  }

  /**
   * GET /api/analytics/trends
   */
  private async getAnalyticsTrends(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const timeRange = url.searchParams.get('range') || '30d';
    const groupBy = (url.searchParams.get('groupBy') || 'week') as 'day' | 'week' | 'month';

    let sessions = this.history.list({ limit: 1000 });

    // Filter by time range
    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      sessions = sessions.filter(s => new Date(s.startTime) >= cutoff);
    }

    // Load full sessions
    const fullSessions = await Promise.all(
      sessions.map(s => this.history.getFullSession(s.id))
    );
    const validSessions = fullSessions.filter((s): s is SessionData => s !== null);

    const engine = new AnalyticsEngine(validSessions);
    const trends = engine.calculateTrends(groupBy);

    sendJSON(res, { trends });
  }

  /**
   * GET /api/analytics/agents
   */
  private async getAgentPerformance(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const timeRange = url.searchParams.get('range') || '30d';

    let sessions = this.history.list({ limit: 1000 });

    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      sessions = sessions.filter(s => new Date(s.startTime) >= cutoff);
    }

    const fullSessions = await Promise.all(
      sessions.map(s => this.history.getFullSession(s.id))
    );
    const validSessions = fullSessions.filter((s): s is SessionData => s !== null);

    const engine = new AnalyticsEngine(validSessions);
    const agentStats = engine.getAgentPerformance();

    sendJSON(res, { agentStats });
  }

  /**
   * GET /api/analytics/errors
   */
  private async getTopErrors(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const timeRange = url.searchParams.get('range') || '30d';

    let sessions = this.history.list({ limit: 1000 });

    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      sessions = sessions.filter(s => new Date(s.startTime) >= cutoff);
    }

    const fullSessions = await Promise.all(
      sessions.map(s => this.history.getFullSession(s.id))
    );
    const validSessions = fullSessions.filter((s): s is SessionData => s !== null);

    const engine = new AnalyticsEngine(validSessions);
    const errors = engine.getTopErrors(limit);

    sendJSON(res, { errors });
  }

  /**
   * POST /api/compare
   */
  private async compareSessions(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = await parseBody(req);
    const { sessionAId, sessionBId } = body;

    if (!sessionAId || !sessionBId) {
      sendError(res, 'sessionAId and sessionBId are required', 400);
      return;
    }

    const result = await compareSessions(sessionAId, sessionBId);
    sendJSON(res, { comparison: result });
  }

  /**
   * POST /api/export
   */
  private async exportSessions(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = await parseBody(req);
    const { sessionId, format } = body;

    if (!sessionId || !format) {
      sendError(res, 'sessionId and format are required', 400);
      return;
    }

    const session = await this.history.getFullSession(sessionId);
    if (!session) {
      sendError(res, 'Session not found', 404);
      return;
    }

    let content: string;
    let contentType: string;

    switch (format) {
      case 'csv':
        content = exportToCSV([session]);
        contentType = 'text/csv';
        break;
      case 'html':
        content = exportToHTML(session);
        contentType = 'text/html';
        break;
      case 'json':
        content = exportToJSON(session);
        contentType = 'application/json';
        break;
      case 'markdown':
        content = exportToMarkdown(session);
        contentType = 'text/markdown';
        break;
      default:
        sendError(res, 'Invalid format', 400);
        return;
    }

    res.writeHead(200, {
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="session-${sessionId}.${format}"`
    });
    res.end(content);
  }

  /**
   * POST /api/export/batch
   */
  private async batchExportSessions(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = await parseBody(req);
    const { sessionIds, format } = body;

    if (!Array.isArray(sessionIds) || !format) {
      sendError(res, 'sessionIds (array) and format are required', 400);
      return;
    }

    const result = await batchExport(sessionIds, format, '.orchestra/web-exports');
    sendJSON(res, result);
  }

  /**
   * GET /api/stats
   */
  private async getStats(req: http.IncomingMessage, res: http.ServerResponse) {
    const stats = this.history.getStats();
    sendJSON(res, { stats });
  }
}

/**
 * Start server
 */
async function startServer() {
  const router = new APIRouter();
  await router.init();

  const server = http.createServer((req, res) => {
    router.handleRequest(req, res);
  });

  server.listen(PORT, () => {
    console.log(`🚀 Orchestra Web API Server running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation:`);
    console.log(`   GET  /api/health                - Health check`);
    console.log(`   GET  /api/sessions              - List sessions`);
    console.log(`   GET  /api/sessions/:id          - Get session`);
    console.log(`   DEL  /api/sessions/:id          - Delete session`);
    console.log(`   POST /api/sessions/bulk-delete  - Bulk delete`);
    console.log(`   POST /api/sessions/search       - Full-text search`);
    console.log(`   GET  /api/analytics/trends      - Get trends`);
    console.log(`   GET  /api/analytics/agents      - Agent performance`);
    console.log(`   GET  /api/analytics/errors      - Top errors`);
    console.log(`   POST /api/compare               - Compare sessions`);
    console.log(`   POST /api/export                - Export session`);
    console.log(`   POST /api/export/batch          - Batch export`);
    console.log(`   GET  /api/stats                 - Get statistics`);
  });

  return server;
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(console.error);
}

export { startServer, APIRouter };
