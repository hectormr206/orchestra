/**
 * Slack & Discord Integration - Notifications for Orchestra sessions
 *
 * Provides:
 * - Slack webhook notifications
 * - Discord webhook notifications
 * - Rich message formatting
 * - Session progress updates
 * - Error alerts
 */

import chalk from 'chalk';

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface DiscordConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

export interface NotificationConfig {
  slack?: SlackConfig;
  discord?: DiscordConfig;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  title_link?: string;
  fields?: Array<{ title: string; value: string; short: boolean }>;
  footer?: string;
  ts?: number;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface OrchestraNotificationData {
  task: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  duration?: number;
  filesCreated?: string[];
  filesModified?: string[];
  errors?: string[];
  sessionId?: string;
  branch?: string;
  commitHash?: string;
}

/**
 * Send Slack notification
 */
export async function sendSlackNotification(
  webhookUrl: string,
  text: string,
  attachments: SlackAttachment[] = [],
  config: Partial<SlackConfig> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: any = {
      text,
      attachments,
    };

    if (config.username) {
      payload.username = config.username;
    }

    if (config.iconEmoji) {
      payload.icon_emoji = config.iconEmoji;
    }

    if (config.channel) {
      payload.channel = config.channel;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack webhook error: ${response.status} ${error}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send Discord notification
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  content: string,
  embeds: DiscordEmbed[] = [],
  config: Partial<DiscordConfig> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: any = {
      content,
      embeds,
    };

    if (config.username) {
      payload.username = config.username;
    }

    if (config.avatarUrl) {
      payload.avatar_url = config.avatarUrl;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord webhook error: ${response.status} ${error}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get color for status
 */
function getStatusColor(status: OrchestraNotificationData['status']): string {
  switch (status) {
    case 'started':
      return '#439FE0'; // Blue
    case 'progress':
      return '#FFA500'; // Orange
    case 'completed':
      return '#36A64F'; // Green
    case 'failed':
      return '#FF0000'; // Red
    default:
      return '#808080'; // Gray
  }
}

/**
 * Get numeric color for Discord
 */
function getDiscordColor(status: OrchestraNotificationData['status']): number {
  switch (status) {
    case 'started':
      return 4437376; // Blue
    case 'progress':
      return 16744192; // Orange
    case 'completed':
      return 3581519; // Green
    case 'failed':
      return 16711680; // Red
    default:
      return 8421504; // Gray
  }
}

/**
 * Send Orchestra notification to Slack
 */
export async function sendSlackOrchestraNotification(
  config: SlackConfig,
  data: OrchestraNotificationData
): Promise<{ success: boolean; error?: string }> {
  const color = getStatusColor(data.status);

  let text = '';
  let title = '';

  switch (data.status) {
    case 'started':
      text = `🚀 Orchestra task started: ${data.task}`;
      title = 'Orchestra Task Started';
      break;
    case 'progress':
      text = `⏳ Orchestra in progress: ${data.task}`;
      title = 'Orchestra Task Progress';
      break;
    case 'completed':
      text = `✅ Orchestra task completed: ${data.task}`;
      title = 'Orchestra Task Completed';
      break;
    case 'failed':
      text = `❌ Orchestra task failed: ${data.task}`;
      title = 'Orchestra Task Failed';
      break;
  }

  const fields: Array<{ title: string; value: string; short: boolean }> = [
    { title: 'Task', value: data.task, short: false },
  ];

  if (data.sessionId) {
    fields.push({ title: 'Session ID', value: data.sessionId, short: true });
  }

  if (data.branch) {
    fields.push({ title: 'Branch', value: data.branch, short: true });
  }

  if (data.duration !== undefined) {
    fields.push({
      title: 'Duration',
      value: `${(data.duration / 1000).toFixed(1)}s`,
      short: true,
    });
  }

  if (data.filesCreated && data.filesCreated.length > 0) {
    fields.push({
      title: 'Files Created',
      value: data.filesCreated.length.toString(),
      short: true,
    });
  }

  if (data.filesModified && data.filesModified.length > 0) {
    fields.push({
      title: 'Files Modified',
      value: data.filesModified.length.toString(),
      short: true,
    });
  }

  if (data.errors && data.errors.length > 0) {
    fields.push({
      title: 'Errors',
      value: data.errors.slice(0, 3).join('\n'),
      short: false,
    });
  }

  const attachment: SlackAttachment = {
    color,
    title,
    fields,
    footer: 'Orchestra CLI',
    ts: Math.floor(Date.now() / 1000),
  };

  return sendSlackNotification(config.webhookUrl, text, [attachment], config);
}

/**
 * Send Orchestra notification to Discord
 */
export async function sendDiscordOrchestraNotification(
  config: DiscordConfig,
  data: OrchestraNotificationData
): Promise<{ success: boolean; error?: string }> {
  let content = '';

  switch (data.status) {
    case 'started':
      content = `🚀 **Orchestra task started:** ${data.task}`;
      break;
    case 'progress':
      content = `⏳ **Orchestra in progress:** ${data.task}`;
      break;
    case 'completed':
      content = `✅ **Orchestra task completed:** ${data.task}`;
      break;
    case 'failed':
      content = `❌ **Orchestra task failed:** ${data.task}`;
      break;
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: 'Task', value: data.task, inline: false },
  ];

  if (data.sessionId) {
    fields.push({ name: 'Session ID', value: data.sessionId, inline: true });
  }

  if (data.branch) {
    fields.push({ name: 'Branch', value: data.branch, inline: true });
  }

  if (data.duration !== undefined) {
    fields.push({
      name: 'Duration',
      value: `${(data.duration / 1000).toFixed(1)}s`,
      inline: true,
    });
  }

  if (data.filesCreated && data.filesCreated.length > 0) {
    fields.push({
      name: 'Files Created',
      value: data.filesCreated.length.toString(),
      inline: true,
    });
  }

  if (data.filesModified && data.filesModified.length > 0) {
    fields.push({
      name: 'Files Modified',
      value: data.filesModified.length.toString(),
      inline: true,
    });
  }

  if (data.errors && data.errors.length > 0) {
    fields.push({
      name: 'Errors',
      value: data.errors.slice(0, 3).join('\n'),
      inline: false,
    });
  }

  const embed: DiscordEmbed = {
    title: data.status === 'started' ? 'Orchestra Task Started' :
           data.status === 'progress' ? 'Orchestra Task Progress' :
           data.status === 'completed' ? 'Orchestra Task Completed' :
           'Orchestra Task Failed',
    color: getDiscordColor(data.status),
    fields,
    footer: { text: 'Orchestra CLI' },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordNotification(config.webhookUrl, content, [embed], config);
}

/**
 * Send notification to both Slack and Discord
 */
export async function sendNotification(
  config: NotificationConfig,
  data: OrchestraNotificationData
): Promise<{ slack: boolean; discord: boolean; errors: string[] }> {
  const results = {
    slack: false,
    discord: false,
    errors: [] as string[],
  };

  if (config.slack) {
    const result = await sendSlackOrchestraNotification(config.slack, data);
    results.slack = result.success;
    if (result.error) {
      results.errors.push(`Slack: ${result.error}`);
    }
  }

  if (config.discord) {
    const result = await sendDiscordOrchestraNotification(config.discord, data);
    results.discord = result.success;
    if (result.error) {
      results.errors.push(`Discord: ${result.error}`);
    }
  }

  return results;
}

/**
 * Create Slack config from environment variables
 */
export function createSlackConfigFromEnv(): SlackConfig | null {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return null;
  }

  return {
    webhookUrl,
    channel: process.env.SLACK_CHANNEL,
    username: process.env.SLACK_USERNAME || 'Orchestra',
    iconEmoji: process.env.SLACK_ICON_EMOJI || ':robot_face:',
  };
}

/**
 * Create Discord config from environment variables
 */
export function createDiscordConfigFromEnv(): DiscordConfig | null {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return null;
  }

  return {
    webhookUrl,
    username: process.env.DISCORD_USERNAME || 'Orchestra',
    avatarUrl: process.env.DISCORD_AVATAR_URL,
  };
}

/**
 * Create notification config from environment variables
 */
export function createNotificationConfigFromEnv(): NotificationConfig {
  const config: NotificationConfig = {};

  const slackConfig = createSlackConfigFromEnv();
  if (slackConfig) {
    config.slack = slackConfig;
  }

  const discordConfig = createDiscordConfigFromEnv();
  if (discordConfig) {
    config.discord = discordConfig;
  }

  return config;
}

/**
 * Test notification endpoints
 */
export async function testNotificationEndpoints(
  config: NotificationConfig
): Promise<{
  slack: { success: boolean; error?: string };
  discord: { success: boolean; error?: string };
}> {
  const results: any = {};

  if (config.slack) {
    const testData: OrchestraNotificationData = {
      task: 'Test notification',
      status: 'started',
    };
    results.slack = await sendSlackOrchestraNotification(config.slack, testData);
  } else {
    results.slack = { success: false, error: 'No Slack config provided' };
  }

  if (config.discord) {
    const testData: OrchestraNotificationData = {
      task: 'Test notification',
      status: 'started',
    };
    results.discord = await sendDiscordOrchestraNotification(config.discord, testData);
  } else {
    results.discord = { success: false, error: 'No Discord config provided' };
  }

  return results;
}

/**
 * Format files list for notification
 */
export function formatFilesList(
  files: string[],
  maxFiles = 5
): { count: number; preview: string } {
  if (files.length === 0) {
    return { count: 0, preview: 'None' };
  }

  const preview = files.slice(0, maxFiles).join('\n');
  const more = files.length > maxFiles ? `\n... and ${files.length - maxFiles} more` : '';

  return {
    count: files.length,
    preview: preview + more,
  };
}

/**
 * Create notification from Orchestra metrics
 */
export function createNotificationFromMetrics(
  task: string,
  metrics: {
    duration: number;
    filesCreated: string[];
    filesModified: string[];
    errors: string[];
    sessionId: string;
    status: 'completed' | 'failed';
  }
): OrchestraNotificationData {
  return {
    task,
    status: metrics.status,
    duration: metrics.duration,
    filesCreated: metrics.filesCreated,
    filesModified: metrics.filesModified,
    errors: metrics.errors,
    sessionId: metrics.sessionId,
  };
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string, platform: 'slack' | 'discord'): boolean {
  if (!url) return false;

  if (platform === 'slack') {
    return url.startsWith('https://hooks.slack.com/services/');
  }

  if (platform === 'discord') {
    return url.startsWith('https://discord.com/api/webhooks/') ||
           url.startsWith('https://ptb.discord.com/api/webhooks/');
  }

  return false;
}
