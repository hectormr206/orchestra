/**
 * Analytics Engine - Performance trends and insights for Orchestra sessions
 */

import type { SessionData } from './sessionExport.js';

export interface TrendData {
  period: string; // "2026-01-01" or "2026-W01"
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}

export interface AgentStats {
  agentRole: 'architect' | 'executor' | 'auditor' | 'consultant';
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  avgLatencyMs: number;
  totalCost: number;
}

export interface ErrorFrequency {
  errorMessage: string;
  count: number;
  affectedSessions: string[];
}

export class AnalyticsEngine {
  constructor(private sessions: SessionData[]) {}

  /**
   * Calculate trends grouped by day, week, or month
   */
  calculateTrends(groupBy: 'day' | 'week' | 'month' = 'week'): TrendData[] {
    const groups = new Map<string, SessionData[]>();

    for (const session of this.sessions) {
      const date = new Date(session.startTime);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekNum = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(session);
    }

    const trends: TrendData[] = [];
    for (const [period, sessions] of groups) {
      const completed = sessions.filter(s => s.status === 'completed').length;
      const failed = sessions.filter(s => s.status === 'failed').length;
      const totalDuration = sessions.reduce((sum, s) => sum + (s.metrics?.totalDuration || 0), 0);
      const totalCost = sessions.reduce((sum, s) => sum + this.calculateSessionCost(s), 0);

      trends.push({
        period,
        total: sessions.length,
        completed,
        failed,
        successRate: sessions.length > 0 ? completed / sessions.length : 0,
        avgDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
        totalCost
      });
    }

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get agent performance statistics
   */
  getAgentPerformance(): AgentStats[] {
    const agentMap = new Map<string, AgentStats>();

    for (const session of this.sessions) {
      // Extract from session.iterations
      if (session.iterations && session.iterations.length > 0) {
        for (const iter of session.iterations) {
          const role = iter.agent as 'architect' | 'executor' | 'auditor' | 'consultant';
          if (!agentMap.has(role)) {
            agentMap.set(role, {
              agentRole: role,
              totalAttempts: 0,
              successfulAttempts: 0,
              failedAttempts: 0,
              successRate: 0,
              avgLatencyMs: 0,
              totalCost: 0
            });
          }

          const stats = agentMap.get(role)!;
          stats.totalAttempts++;

          if (iter.success) {
            stats.successfulAttempts++;
          } else {
            stats.failedAttempts++;
          }

          // Calculate latency from iteration times
          const startMs = new Date(iter.startTime).getTime();
          const endMs = new Date(iter.endTime).getTime();
          stats.avgLatencyMs += endMs - startMs;

          // Estimate cost (placeholder - would need actual token counts)
          stats.totalCost += 0.01; // Placeholder
        }
      }
    }

    // Calculate averages
    for (const stats of agentMap.values()) {
      if (stats.totalAttempts > 0) {
        stats.successRate = stats.successfulAttempts / stats.totalAttempts;
        stats.avgLatencyMs = stats.avgLatencyMs / stats.totalAttempts;
      }
    }

    return Array.from(agentMap.values());
  }

  /**
   * Get most frequent errors
   */
  getTopErrors(limit: number = 10): ErrorFrequency[] {
    const errorMap = new Map<string, ErrorFrequency>();

    for (const session of this.sessions) {
      if (session.status === 'failed' || session.status === 'cancelled') {
        // Extract error from iterations
        const errorMsg = this.extractErrorMessage(session);
        if (errorMsg) {
          if (!errorMap.has(errorMsg)) {
            errorMap.set(errorMsg, {
              errorMessage: errorMsg,
              count: 0,
              affectedSessions: []
            });
          }
          const freq = errorMap.get(errorMsg)!;
          freq.count++;
          freq.affectedSessions.push(session.id);
        }
      }
    }

    return Array.from(errorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Calculate total cost for a session
   */
  private calculateSessionCost(session: SessionData): number {
    // Sum all model costs from iterations (placeholder)
    let total = 0;
    if (session.iterations) {
      for (const iter of session.iterations) {
        total += 0.01; // Placeholder cost per iteration
      }
    }
    return total;
  }

  /**
   * Extract error message from session
   */
  private extractErrorMessage(session: SessionData): string | null {
    // Look in iterations for error messages
    if (session.iterations) {
      for (const iter of session.iterations) {
        if (!iter.success && iter.error) {
          // Truncate to first 100 chars for grouping
          return iter.error.substring(0, 100);
        }
      }
    }
    return null;
  }
}
