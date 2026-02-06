import axios from 'axios';

// Use the new web API server (server.ts)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
  },
});

export interface OrchestrationCommand {
  task: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SessionStatus {
  sessionId: string;
  status: string;
  task: string;
  startTime: number;
  endTime?: number;
  clientCount: number;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  official: boolean;
  tags: string[];
}

export default {
  // Sessions
  async getSessions(params?: { limit?: number; status?: string; search?: string }) {
    const response = await api.get('/api/sessions', { params });
    return response.data.sessions;
  },

  async getSession(sessionId: string) {
    const response = await api.get(`/api/sessions/${sessionId}`);
    return response.data.session;
  },

  async deleteSession(sessionId: string) {
    const response = await api.delete(`/api/sessions/${sessionId}`);
    return response.data;
  },

  async bulkDelete(sessionIds: string[]) {
    const response = await api.post('/api/sessions/bulk-delete', { sessionIds });
    return response.data;
  },

  async searchSessions(query: string, options?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    searchFields?: string[];
  }) {
    const response = await api.post('/api/sessions/search', {
      query,
      ...options
    });
    return response.data.results;
  },

  // Analytics
  async getAnalyticsTrends(params?: { range?: string; groupBy?: string }) {
    const response = await api.get('/api/analytics/trends', { params });
    return response.data.trends;
  },

  async getAgentPerformance(params?: { range?: string }) {
    const response = await api.get('/api/analytics/agents', { params });
    return response.data.agentStats;
  },

  async getTopErrors(params?: { range?: string; limit?: number }) {
    const response = await api.get('/api/analytics/errors', { params });
    return response.data.errors;
  },

  // Comparison
  async compareSessions(sessionAId: string, sessionBId: string) {
    const response = await api.post('/api/compare', { sessionAId, sessionBId });
    return response.data.comparison;
  },

  // Export
  async exportSession(sessionId: string, format: 'csv' | 'html' | 'json' | 'markdown') {
    const response = await api.post('/api/export', { sessionId, format }, {
      responseType: 'blob'
    });
    return response.data;
  },

  async batchExport(sessionIds: string[], format: 'csv' | 'html' | 'json' | 'markdown') {
    const response = await api.post('/api/export/batch', { sessionIds, format });
    return response.data;
  },

  // Stats
  async getStats() {
    const response = await api.get('/api/stats');
    return response.data.stats;
  },

  // Health check
  async health() {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Project info
  async getProjectInfo() {
    const response = await api.get('/api/info');
    return response.data;
  },

  // Legacy methods (for backward compatibility)
  async orchestrate(command: OrchestrationCommand) {
    throw new Error('Orchestration endpoint not available in new API. Use CLI instead.');
  },

  async listSessions(): Promise<{ sessions: SessionStatus[]; count: number }> {
    const sessions = await this.getSessions();
    return { sessions, count: sessions.length };
  },

  async cancelSession(sessionId: string) {
    return await this.deleteSession(sessionId);
  },

  async getStatus() {
    return await this.getStats();
  },

  // Plugins (mock data for now)
  async listPlugins(): Promise<{ plugins: Plugin[]; total: number }> {
    return {
      plugins: [
        {
          id: 'express-js',
          name: 'Express.js Plugin',
          description: 'Provides specialized support for Express.js applications',
          version: '0.1.0',
          author: 'Orchestra Team',
          category: 'Backend Frameworks',
          official: true,
          tags: ['express', 'nodejs', 'web', 'backend'],
        },
        {
          id: 'fast-api',
          name: 'FastAPI Plugin',
          description: 'Provides specialized support for FastAPI applications',
          version: '0.1.0',
          author: 'Orchestra Team',
          category: 'Backend Frameworks',
          official: true,
          tags: ['fastapi', 'python', 'web', 'backend', 'async'],
        },
      ],
      total: 2,
    };
  },
};
