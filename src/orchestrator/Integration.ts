/**
 * Integration Module - Connects new modules with Orchestrator
 *
 * Integrates:
 * - Session recovery
 * - Export functionality
 * - Security auditing
 * - Jira integration
 * - Slack/Discord notifications
 * - CI/CD integration
 * - Prompt optimization
 * - Redis caching
 * - Framework detection
 * - Telemetry
 */

import { Orchestrator, type OrchestratorCallbacks } from './Orchestrator.js';
import type { OrchestratorConfig } from '../types.js';
import {
  SessionRecoveryManager,
  getSessionRecoveryManager,
  createCheckpoint,
  type RecoveryPoint,
} from '../utils/sessionRecovery.js';
import { ExportManager } from '../utils/export.js';
import { SecurityAuditor } from '../utils/securityAudit.js';
import { JiraClient, createIssueFromOrchestraResult } from '../utils/jiraIntegration.js';
import {
  sendNotification,
  createNotificationConfigFromEnv,
  type OrchestraNotificationData,
} from '../utils/slackDiscordIntegration.js';
import { detectProject, type ProjectDetection } from '../utils/frameworkDetector.js';
import { PromptOptimizer } from '../utils/promptOptimizer.js';
import { getRedisCache, getResponseCache, type SessionCache } from '../utils/redisCache.js';
import type { SessionData } from '../utils/export.js';

/**
 * Extended configuration with integration options
 */
export interface IntegrationConfig {
  // Recovery
  enableRecovery?: boolean;
  autoRecoverOnStart?: boolean;

  // Export
  autoExport?: boolean;
  exportFormat?: 'html' | 'markdown' | 'json';
  exportPath?: string;

  // Security
  runSecurityAudit?: boolean;
  failOnSecurityIssues?: boolean;
  securityAuditLevel?: 'critical' | 'high' | 'medium' | 'low';

  // Jira
  enableJira?: boolean;
  jiraProjectKey?: string;
  createJiraIssue?: 'on_fail' | 'always' | 'never';

  // Notifications
  enableNotifications?: boolean;
  notifyOnEvents?: ('start' | 'progress' | 'complete' | 'fail')[];

  // Caching
  enableRedisCache?: boolean;
  cacheResponses?: boolean;
  cacheTTL?: number;

  // Prompt optimization
  optimizePrompts?: boolean;

  // Framework detection
  detectFramework?: boolean;
}

/**
 * Integrated session data
 */
export interface IntegratedSession {
  sessionId: string;
  task: string;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  filesCreated: string[];
  filesModified: string[];
  errors: string[];
  plan?: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    phase?: string;
  }>;
  metadata?: {
    framework?: ProjectDetection;
    securityAudit?: any;
    jiraIssue?: string;
  };
}

/**
 * Orchestrator Integration
 */
export class OrchestratorIntegration {
  private orchestrator: Orchestrator;
  private config: IntegrationConfig;
  private recoveryManager: SessionRecoveryManager;
  private exportManager: ExportManager;
  private securityAuditor: SecurityAuditor;
  private jiraClient?: JiraClient;
  private useFrameworkDetection: boolean = false;
  private promptOptimizer?: PromptOptimizer;
  private sessionData: IntegratedSession;
  private startTime: number = 0;
  private currentPhase: string = '';

