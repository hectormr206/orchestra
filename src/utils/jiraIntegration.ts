/**
 * Jira Integration - Create and update Jira tickets
 *
 * Provides:
 * - Jira API client
 * - Issue creation and updating
 * - Status synchronization
 * - Comment management
 * - Attachment support
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execFileAsync = promisify(execFile);

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  defaultIssueType?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  issueType: string;
  assignee?: string;
  reporter?: string;
  priority?: string;
  labels?: string[];
  components?: string[];
  url?: string;
}

export interface JiraCreateOptions {
  summary: string;
  description?: string;
  issueType?: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  components?: string[];
}

export interface JiraTransitionOptions {
  transition: string;
  comment?: string;
}

export interface JiraResult {
  success: boolean;
  issue?: JiraIssue;
  error?: string;
}

/**
 * Jira API Client
 */
export class JiraClient {
  private config: JiraConfig;
  private apiUrl: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.apiUrl = `${config.baseUrl}/rest/api/3`;
  }

  /**
   * Make authenticated request to Jira API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const auth = Buffer.from(
      `${this.config.email}:${this.config.apiToken}`
    ).toString('base64');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error: ${response.status} ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get issue by key
   */
  async getIssue(key: string): Promise<JiraIssue> {
    const data = await this.request<any>(`/issue/${key}`);

    return {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description,
      status: data.fields.status.name,
      issueType: data.fields.issuetype.name,
      assignee: data.fields.assignee?.displayName,
      reporter: data.fields.reporter?.displayName,
      priority: data.fields.priority?.name,
      labels: data.fields.labels,
      components: data.fields.components?.map((c: any) => c.name),
      url: `${this.config.baseUrl}/browse/${data.key}`,
    };
  }

  /**
   * Create new issue
   */
  async createIssue(options: JiraCreateOptions): Promise<JiraResult> {
    try {
      const issueType = options.issueType || this.config.defaultIssueType || 'Task';

      const payload = {
        fields: {
          project: { key: this.config.projectKey },
          summary: options.summary,
          description: options.description
            ? {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: options.description,
                      },
                    ],
                  },
                ],
              }
            : undefined,
          issuetype: { name: issueType },
          ...(options.priority && { priority: { name: options.priority } }),
          ...(options.assignee && { assignee: { name: options.assignee } }),
          ...(options.labels && { labels: options.labels }),
          ...(options.components && {
            components: options.components.map(name => ({ name })),
          }),
        },
      };

      const data = await this.request<any>('/issue', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const issue = await this.getIssue(data.key);

      return {
        success: true,
        issue,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update issue
   */
  async updateIssue(
    key: string,
    updates: Partial<Pick<JiraCreateOptions, 'summary' | 'description' | 'priority' | 'assignee'>>
  ): Promise<JiraResult> {
    try {
      const payload: any = {};

      if (updates.summary) {
        payload.summary = updates.summary;
      }

      if (updates.description) {
        payload.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description,
                },
              ],
            },
          ],
        };
      }

      if (updates.priority) {
        payload.priority = { name: updates.priority };
      }

      if (updates.assignee) {
        payload.assignee = { name: updates.assignee };
      }

      await this.request(`/issue/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ fields: payload }),
      });

      const issue = await this.getIssue(key);

      return {
        success: true,
        issue,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Transition issue (change status)
   */
  async transitionIssue(key: string, options: JiraTransitionOptions): Promise<JiraResult> {
    try {
      // Get available transitions
      const transitionsData = await this.request<any>(`/issue/${key}/transitions`);
      const transition = transitionsData.transitions.find(
        (t: any) => t.name.toLowerCase() === options.transition.toLowerCase()
      );

      if (!transition) {
        return {
          success: false,
          error: `Transition "${options.transition}" not found. Available: ${transitionsData.transitions.map((t: any) => t.name).join(', ')}`,
        };
      }

      const payload: any = {
        transition: { id: transition.id },
      };

      if (options.comment) {
        payload.update = {
          comment: [
            {
              add: {
                body: {
                  type: 'doc',
                  version: 1,
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: options.comment,
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        };
      }

      await this.request(`/issue/${key}/transitions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const issue = await this.getIssue(key);

      return {
        success: true,
        issue,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(key: string, comment: string): Promise<JiraResult> {
    try {
      const payload = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      };

      await this.request(`/issue/${key}/comment`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const issue = await this.getIssue(key);

      return {
        success: true,
        issue,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Search issues with JQL
   */
  async searchIssues(jql: string, maxResults = 50): Promise<JiraIssue[]> {
    const data = await this.request<any>(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`
    );

    return data.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      issueType: issue.fields.issuetype.name,
      assignee: issue.fields.assignee?.displayName,
      reporter: issue.fields.reporter?.displayName,
      priority: issue.fields.priority?.name,
      labels: issue.fields.labels,
      components: issue.fields.components?.map((c: any) => c.name),
      url: `${this.config.baseUrl}/browse/${issue.key}`,
    }));
  }

  /**
   * Get project metadata
   */
  async getProject() {
    return this.request<any>(`/project/${this.config.projectKey}`);
  }

  /**
   * Get available issue types for project
   */
  async getIssueTypes(): Promise<Array<{ name: string; description: string }>> {
    const project = await this.getProject();
    return project.issueTypes.map((it: any) => ({
      name: it.name,
      description: it.description,
    }));
  }
}

/**
 * Create Jira client from environment variables
 */
export function createJiraClientFromEnv(): JiraClient | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    return null;
  }

  return new JiraClient({
    baseUrl,
    email,
    apiToken,
    projectKey,
    defaultIssueType: process.env.JIRA_DEFAULT_ISSUE_TYPE,
  });
}

/**
 * Create Jira issue from Orchestra task result
 */
export async function createIssueFromOrchestraResult(
  client: JiraClient,
  task: string,
  success: boolean,
  filesModified: string[],
  errors: string[] = []
): Promise<JiraResult> {
  const summary = success
    ? `[Orchestra] Completed: ${task.substring(0, 50)}`
    : `[Orchestra] Failed: ${task.substring(0, 50)}`;

  const description = `h3. Orchestra Task

*Task:* ${task}

h4. Result
${success ? '✓ Success' : '✗ Failed'}

h4. Files Modified
${filesModified.length > 0 ? filesModified.map(f => `* ${f}`).join('\n') : 'None'}

${errors.length > 0 ? `
h4. Errors
${errors.map(e => `* ${e}`).join('\n')}
` : ''}

h4. Details
Generated by Orchestra CLI on ${new Date().toISOString()}`;

  return client.createIssue({
    summary,
    description,
    labels: ['orchestra', success ? 'completed' : 'failed'],
  });
}

/**
 * Update Jira issue with Orchestra progress
 */
export async function updateIssueProgress(
  client: JiraClient,
  key: string,
  phase: string,
  progress: number
): Promise<JiraResult> {
  const comment = `h3. Orchestra Progress

*Phase:* ${phase}
*Progress:* ${progress}%

Updated on ${new Date().toISOString()}`;

  return client.addComment(key, comment);
}

/**
 * Close Jira issue when Orchestra completes successfully
 */
export async function closeIssueOnSuccess(
  client: JiraClient,
  key: string
): Promise<JiraResult> {
  return client.transitionIssue(key, {
    transition: 'Done',
    comment: 'Orchestra task completed successfully',
  });
}

/**
 * Verify Jira configuration
 */
export async function verifyJiraConfig(config: JiraConfig): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const client = new JiraClient(config);
    await client.getProject();

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate Jira issue summary for PRs
 */
export function generatePRIssueSummary(
  prTitle: string,
  prNumber: number,
  prUrl: string
): string {
  return `[PR] ${prTitle.substring(0, 40)} (#${prNumber})`;
}

/**
 * Format Orchestra session as Jira description
 */
export function formatSessionAsDescription(
  task: string,
  duration: number,
  filesCreated: string[],
  filesModified: string[]
): string {
  return `h3. Orchestra Session

*Task:* ${task}
*Duration:* ${(duration / 1000).toFixed(1)}s
*Completed:* ${new Date().toISOString()}

h4. Files Created (${filesCreated.length})
${filesCreated.map(f => `* ${f}`).join('\n') || 'None'}

h4. Files Modified (${filesModified.length})
${filesModified.map(f => `* ${f}`).join('\n') || 'None'}

---
_Generated by Orchestra CLI_`;
}
