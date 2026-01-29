/**
 * Notifications - Sistema de notificaciones (Desktop/Slack/Webhook)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NotificationConfig {
  enabled: boolean;
  desktop: boolean;
  slack?: {
    webhookUrl: string;
    channel?: string;
  };
  webhook?: {
    url: string;
    headers?: Record<string, string>;
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  sessionId?: string;
  task?: string;
  duration?: number;
  filesCreated?: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  desktop: true,
};

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Envía notificación por todos los canales configurados
   */
  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.config.enabled) return;

    const promises: Promise<void>[] = [];

    if (this.config.desktop) {
      promises.push(this.sendDesktopNotification(payload));
    }

    if (this.config.slack?.webhookUrl) {
      promises.push(this.sendSlackNotification(payload));
    }

    if (this.config.webhook?.url) {
      promises.push(this.sendWebhookNotification(payload));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Notificación de sesión completada
   */
  async notifySessionComplete(sessionId: string, task: string, success: boolean, duration?: number, filesCreated?: number): Promise<void> {
    await this.notify({
      title: success ? '✅ Orchestra - Session Complete' : '❌ Orchestra - Session Failed',
      message: success
        ? 'Task completed successfully: ' + task.substring(0, 50) + '...'
        : 'Task failed: ' + task.substring(0, 50) + '...',
      type: success ? 'success' : 'error',
      sessionId,
      task,
      duration,
      filesCreated,
    });
  }

  /**
   * Notificación de plan listo para aprobación
   */
  async notifyPlanReady(sessionId: string, task: string): Promise<void> {
    await this.notify({
      title: '📋 Orchestra - Plan Ready',
      message: 'Plan ready for approval: ' + task.substring(0, 50) + '...',
      type: 'info',
      sessionId,
      task,
    });
  }

  /**
   * Notificación de error crítico
   */
  async notifyError(sessionId: string, error: string): Promise<void> {
    await this.notify({
      title: '🚨 Orchestra - Error',
      message: error.substring(0, 100),
      type: 'error',
      sessionId,
    });
  }

  /**
   * Envía notificación de escritorio
   */
  private async sendDesktopNotification(payload: NotificationPayload): Promise<void> {
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        // macOS
        const script = 'display notification "' + escapeQuotes(payload.message) + '" with title "' + escapeQuotes(payload.title) + '"';
        await execAsync('osascript -e \'' + script + '\'');
      } else if (platform === 'linux') {
        // Linux (notify-send)
        const urgency = payload.type === 'error' ? 'critical' : payload.type === 'warning' ? 'normal' : 'low';
        await execAsync('notify-send -u ' + urgency + ' "' + escapeQuotes(payload.title) + '" "' + escapeQuotes(payload.message) + '"');
      } else if (platform === 'win32') {
        // Windows (PowerShell)
        const ps = '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; ' +
          '$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02); ' +
          '$textNodes = $template.GetElementsByTagName("text"); ' +
          '$textNodes.Item(0).AppendChild($template.CreateTextNode("' + escapeQuotes(payload.title) + '")); ' +
          '$textNodes.Item(1).AppendChild($template.CreateTextNode("' + escapeQuotes(payload.message) + '")); ' +
          '$toast = [Windows.UI.Notifications.ToastNotification]::new($template); ' +
          '[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Orchestra").Show($toast)';
        await execAsync('powershell -Command "' + ps + '"');
      }
    } catch {
      // Silently fail for desktop notifications
    }
  }

  /**
   * Envía notificación a Slack
   */
  private async sendSlackNotification(payload: NotificationPayload): Promise<void> {
    if (!this.config.slack?.webhookUrl) return;

    const color = payload.type === 'success' ? 'good'
      : payload.type === 'error' ? 'danger'
      : payload.type === 'warning' ? 'warning'
      : '#439FE0';

    const slackPayload = {
      channel: this.config.slack.channel,
      attachments: [
        {
          color,
          title: payload.title,
          text: payload.message,
          fields: [
            payload.sessionId ? { title: 'Session', value: payload.sessionId, short: true } : null,
            payload.duration ? { title: 'Duration', value: formatDuration(payload.duration), short: true } : null,
            payload.filesCreated !== undefined ? { title: 'Files', value: String(payload.filesCreated), short: true } : null,
          ].filter(Boolean),
          footer: 'Orchestra Meta-Orchestrator',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      });

      if (!response.ok) {
        console.error('Slack notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Slack notification error:', error);
    }
  }

  /**
   * Envía notificación a webhook genérico
   */
  private async sendWebhookNotification(payload: NotificationPayload): Promise<void> {
    if (!this.config.webhook?.url) return;

    const webhookPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      source: 'orchestra',
    };

    try {
      const response = await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.webhook.headers,
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        console.error('Webhook notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Webhook notification error:', error);
    }
  }
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + 'm ' + seconds + 's';
}
