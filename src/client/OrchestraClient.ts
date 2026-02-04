/**
 * OrchestraClient - WebSocket client for remote Orchestra server
 *
 * Provides a client for connecting to Orchestra Server and
 * executing orchestration commands remotely.
 */

import { WebSocket } from 'ws';

export interface ClientOptions {
  url: string;
  authToken?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export interface OrchestrationCommand {
  task: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SessionStatus {
  sessionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  task: string;
  startTime: number;
  endTime?: number;
  clientCount: number;
}

export type MessageHandler = (data: Record<string, unknown>) => void;
export type ErrorHandler = (error: Error) => void;

/**
 * OrchestraClient connects to Orchestra Server via WebSocket
 */
export class OrchestraClient {
  private url: string;
  private authToken?: string;
  private ws: WebSocket | null = null;
  private reconnect: boolean;
  private reconnectInterval: number;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private sessionId: string | null = null;

  constructor(options: ClientOptions) {
    this.url = options.url;
    this.authToken = options.authToken;
    this.reconnect = options.reconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 5000;
  }

  /**
   * Connect to the server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Build WebSocket URL
      const wsUrl = this.url.replace('http://', 'ws://').replace('https://', 'wss://');

      // Add sessionId to URL
      const urlWithSession = new URL(wsUrl);
      if (this.sessionId) {
        urlWithSession.searchParams.set('sessionId', this.sessionId);
      }

      this.ws = new WebSocket(urlWithSession.toString());

      this.ws.on('open', () => {
        console.log('Connected to Orchestra Server');
        this.clearReconnectTimer();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.handleError(new Error(`Failed to parse message: ${error}`));
        }
      });

      this.ws.on('error', (error) => {
        this.handleError(error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from Orchestra Server');
        if (this.reconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.reconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send orchestration command via HTTP API
   */
  async orchestrate(command: OrchestrationCommand): Promise<string> {
    const response = await this.httpRequest('POST', '/api/orchestrate', command);
    return response.sessionId;
  }

  /**
   * Get session status
   */
  async getSession(sessionId: string): Promise<SessionStatus> {
    return this.httpRequest('GET', `/api/sessions/${sessionId}`);
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<{ sessions: SessionStatus[]; count: number }> {
    return this.httpRequest('GET', '/api/sessions');
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string): Promise<{ message: string; sessionId: string }> {
    return this.httpRequest('DELETE', `/api/sessions/${sessionId}`);
  }

  /**
   * Get server status
   */
  async getStatus(): Promise<{
    server: string;
    version: string;
    uptime: number;
    connections: number;
    activeSessions: number;
    totalSessions: number;
  }> {
    return this.httpRequest('GET', '/api/status');
  }

  /**
   * Attach to a session for real-time updates
   */
  attach(sessionId: string): void {
    this.sessionId = sessionId;

    // Send subscribe message
    this.send({
      type: 'subscribe',
      sessionId,
    });
  }

  /**
   * Detach from current session
   */
  detach(): void {
    if (this.sessionId) {
      this.send({
        type: 'unsubscribe',
        sessionId: this.sessionId,
      });
      this.sessionId = null;
    }
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove message handler
   */
  offMessage(handler: MessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Remove error handler
   */
  offError(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * Send message to server
   */
  private send(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: Record<string, unknown>): void {
    // Call all message handlers
    for (const handler of this.messageHandlers) {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    // Call all error handlers
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`Reconnecting in ${this.reconnectInterval / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error.message);
      });
    }, this.reconnectInterval);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Make HTTP request to server
   */
  private async httpRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(path, this.url);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.authToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${this.authToken}`,
      };
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