  constructor(
    orchestrator: Orchestrator,
    config: IntegrationConfig = {}
  ) {
    this.orchestrator = orchestrator;
    this.config = {
      enableRecovery: true,
      autoRecoverOnStart: true,
      autoExport: false,
      exportFormat: 'html',
      runSecurityAudit: false,
      failOnSecurityIssues: false,
      securityAuditLevel: 'high',
      enableJira: false,
      createJiraIssue: 'on_fail',
      enableNotifications: false,
      notifyOnEvents: ['complete', 'fail'],
      enableRedisCache: false,
      cacheResponses: false,
      cacheTTL: 3600,
      optimizePrompts: false,
      detectFramework: true,
      ...config,
    };

    // Initialize managers
    this.recoveryManager = getSessionRecoveryManager(
      this.orchestrator['config'].orchestraDir,
      {
        autoRecover: this.config.autoRecoverOnStart,
      }
    );

    this.exportManager = new ExportManager();
    this.securityAuditor = new SecurityAuditor({
      failOnLevel: this.config.securityAuditLevel,
    });

    // Initialize optional modules
    if (this.config.enableJira && this.config.jiraProjectKey) {
      const jiraConfig = {
        baseUrl: process.env.JIRA_BASE_URL || '',
        email: process.env.JIRA_EMAIL || '',
        apiToken: process.env.JIRA_API_TOKEN || '',
        projectKey: this.config.jiraProjectKey,
      };
      if (jiraConfig.baseUrl && jiraConfig.email && jiraConfig.apiToken) {
        this.jiraClient = new JiraClient(jiraConfig);
      }
    }

    if (this.config.detectFramework) {
      this.useFrameworkDetection = true;
    }

    if (this.config.optimizePrompts) {
      this.promptOptimizer = new PromptOptimizer();
    }

    // Initialize session data
    this.sessionData = {
      sessionId: this.generateSessionId(),
      task: '',
      status: 'in_progress',
      startTime: 0,
      filesCreated: [],
      filesModified: [],
      errors: [],
      logs: [],
    };

    // Setup integration callbacks
    this.setupCallbacks();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `orch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup integration callbacks
   */
  private setupCallbacks(): void {
    const originalCallbacks = this.orchestrator['callbacks'];

    // Wrap callbacks to add integration logic
    const integratedCallbacks: OrchestratorCallbacks = {
      ...originalCallbacks,

      onPhaseStart: (phase: string, agent: string) => {
        this.currentPhase = phase;
        this.addLog('info', `Starting phase: ${phase} with ${agent}`, phase);
        originalCallbacks.onPhaseStart?.(phase, agent);
      },

      onPhaseComplete: (phase: string, agent: string, result: any) => {
        this.addLog('info', `Completed phase: ${phase}`, phase);

        // Create recovery point
        if (this.config.enableRecovery) {
          this.createRecoveryCheckpoint(phase);
        }

        originalCallbacks.onPhaseComplete?.(phase, agent, result);
      },

      onError: (phase: string, error: string) => {
        this.addLog('error', `Error in ${phase}: ${error}`, phase);
        this.sessionData.errors.push(`[${phase}] ${error}`);
        originalCallbacks.onError?.(phase, error);
      },

      onRecoveryComplete: (success: boolean, recovered: string[], failed: string[]) => {
        this.addLog('info', `Recovery complete: ${recovered.length} recovered, ${failed.length} failed`, 'recovery');

        if (!success && failed.length > 0) {
          this.addLog('error', `Failed to recover files: ${failed.join(', ')}`, 'recovery');
        }

        originalCallbacks.onRecoveryComplete?.(success, recovered, failed);
      },

      onTestComplete: (result: any) => {
        this.addLog('info', `Tests ${result.success ? 'passed' : 'failed'}`, 'testing');

        if (!result.success) {
          this.sessionData.errors.push('Tests failed');
        }

        originalCallbacks.onTestComplete?.(result);
      },

      onCommitComplete: (result: any) => {
        this.addLog('info', `Git commit ${result.success ? 'successful' : 'failed'}`, 'git');
        originalCallbacks.onCommitComplete?.(result);
      },
    };

    // Update callbacks
    this.orchestrator['callbacks'] = integratedCallbacks;
  }

  /**
   * Add log entry
   */
  private addLog(level: any, message: string, phase?: string): void {
    this.sessionData.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      phase,
    });
  }

  /**
   * Create recovery checkpoint
   */
  private createRecoveryCheckpoint(phase: string): void {
    const stateManager = this.orchestrator['stateManager'];

    // Load state asynchronously
    stateManager.load().then((state) => {
      if (state) {
        // Create checkpoints for files
        const checkpoints: any[] = [];
        // Note: SessionState doesn't have filesCreated, would need to track separately

        this.recoveryManager.createRecoveryPoint(
          this.sessionData.sessionId,
          phase,
          state,
          this.sessionData.filesCreated,
          checkpoints
        );
      }
    }).catch(() => {
      // Ignore errors
    });
  }

  /**
   * Run task with all integrations
   */
  async runTask(task: string): Promise<{
    success: boolean;
    sessionId: string;
    sessionData: IntegratedSession;
  }> {
    this.sessionData.task = task;
    this.sessionData.status = 'in_progress';
    this.startTime = Date.now();

    // Detect framework if enabled
    if (this.useFrameworkDetection) {
      try {
        const detection = detectProject();
        this.sessionData.metadata = {
          ...this.sessionData.metadata,
          framework: detection,
        };

        this.addLog('info', `Detected framework: ${detection.language}`, 'detection');
      } catch (error) {
        this.addLog('warn', `Framework detection failed: ${error}`, 'detection');
      }
    }

    // Optimize prompt if enabled
    let optimizedTask = task;
    if (this.promptOptimizer) {
      try {
        const analysis = this.promptOptimizer.analyzePrompt(task);
        if (analysis.score < 70) {
          optimizedTask = analysis.optimizedPrompt;
          this.addLog('info', `Prompt optimized (score: ${analysis.score} -> improved)`, 'optimization');
        }
      } catch (error) {
        this.addLog('warn', `Prompt optimization failed: ${error}`, 'optimization');
      }
    }

    // Send start notification
    await this.sendNotification('start', {
      task,
      status: 'started',
      sessionId: this.sessionData.sessionId,
    });

    try {
      // Run orchestrator (returns boolean)
      const success = await this.orchestrator.run(optimizedTask);

      // Update session data
      this.sessionData.status = success ? 'completed' : 'failed';
      this.sessionData.endTime = Date.now();
      this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;

      // Run security audit if enabled
      if (this.config.runSecurityAudit) {
        await this.runSecurityAudit();
      }

      // Export session if enabled
      if (this.config.autoExport) {
        await this.exportSession();
      }

      // Create Jira issue if needed
      if (this.jiraClient && this.shouldCreateJiraIssue()) {
        await this.createJiraIssue();
      }

      // Send completion notification
      await this.sendNotification(
        success ? 'complete' : 'fail',
        {
          task,
          status: success ? 'completed' : 'failed',
          duration: this.sessionData.duration,
          filesCreated: this.sessionData.filesCreated,
          filesModified: this.sessionData.filesModified,
          errors: this.sessionData.errors,
          sessionId: this.sessionData.sessionId,
        }
      );

      // Cleanup recovery point on success
      if (success && this.config.enableRecovery) {
        this.recoveryManager.deleteRecoveryPoint(this.sessionData.sessionId);
      }

      return {
        success,
        sessionId: this.sessionData.sessionId,
        sessionData: this.sessionData,
      };
    } catch (error) {
      this.sessionData.status = 'failed';
      this.sessionData.endTime = Date.now();
      this.sessionData.duration = this.sessionData.endTime - this.startTime;
      this.sessionData.errors.push(String(error));

      // Create recovery point on crash
      if (this.config.enableRecovery) {
        this.createRecoveryCheckpoint('crashed');
      }

      // Send failure notification
      await this.sendNotification('fail', {
        task,
        status: 'failed',
        duration: this.sessionData.duration,
        errors: this.sessionData.errors,
        sessionId: this.sessionData.sessionId,
      });

      // Create Jira issue on failure
      if (this.jiraClient && this.config.createJiraIssue === 'on_fail') {
        await this.createJiraIssue();
      }

      return {
        success: false,
        sessionId: this.sessionData.sessionId,
        sessionData: this.sessionData,
      };
    }
  }

  /**
   * Run security audit
   */
  private async runSecurityAudit(): Promise<void> {
    try {
      const result = await this.securityAuditor.audit();

      this.sessionData.metadata = {
        ...this.sessionData.metadata,
        securityAudit: result,
      };

      this.addLog('info', `Security audit complete: score ${result.score}/100, ${result.issues.length} issues`, 'security');

      if (this.config.failOnSecurityIssues && !result.passed) {
        throw new Error(`Security audit failed with ${result.summary.critical} critical, ${result.summary.high} high issues`);
      }
    } catch (error) {
      this.addLog('error', `Security audit failed: ${error}`, 'security');
      if (this.config.failOnSecurityIssues) {
        throw error;
      }
    }
  }

  /**
   * Export session
   */
  private async exportSession(): Promise<void> {
    try {
      // Convert IntegratedSession to SessionData format
      const sessionData: SessionData = {
        sessionId: this.sessionData.sessionId,
        task: this.sessionData.task,
        status: this.sessionData.status,
        startTime: new Date(this.sessionData.startTime).toISOString(),
        endTime: this.sessionData.endTime ? new Date(this.sessionData.endTime).toISOString() : undefined,
        duration: this.sessionData.duration,
        filesCreated: this.sessionData.filesCreated,
        filesModified: this.sessionData.filesModified,
        errors: this.sessionData.errors,
        plan: this.sessionData.plan,
        logs: this.sessionData.logs as any,
        metadata: this.sessionData.metadata,
      };

      const result = await this.exportManager.exportToFile(
        sessionData,
        this.config.exportFormat!,
        this.config.exportPath
      );

      if (result.success) {
        this.addLog('info', `Session exported to ${result.path}`, 'export');
      } else {
        this.addLog('warn', `Export failed: ${result.error}`, 'export');
      }
    } catch (error) {
      this.addLog('warn', `Export failed: ${error}`, 'export');
    }
  }

  /**
   * Check if Jira issue should be created
   */
  private shouldCreateJiraIssue(): boolean {
    return (
      this.config.createJiraIssue === 'always' ||
      (this.config.createJiraIssue === 'on_fail' && this.sessionData.status === 'failed')
    );
  }

  /**
   * Create Jira issue
   */
  private async createJiraIssue(): Promise<void> {
    if (!this.jiraClient) return;

    try {
      const result = await createIssueFromOrchestraResult(
        this.jiraClient,
        this.sessionData.task,
        this.sessionData.status === 'completed',
        [...this.sessionData.filesCreated, ...this.sessionData.filesModified],
        this.sessionData.errors
      );

      if (result.success && result.issue) {
        this.sessionData.metadata = {
          ...this.sessionData.metadata,
          jiraIssue: result.issue.key,
        };

        this.addLog('info', `Jira issue created: ${result.issue.key}`, 'jira');
      } else {
        this.addLog('warn', `Jira issue creation failed: ${result.error}`, 'jira');
      }
    } catch (error) {
      this.addLog('warn', `Jira issue creation failed: ${error}`, 'jira');
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(
    event: 'start' | 'progress' | 'complete' | 'fail',
    data: OrchestraNotificationData
  ): Promise<void> {
    if (!this.config.enableNotifications) return;
    if (!this.config.notifyOnEvents?.includes(event)) return;

    try {
      const notificationConfig = createNotificationConfigFromEnv();
      if (notificationConfig.slack || notificationConfig.discord) {
        await sendNotification(notificationConfig, data);
        this.addLog('info', `Notification sent: ${event}`, 'notification');
      }
    } catch (error) {
      this.addLog('warn', `Notification failed: ${error}`, 'notification');
    }
  }

  /**
   * Recover session
   */
  async recoverSession(sessionId: string): Promise<boolean> {
    try {
      const result = await this.recoveryManager.recoverSession(sessionId);

      if (result.success) {
        this.addLog('info', `Session recovered: ${result.filesRestored.length} files restored`, 'recovery');
        return true;
      } else {
        this.addLog('error', `Recovery failed: ${result.errors.join(', ')}`, 'recovery');
        return false;
      }
    } catch (error) {
      this.addLog('error', `Recovery failed: ${error}`, 'recovery');
      return false;
    }
  }

  /**
   * Get session data
   */
  getSessionData(): IntegratedSession {
    return this.sessionData;
  }

  /**
   * Get underlying orchestrator
   */
  getOrchestrator(): Orchestrator {
    return this.orchestrator;
  }
}

/**
 * Create integrated orchestrator
 */
export function createIntegratedOrchestrator(
  config: Partial<OrchestratorConfig> = {},
  callbacks: OrchestratorCallbacks = {},
  integrationConfig: IntegrationConfig = {}
): OrchestratorIntegration {
  const orchestrator = new Orchestrator(config, callbacks);
  return new OrchestratorIntegration(orchestrator, integrationConfig);
}

/**
 * Auto-recover crashed sessions
 */
export async function autoRecoverSessions(orchestraDir: string = '.orchestra'): Promise<void> {
  const manager = getSessionRecoveryManager(orchestraDir, {
    autoRecover: true,
  });

  const results = await manager.autoRecover();

  if (results.length > 0) {
    console.log(`Recovered ${results.length} session(s)`);
    for (const result of results) {
      if (result.success) {
        console.log(`  ✓ ${result.sessionId}: ${result.filesRestored.length} files restored`);
      } else {
        console.log(`  ✗ ${result.sessionId}: ${result.errors.join(', ')}`);
      }
    }
  }
}
