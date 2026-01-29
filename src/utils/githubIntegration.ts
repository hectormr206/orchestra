/**
 * GitHub Integration - Crear issues y PRs desde los resultados de Orchestra
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

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

/**
 * Verifica si gh CLI está disponible y autenticado
 */
export async function isGitHubAvailable(): Promise<boolean> {
  try {
    await execFileAsync('gh', ['auth', 'status']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene información del repositorio actual
 */
export async function getRepoInfo(): Promise<{ owner: string; repo: string } | null> {
  try {
    const { stdout } = await execFileAsync('gh', ['repo', 'view', '--json', 'owner,name']);
    const data = JSON.parse(stdout);
    return { owner: data.owner.login, repo: data.name };
  } catch {
    return null;
  }
}

/**
 * Crea un issue en GitHub
 */
export async function createIssue(issue: GitHubIssue): Promise<GitHubResult> {
  try {
    const args = ['issue', 'create', '--title', issue.title, '--body', issue.body];
    
    if (issue.labels && issue.labels.length > 0) {
      args.push('--label', issue.labels.join(','));
    }

    const { stdout } = await execFileAsync('gh', args);
    const url = stdout.trim();
    const numberMatch = url.match(/\/issues\/(\d+)$/);

    return {
      success: true,
      url,
      number: numberMatch ? parseInt(numberMatch[1], 10) : undefined,
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    return {
      success: false,
      error: error.stderr || error.message || 'Error creating issue',
    };
  }
}

/**
 * Crea un Pull Request en GitHub
 */
export async function createPullRequest(pr: GitHubPR): Promise<GitHubResult> {
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

    const { stdout } = await execFileAsync('gh', args);
    const url = stdout.trim();
    const numberMatch = url.match(/\/pull\/(\d+)$/);

    return {
      success: true,
      url,
      number: numberMatch ? parseInt(numberMatch[1], 10) : undefined,
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    return {
      success: false,
      error: error.stderr || error.message || 'Error creating PR',
    };
  }
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
