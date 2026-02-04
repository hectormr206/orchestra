import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
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
  // Orchestration
  async orchestrate(command: OrchestrationCommand) {
    const response = await api.post('/api/orchestrate', command);
    return response.data;
  },

  // Sessions
  async getSession(sessionId: string): Promise<SessionStatus> {
    const response = await api.get(`/api/sessions/${sessionId}`);
    return response.data;
  },

  async listSessions(): Promise<{ sessions: SessionStatus[]; count: number }> {
    const response = await api.get('/api/sessions');
    return response.data;
  },

  async cancelSession(sessionId: string) {
    const response = await api.delete(`/api/sessions/${sessionId}`);
    return response.data;
  },

  // Server status
  async getStatus() {
    const response = await api.get('/api/status');
    return response.data;
  },

  // Health check
  async health() {
    const response = await api.get('/health');
    return response.data;
  },

  // Plugins (mock data for now)
  async listPlugins(): Promise<{ plugins: Plugin[]; total: number }> {
    // Return built-in plugins
    return {
      plugins: [
        {
          id: 'express-js',
          name: 'Express.js Plugin',
          description: 'Provides specialized support for Express.js applications with enhanced prompts, validations, and audit rules',
          version: '0.1.0',
          author: 'Orchestra Team',
          category: 'Backend Frameworks',
          official: true,
          tags: ['express', 'nodejs', 'web', 'backend'],
        },
        {
          id: 'fast-api',
          name: 'FastAPI Plugin',
          description: 'Provides specialized support for FastAPI applications with APIRouter patterns, Pydantic validation, and async handlers',
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
