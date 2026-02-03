/**
 * Session Recovery - Automatic session recovery after crashes
 *
 * Provides:
 * - Crash detection
 * - Session state restoration
 * - Automatic recovery on restart
 * - Recovery point creation
 * - Rollback on failed recovery
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';

export interface RecoveryPoint {
  sessionId: string;
  timestamp: number;
  phase: string;
  state: any;
  filesModified: string[];
  checkpoints: CheckpointData[];
  metadata?: Record<string, any>;
}

export interface CheckpointData {
  filePath: string;
  content: string;
  hash: string;
  timestamp: number;
}

export interface RecoveryResult {
  success: boolean;
  sessionId: string;
  restored: boolean;
  filesRestored: string[];
  errors: string[];
}

export interface RecoveryOptions {
  autoRecover?: boolean;
  maxRecoveryPoints?: number;
  recoveryTimeout?: number;
  validateOnRestore?: boolean;
}

/**
 * Session Recovery Manager
 */
export class SessionRecoveryManager {
  private recoveryDir: string;
  private activeRecoveryPoints: Map<string, RecoveryPoint> = new Map();
  private options: Required<RecoveryOptions>;

  constructor(
    orchestraDir: string = '.orchestra',
    options: RecoveryOptions = {}
  ) {
    this.recoveryDir = path.join(orchestraDir, 'recovery');
    this.options = {
      autoRecover: options.autoRecover ?? true,
      maxRecoveryPoints: options.maxRecoveryPoints ?? 10,
      recoveryTimeout: options.recoveryTimeout ?? 300000, // 5 minutes
      validateOnRestore: options.validateOnRestore ?? true,
    };

    // Ensure recovery directory exists
    if (!existsSync(this.recoveryDir)) {
      mkdirSync(this.recoveryDir, { recursive: true });
    }
  }

  /**
   * Create a recovery point
   */
  createRecoveryPoint(
    sessionId: string,
    phase: string,
    state: any,
    filesModified: string[],
    checkpoints: CheckpointData[] = []
  ): RecoveryPoint {
    const recoveryPoint: RecoveryPoint = {
      sessionId,
      timestamp: Date.now(),
      phase,
      state,
      filesModified,
      checkpoints,
    };

    // Store in memory
    this.activeRecoveryPoints.set(sessionId, recoveryPoint);

    // Persist to disk
    this.persistRecoveryPoint(recoveryPoint);

    // Cleanup old recovery points
    this.cleanupOldRecoveryPoints();

    return recoveryPoint;
  }

  /**
   * Update recovery point for a session
   */
  updateRecoveryPoint(
    sessionId: string,
    updates: Partial<Omit<RecoveryPoint, 'sessionId' | 'timestamp'>>
  ): void {
    const existing = this.activeRecoveryPoints.get(sessionId);
    if (!existing) {
      return;
    }

    const updated: RecoveryPoint = {
      ...existing,
      ...updates,
    };

    this.activeRecoveryPoints.set(sessionId, updated);
    this.persistRecoveryPoint(updated);
  }

