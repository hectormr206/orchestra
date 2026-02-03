/**
 * GitHub Integration - Crear issues y PRs desde los resultados de Orchestra
 *
 * Mejoras de hardening:
 * - Reintentos con backoff exponencial
 * - Validación robusta de datos
 * - Soporte para organizaciones
 * - Batch operations
 * - Timeout configurables
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execFileAsync = promisify(execFile);

export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
}

export interface GitHubPR {
  title: string;
  body: string;
  branch: string;
  baseBranch?: string;
  draft?: boolean;
}

export interface GitHubResult {
  success: boolean;
  url?: string;
  number?: number;
  error?: string;
}

export interface GitHubOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateUrls?: boolean;
  dryRun?: boolean;
}

const DEFAULT_OPTIONS: Required<Pick<GitHubOptions, 'timeout' | 'retries' | 'retryDelay' | 'validateUrls'>> & { dryRun: boolean } = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  validateUrls: true,
  dryRun: false,
};

/**
 * Sleep con promesa
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Valida título de issue
 */
function validateIssueTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (title.length > 256) {
    return { valid: false, error: 'Title must be 256 characters or less' };
  }

  // Check for potentially dangerous characters
  const dangerousChars = /[<>{}|\x00-\x1f]/;
  if (dangerousChars.test(title)) {
    return { valid: false, error: 'Title contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Valida cuerpo de issue/PR
 */
function validateBody(body: string): { valid: boolean; error?: string } {
  if (body.length > 65536) {
    return { valid: false, error: 'Body must be 65536 characters or less' };
  }

  return { valid: true };
}

/**
 * Valida labels
 */
function validateLabels(labels: string[]): { valid: boolean; error?: string } {
  if (labels.length > 100) {
    return { valid: false, error: 'Cannot add more than 100 labels' };
  }

  for (const label of labels) {
    if (label.length > 57) {
      return { valid: false, error: `Label "${label}" exceeds 57 character limit` };
    }

    // Label can only contain alphanumeric, -, _, and .
    if (!/^[a-zA-Z0-9._-]+$/.test(label)) {
      return { valid: false, error: `Label "${label}" contains invalid characters` };
    }
  }

  return { valid: true };
}

/**
 * Ejecuta comando gh con timeout y reintentos
 */
async function execWithRetry(
  args: string[],
  options: GitHubOptions
): Promise<{ stdout: string; stderr: string }> {
  let lastError: any;

  for (let attempt = 0; attempt < options.retries!; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<{ stdout: string; stderr: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Command timeout')), options.timeout);
      });

      // Execute command
      const execPromise = execFileAsync('gh', args);

      // Race between timeout and execution
      const result = await Promise.race([timeoutPromise, execPromise]);

      return result;
    } catch (err) {
      lastError = err;

      // If it's not a timeout or we're out of retries, throw
      const isTimeout = err instanceof Error && err.message === 'Command timeout';
      if (!isTimeout || attempt >= options.retries! - 1) {
        throw err;
      }

      // Wait before retry with exponential backoff
      const delay = getBackoffDelay(attempt, options.retryDelay!);
      console.warn(`  GitHub API failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${options.retries})`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Verifica si gh CLI está disponible y autenticado con timeout
 */
export async function isGitHubAvailable(options: GitHubOptions = {}): Promise<boolean> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    await execWithRetry(['auth', 'status'], opts);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene información del repositorio con reintentos
 */
export async function getRepoInfo(options: GitHubOptions = {}): Promise<{ owner: string; repo: string; isOrg?: boolean } | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const { stdout } = await execWithRetry(['repo', 'view', '--json', 'owner,name', 'owner,type'], opts);
    const data = JSON.parse(stdout);

    return {
      owner: data.owner.login,
      repo: data.name,
      isOrg: data.owner.type === 'Organization',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Crea un issue en GitHub con validación y reintentos
 */
export async function createIssue(
  issue: GitHubIssue,
  options: GitHubOptions = {}
): Promise<GitHubResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Dry run mode
  if (opts.dryRun) {
    console.log(chalk.yellow('[DRY RUN] Would create issue:'));
    console.log(chalk.gray(`  Title: ${issue.title}`));
    console.log(chalk.gray(`  Labels: ${issue.labels?.join(', ') || 'none'}`));
    return {
      success: true,
      url: 'https://github.com/mock/issues/0',
    };
  }

  // Validate inputs
  const titleValidation = validateIssueTitle(issue.title);
  if (!titleValidation.valid) {
    return {
      success: false,
      error: titleValidation.error,
    };
  }

  const bodyValidation = validateBody(issue.body);
  if (!bodyValidation.valid) {
    return {
      success: false,
      error: bodyValidation.error,
    };
  }

  if (issue.labels) {
    const labelsValidation = validateLabels(issue.labels);
    if (!labelsValidation.valid) {
      return {
        success: false,
        error: labelsValidation.error,
      };
    }
  }

  try {
    const args = ['issue', 'create', '--title', issue.title, '--body', issue.body];

    if (issue.labels && issue.labels.length > 0) {
      args.push('--label', issue.labels.join(','));
    }

    const { stdout } = await execWithRetry(args, opts);
    const url = stdout.trim();
    const numberMatch = url.match(/\/issues\/(\d+)$/);

    return {
      success: true,
      url,
      number: numberMatch ? parseInt(numberMatch[1], 10) : undefined,
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string; code?: string };

    // Provide helpful error messages based on error codes
    let errorMessage = error.stderr || error.message || 'Error creating issue';

    if (error.code === 'ENOTFOUND') {
      errorMessage = 'gh CLI not found. Install from https://cli.github.com/';
    } else if (errorMessage.includes('GraphQL')) {
      errorMessage = 'GitHub API error - check authentication';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Crea un Pull Request en GitHub con validación y reintentos
 */
export async function createPullRequest(
  pr: GitHubPR,
  options: GitHubOptions = {}
): Promise<GitHubResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Dry run mode
  if (opts.dryRun) {
    console.log(chalk.yellow('[DRY RUN] Would create PR:'));
    console.log(chalk.gray(`  Title: ${pr.title}`));
    console.log(chalk.gray(`  Branch: ${pr.branch}`));
    console.log(chalk.gray(`  Base: ${pr.baseBranch || 'default'}`));
    return {
      success: true,
      url: 'https://github.com/mock/pull/0',
    };
  }

  // Validate inputs
  const titleValidation = validateIssueTitle(pr.title);
  if (!titleValidation.valid) {
    return {
      success: false,
      error: titleValidation.error,
    };
  }

  const bodyValidation = validateBody(pr.body);
  if (!bodyValidation.valid) {
    return {
      success: false,
      error: bodyValidation.error,
    };
  }

  try {
    const args = [
      'pr', 'create',
      '--title', pr.title,
      '--body', pr.body,
      '--head', pr.branch,
    ];

    if (pr.baseBranch) {
      args.push('--base', pr.baseBranch);
    }

    if (pr.draft) {
      args.push('--draft');
    }

    const { stdout } = await execWithRetry(args, opts);
    const url = stdout.trim();
    const numberMatch = url.match(/\/pull\/(\d+)$/);

    return {
      success: true,
      url,
      number: numberMatch ? parseInt(numberMatch[1], 10) : undefined,
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string; code?: string };

    let errorMessage = error.stderr || error.message || 'Error creating PR';

    if (error.code === 'ENOTFOUND') {
      errorMessage = 'gh CLI not found. Install from https://cli.github.com/';
    } else if (errorMessage.includes('GraphQL')) {
      errorMessage = 'GitHub API error - check authentication and permissions';
    } else if (errorMessage.includes('Unprocessable')) {
      errorMessage = 'Invalid PR - check branch exists and permissions';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Crea múltiples issues en batch
 */
export async function createBatchIssues(
  issues: GitHubIssue[],
  options: GitHubOptions = {}
): Promise<GitHubResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: GitHubResult[] = [];

  for (let i = 0; i < issues.length; i++) {
    console.log(`Creating issue ${i + 1}/${issues.length}...`);

    const result = await createIssue(issues[i], opts);
    results.push(result);

    if (result.success) {
      console.log(chalk.green(`✓ Created: ${result.url}`));
    } else {
      console.log(chalk.red(`✗ Failed: ${result.error}`));
    }

    // Small delay between issues to avoid rate limiting
    if (i < issues.length - 1) {
      await sleep(500);
    }
  }

  return results;
}

/**
 * Crea múltiples PRs en batch
 */
export async function createBatchPRs(
  prs: GitHubPR[],
  options: GitHubOptions = {}
): Promise<GitHubResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: GitHubResult[] = [];

  for (let i = 0; i < prs.length; i++) {
    console.log(`Creating PR ${i + 1}/${prs.length}...`);

    // First create and push branch
    const branchCreated = await createBranch(prs[i].branch);
    if (!branchCreated) {
      results.push({
        success: false,
        error: `Failed to create branch: ${prs[i].branch}`,
      });
      continue;
    }

    const pushed = await pushBranch(prs[i].branch);
    if (!pushed) {
      results.push({
        success: false,
        error: `Failed to push branch: ${prs[i].branch}`,
      });
      continue;
    }

    const result = await createPullRequest(prs[i], opts);
    results.push(result);

    if (result.success) {
      console.log(chalk.green(`✓ Created: ${result.url}`));
    } else {
      console.log(chalk.red(`✗ Failed: ${result.error}`));
    }

    // Delay between PRs to avoid rate limiting
    if (i < prs.length - 1) {
      await sleep(1000);
    }
  }

  return results;
}

/**
 * Crea una rama y hace push
 */
export async function createBranch(branchName: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['checkout', '-b', branchName]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hace push de la rama actual
 */
export async function pushBranch(branchName: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['push', '-u', 'origin', branchName]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera un issue desde los resultados de auditoría
 */
export function generateIssueFromAudit(
  task: string,
  issues: Array<{ file: string; description: string; severity: string }>
): GitHubIssue {
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const majorCount = issues.filter(i => i.severity === 'major').length;
  const minorCount = issues.filter(i => i.severity === 'minor').length;

  const body = [
    '## Resumen',
    '',
    'Orchestra detectó problemas en la implementación generada.',
    '',
    '**Task:** ' + task,
    '',
    '## Estadísticas',
    '',
    '| Severidad | Cantidad |',
    '|-----------|----------|',
    '| Critical  | ' + criticalCount + ' |',
    '| Major     | ' + majorCount + ' |',
    '| Minor     | ' + minorCount + ' |',
    '',
    '## Issues Detectados',
    '',
  ];

  for (const issue of issues) {
    body.push('### ' + issue.file);
    body.push('');
    body.push('**Severidad:** ' + issue.severity);
    body.push('');
    body.push(issue.description);
    body.push('');
  }

  body.push('---');
  body.push('_Generado por Orchestra CLI_');

  const labels = ['orchestra', 'audit'];
  if (criticalCount > 0) labels.push('critical');

  return {
    title: '[Orchestra] Issues de auditoría: ' + task.substring(0, 50),
    body: body.join('\n'),
    labels,
  };
}

/**
 * Genera un PR desde los archivos generados
 */
export function generatePRFromTask(
  task: string,
  files: string[],
  branchName: string
): GitHubPR {
  const body = [
    '## Descripción',
    '',
    'Implementación generada por Orchestra CLI.',
    '',
    '**Task:** ' + task,
    '',
    '## Archivos Generados',
    '',
  ];

  for (const file of files) {
    body.push('- `' + file + '`');
  }

  body.push('');
  body.push('## Checklist',
    '',
    '- [ ] Revisar código generado',
    '- [ ] Verificar tests',
    '- [ ] Aprobar cambios',
    '',
    '---',
    '_Generado por Orchestra CLI_'
  );

  return {
    title: 'feat: ' + task.substring(0, 50),
    body: body.join('\n'),
    branch: branchName,
    draft: true,
  };
}
