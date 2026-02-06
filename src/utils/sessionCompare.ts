/**
 * Session Comparison - Compare two sessions for differences
 */

import type { SessionData } from './sessionExport.js';
import { SessionHistory } from './sessionHistory.js';

export interface ComparisonResult {
  sessionA: SessionData;
  sessionB: SessionData;
  planDiff: DiffLine[];
  fileDifferences: FileDiff[];
  metricsDelta: MetricsDelta;
  success: boolean;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export interface FileDiff {
  path: string;
  inA: boolean;
  inB: boolean;
  statusChanged: boolean;
  oldStatus?: string;
  newStatus?: string;
}

export interface MetricsDelta {
  durationDelta: number;
  durationPercent: number;
  iterationsDelta: number;
  filesCreatedDelta: number;
}

/**
 * Compare two sessions
 */
export async function compareSessions(
  sessionAId: string,
  sessionBId: string
): Promise<ComparisonResult> {
  const history = new SessionHistory();
  await history.init();

  const sessionA = await history.getFullSession(sessionAId);
  const sessionB = await history.getFullSession(sessionBId);

  if (!sessionA || !sessionB) {
    throw new Error('One or both sessions not found');
  }

  // Generate plan diff
  const planDiff = generateSimpleDiff(sessionA.plan || '', sessionB.plan || '');

  // Compare files
  const fileDifferences = compareFiles(sessionA.files, sessionB.files);

  // Calculate metrics delta
  const metricsDelta = compareMetrics(sessionA, sessionB);

  return {
    sessionA,
    sessionB,
    planDiff,
    fileDifferences,
    metricsDelta,
    success: true
  };
}

/**
 * Generate simple line-by-line diff
 */
function generateSimpleDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const diff: DiffLine[] = [];

  // Simple LCS-based diff algorithm
  const lcs = longestCommonSubsequence(linesA, linesB);

  let i = 0, j = 0;
  for (const line of lcs) {
    // Add removed lines
    while (i < linesA.length && linesA[i] !== line) {
      diff.push({ type: 'removed', content: linesA[i], lineNumber: i + 1 });
      i++;
    }

    // Add added lines
    while (j < linesB.length && linesB[j] !== line) {
      diff.push({ type: 'added', content: linesB[j], lineNumber: j + 1 });
      j++;
    }

    // Add common line
    if (i < linesA.length && j < linesB.length) {
      diff.push({ type: 'unchanged', content: line });
      i++;
      j++;
    }
  }

  // Add remaining lines
  while (i < linesA.length) {
    diff.push({ type: 'removed', content: linesA[i], lineNumber: i + 1 });
    i++;
  }
  while (j < linesB.length) {
    diff.push({ type: 'added', content: linesB[j], lineNumber: j + 1 });
    j++;
  }

  return diff;
}

/**
 * Longest Common Subsequence algorithm
 */
function longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Compare files between sessions
 */
function compareFiles(filesA: any[], filesB: any[]): FileDiff[] {
  const pathsA = new Set(filesA.map(f => f.path));
  const pathsB = new Set(filesB.map(f => f.path));
  const allPaths = new Set([...pathsA, ...pathsB]);

  const diffs: FileDiff[] = [];
  for (const path of allPaths) {
    const fileA = filesA.find(f => f.path === path);
    const fileB = filesB.find(f => f.path === path);

    diffs.push({
      path,
      inA: !!fileA,
      inB: !!fileB,
      statusChanged: fileA && fileB && fileA.status !== fileB.status,
      oldStatus: fileA?.status,
      newStatus: fileB?.status
    });
  }

  return diffs;
}

/**
 * Compare metrics between sessions
 */
function compareMetrics(sessionA: SessionData, sessionB: SessionData): MetricsDelta {
  const durationA = sessionA.metrics?.totalDuration || 0;
  const durationB = sessionB.metrics?.totalDuration || 0;
  const durationDelta = durationB - durationA;
  const durationPercent = durationA > 0 ? (durationDelta / durationA) * 100 : 0;

  const iterationsA = sessionA.metrics?.iterations || 0;
  const iterationsB = sessionB.metrics?.iterations || 0;

  const filesA = sessionA.files.filter(f => f.status === 'created').length;
  const filesB = sessionB.files.filter(f => f.status === 'created').length;

  return {
    durationDelta,
    durationPercent,
    iterationsDelta: iterationsB - iterationsA,
    filesCreatedDelta: filesB - filesA
  };
}

/**
 * Format diff as unified diff string
 */
export function formatUnifiedDiff(diff: DiffLine[]): string {
  const lines: string[] = [];

  for (const line of diff) {
    const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
    lines.push(`${prefix} ${line.content}`);
  }

  return lines.join('\n');
}