  /**
   * Persist recovery point to disk
   */
  private persistRecoveryPoint(point: RecoveryPoint): void {
    const filePath = this.getRecoveryFilePath(point.sessionId);
    const content = JSON.stringify(point, null, 2);
    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Get recovery point file path
   */
  private getRecoveryFilePath(sessionId: string): string {
    return path.join(this.recoveryDir, `${sessionId}.json`);
  }

  /**
   * Load recovery point from disk
   */
  loadRecoveryPoint(sessionId: string): RecoveryPoint | null {
    // Check memory first
    if (this.activeRecoveryPoints.has(sessionId)) {
      return this.activeRecoveryPoints.get(sessionId)!;
    }

    // Load from disk
    const filePath = this.getRecoveryFilePath(sessionId);
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const point = JSON.parse(content) as RecoveryPoint;

      // Cache in memory
      this.activeRecoveryPoints.set(sessionId, point);

      return point;
    } catch (error) {
      console.error(`Failed to load recovery point for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get all recovery points
   */
  getAllRecoveryPoints(): RecoveryPoint[] {
    const points: RecoveryPoint[] = [];

    const files = require('fs').readdirSync(this.recoveryDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(this.recoveryDir, file);
          const content = readFileSync(filePath, 'utf-8');
          const point = JSON.parse(content) as RecoveryPoint;
          points.push(point);
        } catch {
          // Skip invalid files
        }
      }
    }

    return points.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Recover a session
   */
  async recoverSession(sessionId: string): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      sessionId,
      restored: false,
      filesRestored: [],
      errors: [],
    };

    // Load recovery point
    const recoveryPoint = this.loadRecoveryPoint(sessionId);
    if (!recoveryPoint) {
      result.errors.push('No recovery point found for session');
      return result;
    }

    // Check if recovery is too old
    const age = Date.now() - recoveryPoint.timestamp;
    if (age > this.options.recoveryTimeout) {
      result.errors.push(`Recovery point is too old (${Math.round(age / 1000)}s)`);
      return result;
    }

    // Validate recovery point
    if (this.options.validateOnRestore) {
      const validation = this.validateRecoveryPoint(recoveryPoint);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        return result;
      }
    }

    // Restore files from checkpoints
    for (const checkpoint of recoveryPoint.checkpoints) {
      try {
        // Validate hash if content exists
        if (checkpoint.content) {
          const hash = this.calculateHash(checkpoint.content);
          if (hash !== checkpoint.hash) {
            result.errors.push(`Hash mismatch for ${checkpoint.filePath}`);
            continue;
          }
        }

        // Restore file
        if (checkpoint.content) {
          const dir = path.dirname(checkpoint.filePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(checkpoint.filePath, checkpoint.content, 'utf-8');
        }

        result.filesRestored.push(checkpoint.filePath);
      } catch (error) {
        result.errors.push(
          `Failed to restore ${checkpoint.filePath}: ${error}`
        );
      }
    }

    // Set restored state
    result.restored = result.filesRestored.length > 0;
    result.success = result.errors.length === 0;

    return result;
  }

  /**
   * Validate recovery point
   */
  private validateRecoveryPoint(point: RecoveryPoint): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!point.sessionId) {
      errors.push('Missing sessionId');
    }

    if (!point.phase) {
      errors.push('Missing phase');
    }

    if (!point.state) {
      errors.push('Missing state');
    }

    // Validate checkpoints
    for (const checkpoint of point.checkpoints) {
      if (!checkpoint.filePath) {
        errors.push('Checkpoint missing filePath');
      }

      if (checkpoint.content && checkpoint.hash) {
        const hash = this.calculateHash(checkpoint.content);
        if (hash !== checkpoint.hash) {
          errors.push(`Checkpoint hash mismatch for ${checkpoint.filePath}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate hash of content
   */
  private calculateHash(content: string): string {
    // Simple hash function (in production, use crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Delete recovery point
   */
  deleteRecoveryPoint(sessionId: string): boolean {
    this.activeRecoveryPoints.delete(sessionId);

    const filePath = this.getRecoveryFilePath(sessionId);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Cleanup old recovery points
   */
  private cleanupOldRecoveryPoints(): void {
    const points = this.getAllRecoveryPoints();

    if (points.length > this.options.maxRecoveryPoints) {
      // Delete oldest points
      const toDelete = points.slice(this.options.maxRecoveryPoints);
      for (const point of toDelete) {
        this.deleteRecoveryPoint(point.sessionId);
      }
    }
  }

  /**
   * Clear all recovery points
   */
  clearAllRecoveryPoints(): void {
    this.activeRecoveryPoints.clear();

    const files = require('fs').readdirSync(this.recoveryDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(this.recoveryDir, file);
          unlinkSync(filePath);
        } catch {
          // Skip
        }
      }
    }
  }

  /**
   * Check for crash recovery needed
   */
  async checkCrashRecovery(): Promise<RecoveryPoint[]> {
    const points = this.getAllRecoveryPoints();

    // Filter for recent sessions that might have crashed
    const recent = points.filter(p => {
      const age = Date.now() - p.timestamp;
      return age < 3600000 && // Less than 1 hour old
             (p.phase === 'in_progress' || p.phase === 'pending');
    });

    return recent;
  }

  /**
   * Auto-recover sessions
   */
  async autoRecover(): Promise<RecoveryResult[]> {
    const results: RecoveryResult[] = [];

    if (!this.options.autoRecover) {
      return results;
    }

    const crashedSessions = await this.checkCrashRecovery();

    for (const session of crashedSessions) {
      const result = await this.recoverSession(session.sessionId);
      results.push(result);
    }

    return results;
  }
}

/**
 * Create checkpoint for a file
 */
export function createCheckpoint(filePath: string): CheckpointData | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const hash = calculateSimpleHash(content);

    return {
      filePath,
      content,
      hash,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Calculate simple hash
 */
function calculateSimpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Get session recovery manager
 */
let recoveryManagerInstance: SessionRecoveryManager | null = null;

export function getSessionRecoveryManager(
  orchestraDir?: string,
  options?: RecoveryOptions
): SessionRecoveryManager {
  if (!recoveryManagerInstance) {
    recoveryManagerInstance = new SessionRecoveryManager(orchestraDir, options);
  }
  return recoveryManagerInstance;
}

/**
 * Initialize session recovery on startup
 */
export async function initializeSessionRecovery(
  orchestraDir?: string,
  options?: RecoveryOptions
): Promise<RecoveryResult[]> {
  const manager = getSessionRecoveryManager(orchestraDir, options);
  return await manager.autoRecover();
}
