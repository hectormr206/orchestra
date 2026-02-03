/**
 * Integration CLI Commands - New commands for integrated features
 *
 * Adds:
 * - audit: Security scanning
 * - export: Export sessions
 * - recover: Session recovery
 * - ci: CI/CD integration
 * - jira: Jira integration
 * - notify: Notification management
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SecurityAuditor } from '../utils/securityAudit.js';
import { ExportManager } from '../utils/export.js';
import {
  getSessionRecoveryManager,
  initializeSessionRecovery,
} from '../utils/sessionRecovery.js';
import {
  detectCIPlatform,
  getCIConfig,
  setupCI,
  validateWorkflow,
  addOrchestraStep,
  listWorkflows,
} from '../utils/ciCdIntegration.js';
import { JiraClient, createIssueFromOrchestraResult } from '../utils/jiraIntegration.js';
import {
  createNotificationConfigFromEnv,
  sendNotification,
  testNotificationEndpoints,
} from '../utils/slackDiscordIntegration.js';
import { detectProject, type ProjectDetection } from '../utils/frameworkDetector.js';
import { PromptOptimizer } from '../utils/promptOptimizer.js';

/**
 * Register integration commands with CLI program
 */
export function registerIntegrationCommands(program: Command): void {
  // =========================================================================
  // COMANDO: audit - Security auditing
  // =========================================================================
  program
    .command('audit')
    .description('Run security audit on the project')
    .option('-d, --dependencies', 'Check for vulnerable dependencies')
    .option('-s, --secrets', 'Scan for leaked secrets and credentials')
    .option('-c, --code', 'Check code for security issues')
    .option('-o, --owasp', 'Check OWASP Top 10 compliance')
    .option('-f, --fail <level>', 'Fail if issues found (critical|high|medium|low)', 'high')
    .option('-F, --format <format>', 'Output format (text|markdown|json)', 'text')
    .action(async (options) => {
      const auditor = new SecurityAuditor({
        checkDependencies: options.dependencies ?? true,
        checkSecrets: options.secrets ?? true,
        checkCodeQuality: options.code ?? true,
        checkOWASP: options.owasp ?? true,
        failOnLevel: options.fail,
      });

      const spinner = ora('Running security audit...').start();

      try {
        const result = await auditor.audit();

        spinner.stop();

        if (options.format === 'markdown') {
          console.log(auditor.formatAsMarkdown(result));
        } else if (options.format === 'json') {
          console.log(JSON.stringify(result, null, 2));
        } else {
          // Text output
          console.log();
          console.log(chalk.bold('Security Audit Results'));
          console.log(chalk('═'.repeat(50)));
          console.log();
          console.log(`Security Score: ${result.score >= 80 ? chalk.green(result.score) : chalk.yellow(result.score)}/100`);
          console.log(`Status: ${result.passed ? chalk.green('✓ PASSED') : chalk.red('✗ FAILED')}`);
          console.log();
          console.log(chalk.bold('Issues:'));
          console.log(`  Critical: ${chalk.red(result.summary.critical)}`);
          console.log(`  High: ${chalk.yellow(result.summary.high)}`);
          console.log(`  Medium: ${chalk.hex('#FFA500')(result.summary.medium)}`);
          console.log(`  Low: ${chalk.blue(result.summary.low)}`);
          console.log(`  Info: ${chalk.gray(result.summary.info)}`);

          if (result.issues.length > 0) {
            console.log();
            console.log(chalk.bold('Top Issues:'));
            for (const issue of result.issues.slice(0, 5)) {
              const emoji = {
                critical: chalk.red('🔴'),
                high: chalk.yellow('🟠'),
                medium: chalk.hex('#FFA500')('🟡'),
                low: chalk.blue('🟢'),
                info: chalk.gray('⚪'),
              }[issue.severity];

              console.log(`  ${emoji} ${issue.title}`);
              if (issue.file) {
                console.log(chalk.gray(`     ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
              }
            }
          }
        }

        if (!result.passed) {
          process.exit(1);
        }
      } catch (error) {
        spinner.fail('Security audit failed');
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: recover - Session recovery
  // =========================================================================
  program
    .command('recover')
    .description('Recover crashed sessions')
    .argument('[session-id]', 'Session ID to recover (auto-detect if not specified)')
    .option('-l, --list', 'List all recovery points')
    .option('--clear', 'Clear all recovery points')
    .option('--clear-session <id>', 'Clear specific session recovery point')
    .action(async (sessionId, options) => {
      const recoveryManager = getSessionRecoveryManager();

      if (options.clear) {
        const spinner = ora('Clearing recovery points...').start();
        recoveryManager.clearAllRecoveryPoints();
        spinner.succeed('All recovery points cleared');
        return;
      }

      if (options.clearSession) {
        const spinner = ora('Clearing recovery point...').start();
        const success = recoveryManager.deleteRecoveryPoint(options.clearSession);
        if (success) {
          spinner.succeed(`Recovery point cleared: ${options.clearSession}`);
        } else {
          spinner.fail(`Recovery point not found: ${options.clearSession}`);
        }
        return;
      }

      if (options.list) {
        const points = recoveryManager.getAllRecoveryPoints();

        console.log();
        console.log(chalk.bold('Recovery Points:'));
        console.log();

        if (points.length === 0) {
          console.log(chalk.gray('No recovery points found'));
        } else {
          for (const point of points) {
            const age = Math.round((Date.now() - point.timestamp) / 1000);
            const statusColor: Record<string, any> = {
              completed: chalk.green,
              failed: chalk.red,
              in_progress: chalk.yellow,
              pending: chalk.gray,
            };
            const colorFn = statusColor[point.state.status] || chalk.gray;

            console.log(`  ${chalk.cyan(point.sessionId)}`);
            console.log(`    Status: ${colorFn(point.state.status)}`);
            console.log(`    Phase: ${point.phase}`);
            console.log(`    Age: ${age}s ago`);
            console.log(`    Files: ${point.filesModified.length}`);
            console.log();
          }
        }
        return;
      }

      // Auto-recover or specific session
      const spinner = ora('Recovering session...').start();

      try {
        if (sessionId) {
          const result = await recoveryManager.recoverSession(sessionId);

          if (result.success) {
            spinner.succeed(`Session recovered: ${result.filesRestored.length} files restored`);
          } else {
            spinner.fail('Recovery failed');
            result.errors.forEach(e => console.error(chalk.red(`  ✗ ${e}`)));
            process.exit(1);
          }
        } else {
          const results = await recoveryManager.autoRecover();

          if (results.length > 0) {
            spinner.succeed(`Recovered ${results.length} session(s)`);
            results.forEach(r => {
              if (r.success) {
                console.log(chalk.green(`  ✓ ${r.sessionId}: ${r.filesRestored.length} files`));
              } else {
                console.log(chalk.red(`  ✗ ${r.sessionId}: ${r.errors.join(', ')}`));
              }
            });
          } else {
            spinner.info('No sessions to recover');
          }
        }
      } catch (error) {
        spinner.fail('Recovery failed');
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: ci - CI/CD integration
  // =========================================================================
  program
    .command('ci')
    .description('CI/CD workflow management')
    .argument('[action]', 'Action to perform (setup|validate|list|add)')
    .option('-p, --platform <platform>', 'CI/CD platform (github|gitlab|jenkins)')
    .option('-n, --name <name>', 'Workflow name')
    .option('-w, --workflow <path>', 'Workflow file path')
    .action(async (action, options) => {
      if (!action) {
        console.log(chalk.bold('CI/CD Integration'));
        console.log();
        console.log('Actions:');
        console.log('  setup    - Set up CI/CD workflow for Orchestra');
        console.log('  validate - Validate existing workflow');
        console.log('  list     - List detected CI/CD configurations');
        console.log('  add      - Add Orchestra step to existing workflow');
        console.log();
        console.log('Examples:');
        console.log('  orchestra ci setup --platform github');
        console.log('  orchestra ci validate --workflow .github/workflows/orchestra.yml');
        console.log('  orchestra ci add --workflow .github/workflows/ci.yml');
        return;
      }

      try {
        switch (action) {
          case 'setup': {
            const platform = options.platform || detectCIPlatform();
            if (!platform) {
              console.error(chalk.red('No CI/CD platform detected'));
              process.exit(1);
            }

            const spinner = ora(`Setting up ${platform} workflow...`).start();
            const result = await setupCI(platform as any, options.name || 'orchestra');

            if (result.success) {
              spinner.succeed(`Workflow created: ${chalk.cyan(result.path)}`);
              console.log(chalk.gray('Commit and push this file to enable CI/CD'));
            } else {
              spinner.fail('Setup failed');
              console.error(chalk.red(result.error));
              process.exit(1);
            }
            break;
          }

          case 'validate': {
            if (!options.workflow) {
              console.error(chalk.red('Specify workflow with --workflow'));
              process.exit(1);
            }

            const platform = options.platform || detectCIPlatform();
            if (!platform) {
              console.error(chalk.red('Cannot detect platform, specify with --platform'));
              process.exit(1);
            }

            const validation = validateWorkflow(platform as any, options.workflow);

            if (validation.valid) {
              console.log(chalk.green(`✓ Workflow is valid`));
            } else {
              console.log(chalk.red(`✗ Workflow has errors:`));
              validation.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
              process.exit(1);
            }
            break;
          }

          case 'list': {
            const workflows = listWorkflows();

            console.log();
            console.log(chalk.bold('Detected CI/CD Configurations:'));
            console.log();

            if (workflows.length === 0) {
              console.log(chalk.gray('No CI/CD configurations detected'));
            } else {
              for (const workflow of workflows) {
                console.log(`  ${chalk.cyan(workflow.platform.toUpperCase())}`);
                console.log(`    Config: ${workflow.configPath}`);
                console.log(`    Workflows: ${workflow.workflowPaths.join(', ')}`);
                console.log();
              }
            }
            break;
          }

          case 'add': {
            if (!options.workflow) {
              console.error(chalk.red('Specify workflow with --workflow'));
              process.exit(1);
            }

            const platform = options.platform || detectCIPlatform();
            if (!platform) {
              console.error(chalk.red('Cannot detect platform, specify with --platform'));
              process.exit(1);
            }

            const spinner = ora('Adding Orchestra step...').start();
            const result = await addOrchestraStep(platform as any, options.workflow);

            if (result.success) {
              spinner.succeed('Orchestra step added to workflow');
            } else {
              spinner.fail('Failed to add step');
              console.error(chalk.red(result.error));
              process.exit(1);
            }
            break;
          }

          default:
            console.error(chalk.red(`Unknown action: ${action}`));
            process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: jira - Jira integration
  // =========================================================================
  program
    .command('jira')
    .description('Jira integration (requires JIRA_* env vars)')
    .argument('[action]', 'Action to perform (create|update|transition)')
    .option('-s, --summary <text>', 'Issue summary')
    .option('-d, --description <text>', 'Issue description')
    .option('-t, --type <type>', 'Issue type (default: Task)')
    .option('-p, --priority <priority>', 'Issue priority')
    .option('-i, --issue <key>', 'Issue key (for update/transition)')
    .option('--transition <transition>', 'Transition name')
    .action(async (action, options) => {
      const client = (await import('../utils/jiraIntegration.js')).createJiraClientFromEnv();

      if (!client) {
        console.error(chalk.red('Jira credentials not configured'));
        console.error(chalk.gray('Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY'));
        process.exit(1);
      }

      try {
        switch (action) {
          case 'create': {
            const summary = options.summary || await askQuestion('Summary: ');
            const description = options.description || '';

            const spinner = ora('Creating Jira issue...').start();
            const result = await client.createIssue({
              summary,
              description,
              issueType: options.type,
              priority: options.priority,
            });

            if (result.success && result.issue) {
              spinner.succeed(`Issue created: ${chalk.cyan(result.issue.key)}`);
              console.log(chalk.gray(result.issue.url));
            } else {
              spinner.fail('Failed to create issue');
              console.error(chalk.red(result.error));
              process.exit(1);
            }
            break;
          }

          case 'update': {
            if (!options.issue) {
              console.error(chalk.red('Specify issue key with --issue'));
              process.exit(1);
            }

            const spinner = ora('Updating issue...').start();
            const result = await client.updateIssue(options.issue, {
              summary: options.summary,
              description: options.description,
            });

            if (result.success) {
              spinner.succeed(`Issue updated: ${chalk.cyan(options.issue)}`);
            } else {
              spinner.fail('Failed to update issue');
              console.error(chalk.red(result.error));
              process.exit(1);
            }
            break;
          }

          case 'transition': {
            if (!options.issue) {
              console.error(chalk.red('Specify issue key with --issue'));
              process.exit(1);
            }
            if (!options.transition) {
              console.error(chalk.red('Specify transition with --transition'));
              process.exit(1);
            }

            const spinner = ora('Transitioning issue...').start();
            const result = await client.transitionIssue(options.issue, {
              transition: options.transition,
            });

            if (result.success) {
              spinner.succeed(`Issue transitioned: ${chalk.cyan(options.issue)} → ${options.transition}`);
            } else {
              spinner.fail('Failed to transition issue');
              console.error(chalk.red(result.error));
              process.exit(1);
            }
            break;
          }

          default:
            console.error(chalk.red(`Unknown action: ${action}`));
            process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: notify - Send notifications
  // =========================================================================
  program
    .command('notify')
    .description('Send test notification (requires SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL)')
    .option('-m, --message <text>', 'Notification message')
    .option('-s, --slack', 'Send to Slack only')
    .option('-d, --discord', 'Send to Discord only')
    .action(async (options) => {
      const notificationConfig = (await import('../utils/slackDiscordIntegration.js')).createNotificationConfigFromEnv();

      if (!notificationConfig.slack && !notificationConfig.discord) {
        console.error(chalk.red('No notification services configured'));
        console.error(chalk.gray('Set SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL'));
        process.exit(1);
      }

      const message = options.message || 'Test notification from Orchestra CLI';

      try {
        const spinner = ora('Sending notification...').start();

        // Filter to specific service if requested
        if (options.slack) {
          delete notificationConfig.discord;
        } else if (options.discord) {
          delete notificationConfig.slack;
        }

        const results = await testNotificationEndpoints(notificationConfig);

        spinner.stop();

        if (results.slack || results.discord) {
          console.log(chalk.green('✓ Notification sent'));

          if (results.slack && !results.slack.success) {
            console.log(chalk.yellow(`  Slack: ${results.slack.error}`));
          }
          if (results.discord && !results.discord.success) {
            console.log(chalk.yellow(`  Discord: ${results.discord.error}`));
          }
        } else {
          console.log(chalk.red('✗ Notification failed'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });

  // =========================================================================
  // COMANDO: detect - Detect project framework
  // =========================================================================
  program
    .command('detect')
    .description('Detect project framework and technology stack')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      const detection = detectProject();

      if (options.json) {
        console.log(JSON.stringify(detection, null, 2));
      } else {
        console.log();
        console.log(JSON.stringify(detection, null, 2));
      }
    });

  // =========================================================================
  // COMANDO: prompt-optimize - Optimize prompts
  // =========================================================================
  program
    .command('prompt-optimize')
    .description('Analyze and optimize prompts')
    .argument('[prompt]', 'Prompt to analyze (reads from stdin if not provided)')
    .option('-o, --optimize', 'Show optimized version')
    .option('-s, --score', 'Show quality score only')
    .action(async (prompt, options) => {
      const optimizer = new PromptOptimizer();

      // Read prompt from stdin if not provided
      if (!prompt) {
        prompt = await readStdin();
      }

      const analysis = optimizer.analyzePrompt(prompt);

      if (options.score) {
        console.log(analysis.score);
        return;
      }

      console.log(optimizer.formatAnalysis(analysis));

      if (options.optimize && analysis.optimizedPrompt !== prompt) {
        console.log();
        console.log(chalk.bold('Optimized Prompt:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(analysis.optimizedPrompt);
      }
    });
}

/**
 * Helper: Ask question
 */
async function askQuestion(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Helper: Read from stdin
 */
async function readStdin(): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  return new Promise((resolve) => {
    let data = '';
    rl.on('line', (line) => {
      data += line + '\n';
    });
    rl.on('close', () => {
      resolve(data.trim());
    });
  });
}
