/**
 * OrchestraServer - HTTP/WebSocket server for remote orchestration
 *
 * Provides a server mode for Orchestra CLI that allows remote
 * orchestration via HTTP REST API and WebSocket for real-time updates.
 */

import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { Orchestrator } from '../orchestrator/Orchestrator.js';
import { configLoader } from '../utils/configLoader.js';

export interface ServerOptions {
  port?: number;
  host?: string;
  authToken?: string;
  enableCors?: boolean;
  maxConnections?: number;
}

export interface SessionInfo {
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  task: string;
  startTime: number;
  endTime?: number;
  clients: Set<WebSocket>;
}

export interface OrchestrationRequest {
  task: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationResponse {
  sessionId: string;
  status: string;
  message: string;
}

/**
 * OrchestraServer provides HTTP and WebSocket endpoints for remote orchestration
 */
export class OrchestraServer {
  private server: Server;
  private wss: WebSocketServer;
  private port: number;
  private host: string;
  private authToken?: string;
  private enableCors: boolean;
  private maxConnections: number;

  // Session management
  private sessions: Map<string, SessionInfo>;
  private orchestrators: Map<string, Orchestrator>;

  constructor(options: ServerOptions = {}) {
    this.port = options.port || 8080;
    this.host = options.host || '0.0.0.0';
    this.authToken = options.authToken;
    this.enableCors = options.enableCors !== false;
    this.maxConnections = options.maxConnections || 10;

    this.sessions = new Map();
    this.orchestrators = new Map();

    // Create HTTP server
    this.server = createServer(this.handleRequest.bind(this));

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, () => {
        console.log(`Orchestra Server listening on http://${this.host}:${this.port}`);
        console.log(`WebSocket server listening on ws://${this.host}:${this.port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close all WebSocket connections
      this.wss.clients.forEach((ws) => {
        ws.close();
      });

      // Close all active orchestrators
      this.orchestrators.forEach((orch) => {
        // orchestrator cleanup if needed
      });

      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          console.log('Orchestra Server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Add CORS headers if enabled
    if (this.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Check authentication
    if (this.authToken && !this.isAuthenticated(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    try {
      // Route the request
      if (pathname === '/api/orchestrate' && req.method === 'POST') {
        await this.handleOrchestrate(req, res);
      } else if (pathname.startsWith('/api/sessions/') && req.method === 'GET') {
        await this.handleGetSession(req, res, pathname);
      } else if (pathname === '/api/sessions' && req.method === 'GET') {
        await this.handleListSessions(req, res);
      } else if (pathname.startsWith('/api/sessions/') && req.method === 'DELETE') {
        await this.handleCancelSession(req, res, pathname);
      } else if (pathname === '/api/status' && req.method === 'GET') {
        await this.handleStatus(req, res);
      } else if (pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('Error handling request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  /**
   * Handle orchestration request
   * POST /api/orchestrate
   */
  private async handleOrchestrate(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const request: OrchestrationRequest = JSON.parse(body);
        const sessionId = this.generateSessionId();

        // Create session info
        const sessionInfo: SessionInfo = {
          sessionId,
          status: 'running',
          task: request.task,
          startTime: Date.now(),
          clients: new Set(),
        };

        this.sessions.set(sessionId, sessionInfo);

        // Send response
        const response: OrchestrationResponse = {
          sessionId,
          status: 'started',
          message: 'Orchestration started',
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

        // Start orchestration in background
        this.runOrchestration(sessionId, request.task, request.config, request.metadata);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
  }

  /**
   * Run orchestration in background
   */
  private async runOrchestration(
    sessionId: string,
    task: string,
    config: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) return;

    try {
      // Load config
      const projectConfig = configLoader.load();

      // Create orchestrator
      const orchestrator = new Orchestrator({
        ...projectConfig,
        ...config,
      });

      this.orchestrators.set(sessionId, orchestrator);

      // Run orchestration
      const result = await orchestrator.orchestrate(task, {
        ...metadata,
        sessionId,
      });

      // Update session status
      sessionInfo.status = 'completed';
      sessionInfo.endTime = Date.now();

      // Broadcast completion to WebSocket clients
      this.broadcastToSession(sessionId, {
        type: 'complete',
        sessionId,
        result,
      });
    } catch (error) {
      sessionInfo.status = 'failed';
      sessionInfo.endTime = Date.now();

      // Broadcast error to WebSocket clients
      this.broadcastToSession(sessionId, {
        type: 'error',
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.orchestrators.delete(sessionId);
    }
  }

  /**
   * Handle WebSocket connection
   */
  private handleWebSocketConnection(ws: WebSocket, req: IncomingMessage): void {
    // Check authentication
    if (this.authToken) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${this.authToken}`) {
        ws.close(1008, 'Unauthorized');
        return;
      }
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      // Attach to existing session
      const sessionInfo = this.sessions.get(sessionId);
      if (sessionInfo) {
        sessionInfo.clients.add(ws);

        ws.send(JSON.stringify({
          type: 'attached',
          sessionId,
          status: sessionInfo.status,
        }));

        ws.on('close', () => {
          sessionInfo.clients.delete(ws);
        });
      } else {
        ws.close(1008, 'Session not found');
      }
    } else {
      // General connection (receive all sessions)
      ws.on('close', () => {
        // Cleanup
      });
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleWebSocketMessage(ws, data);
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message' }));
      }
    });
  }

  /**
   * Handle WebSocket message
   */
  private handleWebSocketMessage(ws: WebSocket, data: Record<string, unknown>): void {
    // Handle different message types
    if (data.type === 'subscribe' && data.sessionId) {
      // Subscribe to session updates
      const sessionId = data.sessionId as string;
      const sessionInfo = this.sessions.get(sessionId);
      if (sessionInfo) {
        sessionInfo.clients.add(ws);
      }
    } else if (data.type === 'unsubscribe' && data.sessionId) {
      // Unsubscribe from session updates
      const sessionId = data.sessionId as string;
      const sessionInfo = this.sessions.get(sessionId);
      if (sessionInfo) {
        sessionInfo.clients.delete(ws);
      }
    }
  }

  /**
   * Broadcast message to all clients of a session
   */
  private broadcastToSession(sessionId: string, message: Record<string, unknown>): void {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) return;

    const messageStr = JSON.stringify(message);
    sessionInfo.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Handle GET /api/sessions/:sessionId
   */
  private async handleGetSession(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    const sessionId = pathname.split('/').pop();
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid session ID' }));
      return;
    }

    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sessionInfo));
  }

  /**
   * Handle GET /api/sessions
   */
  private async handleListSessions(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const sessionsArray = Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      status: session.status,
      task: session.task,
      startTime: session.startTime,
      endTime: session.endTime,
      clientCount: session.clients.size,
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sessions: sessionsArray, count: sessionsArray.length }));
  }

  /**
   * Handle DELETE /api/sessions/:sessionId
   */
  private async handleCancelSession(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    const sessionId = pathname.split('/').pop();
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid session ID' }));
      return;
    }

    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    // Cancel orchestrator if running
    const orchestrator = this.orchestrators.get(sessionId);
    if (orchestrator) {
      // orchestrator.cancel(); // Implement cancel in Orchestrator
      this.orchestrators.delete(sessionId);
    }

    // Update session status
    sessionInfo.status = 'cancelled';
    sessionInfo.endTime = Date.now();

    // Broadcast cancellation
    this.broadcastToSession(sessionId, {
      type: 'cancelled',
      sessionId,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Session cancelled', sessionId }));
  }

  /**
   * Handle GET /api/status
   */
  private async handleStatus(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const status = {
      server: 'running',
      version: '0.1.0',
      uptime: process.uptime(),
      connections: this.wss.clients.size,
      activeSessions: this.orchestrators.size,
      totalSessions: this.sessions.size,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  /**
   * Check if request is authenticated
   */
  private isAuthenticated(req: IncomingMessage): boolean {
    if (!this.authToken) return true;

    const authHeader = req.headers.authorization;
    return authHeader === `Bearer ${this.authToken}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
