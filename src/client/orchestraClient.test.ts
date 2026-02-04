/**
 * Tests for OrchestraClient
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrchestraClient } from './OrchestraClient.js';

// Mock WebSocket
vi.mock('ws', () => ({
  WebSocket: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    readyState: 1, // OPEN
  })),
}));

// Mock fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe('OrchestraClient', () => {
  let client: OrchestraClient;

  beforeEach(() => {
    client = new OrchestraClient({
      url: 'http://localhost:8080',
      authToken: 'test-token',
    });
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('constructor', () => {
    it('should create client with default options', () => {
      const defaultClient = new OrchestraClient({ url: 'http://localhost:8080' });
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom options', () => {
      const customClient = new OrchestraClient({
        url: 'http://localhost:8080',
        authToken: 'secret',
        reconnect: false,
        reconnectInterval: 10000,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('connection', () => {
    it('should have connect method', () => {
      expect(typeof client.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(typeof client.disconnect).toBe('function');
    });

    it('should check connection status', () => {
      expect(typeof client.isConnected).toBe('function');
      // Not connected yet
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('orchestrate', () => {
    it('should send orchestration command', async () => {
      const mockResponse = { sessionId: 'test-session-123' };
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const sessionId = await client.orchestrate({ task: 'Create API endpoint' });
      expect(sessionId).toBe('test-session-123');
    });

    it('should handle orchestration errors', async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid task' }),
      });

      await expect(client.orchestrate({ task: '' }))
        .rejects.toThrow('Invalid task');
    });
  });

  describe('getSession', () => {
    it('should get session status', async () => {
      const mockSession = {
        sessionId: 'test-123',
        status: 'running',
        task: 'test task',
        startTime: Date.now(),
        clientCount: 1,
      };
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const session = await client.getSession('test-123');
      expect(session).toEqual(mockSession);
    });
  });

  describe('listSessions', () => {
    it('should list all sessions', async () => {
      const mockResponse = {
        sessions: [
          { sessionId: 's1', status: 'running', task: 'task1', startTime: Date.now() },
          { sessionId: 's2', status: 'completed', task: 'task2', startTime: Date.now() },
        ],
        count: 2,
      };
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listSessions();
      expect(result.sessions).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe('cancelSession', () => {
    it('should cancel a session', async () => {
      const mockResponse = {
        message: 'Session cancelled',
        sessionId: 'test-123',
      };
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.cancelSession('test-123');
      expect(result.message).toBe('Session cancelled');
    });
  });

  describe('getStatus', () => {
    it('should get server status', async () => {
      const mockStatus = {
        server: 'running',
        version: '0.1.0',
        uptime: 12345,
        connections: 5,
        activeSessions: 2,
        totalSessions: 10,
      };
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await client.getStatus();
      expect(status.server).toBe('running');
      expect(status.version).toBe('0.1.0');
    });
  });

  describe('attach/detach', () => {
    it('should attach to session', () => {
      client.attach('test-session');
      expect(client['sessionId']).toBe('test-session');
    });

    it('should detach from session', () => {
      client.attach('test-session');
      client.detach();
      expect(client['sessionId']).toBeNull();
    });
  });

  describe('message handlers', () => {
    it('should add message handler', () => {
      const handler = vi.fn();
      client.onMessage(handler);
      expect(client['messageHandlers']).toContain(handler);
    });

    it('should remove message handler', () => {
      const handler = vi.fn();
      client.onMessage(handler);
      client.offMessage(handler);
      expect(client['messageHandlers']).not.toContain(handler);
    });

    it('should call message handlers', () => {
      const handler = vi.fn();
      client.onMessage(handler);
      client['handleMessage']({ type: 'test', data: 'hello' });
      expect(handler).toHaveBeenCalledWith({ type: 'test', data: 'hello' });
    });
  });

  describe('error handlers', () => {
    it('should add error handler', () => {
      const handler = vi.fn();
      client.onError(handler);
      expect(client['errorHandlers']).toContain(handler);
    });

    it('should remove error handler', () => {
      const handler = vi.fn();
      client.onError(handler);
      client.offError(handler);
      expect(client['errorHandlers']).not.toContain(handler);
    });

    it('should call error handlers', () => {
      const handler = vi.fn();
      client.onError(handler);
      const error = new Error('Test error');
      client['handleError'](error);
      expect(handler).toHaveBeenCalledWith(error);
    });
  });

  describe('reconnection', () => {
    it('should have reconnect option', () => {
      const reconnectClient = new OrchestraClient({
        url: 'http://localhost:8080',
        reconnect: true,
      });
      const noReconnectClient = new OrchestraClient({
        url: 'http://localhost:8080',
        reconnect: false,
      });

      expect(reconnectClient).toBeDefined();
      expect(noReconnectClient).toBeDefined();
    });

    it('should clear reconnect timer on disconnect', () => {
      const reconnectClient = new OrchestraClient({
        url: 'http://localhost:8080',
        reconnect: true,
      });

      // Manually set a timer
      reconnectClient['reconnectTimer'] = setTimeout(() => {}, 10000);

      // Disconnect should clear the timer
      reconnectClient.disconnect();
      expect(reconnectClient['reconnectTimer']).toBeNull();
    });
  });
});
