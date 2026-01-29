/**
 * Git Integration - Auto-commit después de generación exitosa
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  hasChanges: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface CommitResult {
  success: boolean;
  commitHash?: string;
  message?: string;
  error?: string;
}

/**
 * Verifica si el directorio es un repositorio Git
 */
export async function isGitRepo(workingDir: string = process.cwd()): Promise<boolean> {
  try {
    await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: workingDir });
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el estado actual del repositorio
 */
export async function getGitStatus(workingDir: string = process.cwd()): Promise<GitStatus> {
  const isRepo = await isGitRepo(workingDir);

  if (!isRepo) {
    return {
      isRepo: false,
      branch: '',
      hasChanges: false,
      staged: [],
      unstaged: [],
      untracked: [],
    };
  }

  try {
    // Get current branch
    const { stdout: branchOutput } = await execFileAsync(
      'git', ['branch', '--show-current'],
      { cwd: workingDir }
    );
    const branch = branchOutput.trim();

    // Get status
    const { stdout: statusOutput } = await execFileAsync(
      'git', ['status', '--porcelain'],
      { cwd: workingDir }
    );

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    for (const line of statusOutput.split('\n').filter(l => l.trim())) {
      const indexStatus = line[0];
      const worktreeStatus = line[1];
      const filePath = line.slice(3);

      if (indexStatus === '?' && worktreeStatus === '?') {
        untracked.push(filePath);
      } else if (indexStatus !== ' ' && indexStatus !== '?') {
        staged.push(filePath);
      }
      if (worktreeStatus !== ' ' && worktreeStatus !== '?') {
        unstaged.push(filePath);
      }
    }

    return {
      isRepo: true,
      branch,
      hasChanges: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
      staged,
      unstaged,
      untracked,
    };
  } catch (error) {
    return {
      isRepo: true,
      branch: 'unknown',
      hasChanges: false,
      staged: [],
      unstaged: [],
      untracked: [],
    };
  }
}

/**
 * Agrega archivos al staging area
 */
export async function stageFiles(
  files: string[],
  workingDir: string = process.cwd()
): Promise<boolean> {
  if (files.length === 0) return true;

  try {
    await execFileAsync('git', ['add', ...files], { cwd: workingDir });
    return true;
  } catch (error) {
    console.error('Error staging files:', error);
    return false;
  }
}

/**
 * Crea un commit con los cambios staged
 */
export async function createCommit(
  message: string,
  workingDir: string = process.cwd()
): Promise<CommitResult> {
  try {
    // Check if there are staged changes
    const { stdout: diffOutput } = await execFileAsync(
      'git', ['diff', '--cached', '--name-only'],
      { cwd: workingDir }
    );

    if (!diffOutput.trim()) {
      return {
        success: false,
        error: 'No hay cambios staged para commit',
      };
    }

    // Create commit
    const { stdout } = await execFileAsync(
      'git', ['commit', '-m', message],
      { cwd: workingDir }
    );

    // Extract commit hash
    const hashMatch = stdout.match(/\[[\w\-/]+ ([a-f0-9]+)\]/);
    const commitHash = hashMatch ? hashMatch[1] : undefined;

    return {
      success: true,
      commitHash,
      message,
    };
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    return {
      success: false,
      error: err.stderr || err.message || 'Error creating commit',
    };
  }
}

/**
 * Genera un mensaje de commit basado en la tarea y archivos
 */
export function generateCommitMessage(
  task: string,
  files: string[],
  template?: string
): string {
  // Default template
  const defaultTemplate = 'feat(orchestra): {{task}}\n\nGenerated files:\n{{files}}\n\nCo-Authored-By: Orchestra AI <noreply@orchestra.ai>';

  const messageTemplate = template || defaultTemplate;

  // Extract first line of task as summary
  const taskSummary = task.split('\n')[0].slice(0, 50);

  // Format files list
  const filesList = files.map(f => `- ${f}`).join('\n');

  // Replace placeholders
  let message = messageTemplate
    .replace(/\{\{task\}\}/g, taskSummary)
    .replace(/\{\{files\}\}/g, filesList);

  return message;
}

/**
 * Auto-commit de archivos generados
 */
export async function autoCommit(
  task: string,
  files: string[],
  workingDir: string = process.cwd(),
  messageTemplate?: string
): Promise<CommitResult> {
  // Check if it's a git repo
  if (!(await isGitRepo(workingDir))) {
    return {
      success: false,
      error: 'Not a git repository',
    };
  }

  // Filter to only existing files
  const existingFiles = files.filter(f => existsSync(path.join(workingDir, f)));

  if (existingFiles.length === 0) {
    return {
      success: false,
      error: 'No files to commit',
    };
  }

  // Stage files
  const staged = await stageFiles(existingFiles, workingDir);
  if (!staged) {
    return {
      success: false,
      error: 'Failed to stage files',
    };
  }

  // Generate commit message
  const message = generateCommitMessage(task, existingFiles, messageTemplate);

  // Create commit
  return createCommit(message, workingDir);
}

/**
 * Verifica si hay conflictos pendientes
 */
export async function hasConflicts(workingDir: string = process.cwd()): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'git', ['diff', '--name-only', '--diff-filter=U'],
      { cwd: workingDir }
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Obtiene el último commit hash
 */
export async function getLastCommitHash(workingDir: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      'git', ['rev-parse', 'HEAD'],
      { cwd: workingDir }
    );
    return stdout.trim();
  } catch {
    return null;
  }
}
