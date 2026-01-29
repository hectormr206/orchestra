/**
 * Metrics Collector - Recolecta métricas de rendimiento de la orquestación
 */

export interface AgentMetrics {
  name: string;
  invocations: number;
  totalDuration: number;
  avgDuration: number;
  successes: number;
  failures: number;
  successRate: number;
  fallbacks: number;
}

export interface FileMetrics {
  path: string;
  language: string;
  processTime: number;
  auditTime: number;
  fixAttempts: number;
  syntaxErrors: number;
  approved: boolean;
}

export interface SessionMetrics {
  sessionId: string;
  task: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  agents: Record<string, AgentMetrics>;
  files: FileMetrics[];
  iterations: number;
  finalStatus: 'completed' | 'failed' | 'cancelled';
  testsRun: boolean;
  testsPassed?: number;
  testsFailed?: number;
  committed: boolean;
  commitHash?: string;
}

export class MetricsCollector {
  private metrics: SessionMetrics;
  private agentTimers: Map<string, number> = new Map();

  constructor(sessionId: string, task: string) {
    this.metrics = {
      sessionId,
      task,
      startTime: new Date(),
      totalDuration: 0,
      agents: {},
      files: [],
      iterations: 0,
      finalStatus: 'cancelled',
      testsRun: false,
      committed: false,
    };

    // Inicializar métricas de agentes
    for (const agent of ['architect', 'executor', 'auditor', 'consultant']) {
      this.metrics.agents[agent] = {
        name: agent,
        invocations: 0,
        totalDuration: 0,
        avgDuration: 0,
        successes: 0,
        failures: 0,
        successRate: 0,
        fallbacks: 0,
      };
    }
  }

  startAgent(agent: string): void {
    this.agentTimers.set(agent, Date.now());
    this.metrics.agents[agent].invocations++;
  }

  endAgent(agent: string, success: boolean): void {
    const startTime = this.agentTimers.get(agent);
    if (startTime) {
      const duration = Date.now() - startTime;
      const agentMetrics = this.metrics.agents[agent];
      
      agentMetrics.totalDuration += duration;
      agentMetrics.avgDuration = agentMetrics.totalDuration / agentMetrics.invocations;
      
      if (success) {
        agentMetrics.successes++;
      } else {
        agentMetrics.failures++;
      }
      
      agentMetrics.successRate = 
        (agentMetrics.successes / agentMetrics.invocations) * 100;
      
      this.agentTimers.delete(agent);
    }
  }

  recordFallback(agent: string): void {
    if (this.metrics.agents[agent]) {
      this.metrics.agents[agent].fallbacks++;
    }
  }

  recordFile(file: Partial<FileMetrics> & { path: string }): void {
    const existing = this.metrics.files.find(f => f.path === file.path);
    if (existing) {
      Object.assign(existing, file);
    } else {
      this.metrics.files.push({
        path: file.path,
        language: file.language || 'unknown',
        processTime: file.processTime || 0,
        auditTime: file.auditTime || 0,
        fixAttempts: file.fixAttempts || 0,
        syntaxErrors: file.syntaxErrors || 0,
        approved: file.approved ?? false,
      });
    }
  }

  recordIteration(): void {
    this.metrics.iterations++;
  }

  recordTests(passed: number, failed: number): void {
    this.metrics.testsRun = true;
    this.metrics.testsPassed = passed;
    this.metrics.testsFailed = failed;
  }

  recordCommit(hash: string): void {
    this.metrics.committed = true;
    this.metrics.commitHash = hash;
  }

  finish(status: 'completed' | 'failed' | 'cancelled'): SessionMetrics {
    this.metrics.endTime = new Date();
    this.metrics.totalDuration = 
      this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
    this.metrics.finalStatus = status;
    return this.metrics;
  }

  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  getSummary(): string {
    const m = this.metrics;
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('                    MÉTRICAS DE SESIÓN');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push('Session: ' + m.sessionId);
    lines.push('Task: "' + m.task.substring(0, 50) + (m.task.length > 50 ? '...' : '') + '"');
    lines.push('Status: ' + m.finalStatus.toUpperCase());
    lines.push('Duration: ' + (m.totalDuration / 1000).toFixed(1) + 's');
    lines.push('Iterations: ' + m.iterations);
    lines.push('');
    lines.push('─── Agentes ───');

    for (const [name, agent] of Object.entries(m.agents)) {
      if (agent.invocations > 0) {
        let line = '  ' + name + ': ' + agent.invocations + ' calls, ';
        line += (agent.avgDuration / 1000).toFixed(1) + 's avg, ';
        line += agent.successRate.toFixed(0) + '% success';
        if (agent.fallbacks > 0) {
          line += ', ' + agent.fallbacks + ' fallbacks';
        }
        lines.push(line);
      }
    }

    if (m.files.length > 0) {
      lines.push('');
      lines.push('─── Archivos ───');
      const approved = m.files.filter(f => f.approved).length;
      lines.push('  Total: ' + m.files.length + ', Aprobados: ' + approved);
      
      const totalProcessTime = m.files.reduce((s, f) => s + f.processTime, 0);
      const totalAuditTime = m.files.reduce((s, f) => s + f.auditTime, 0);
      lines.push('  Tiempo proceso: ' + (totalProcessTime / 1000).toFixed(1) + 's');
      lines.push('  Tiempo auditoría: ' + (totalAuditTime / 1000).toFixed(1) + 's');
    }

    if (m.testsRun) {
      lines.push('');
      lines.push('─── Tests ───');
      lines.push('  Passed: ' + m.testsPassed + ', Failed: ' + m.testsFailed);
    }

    if (m.committed) {
      lines.push('');
      lines.push('─── Git ───');
      lines.push('  Commit: ' + m.commitHash);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  toJSON(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}
