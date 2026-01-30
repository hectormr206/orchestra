---
name: session-persistence
description: "Persistence patterns for long-running operations. Checkpoints, state recovery, session management, and concurrent access handling. Trigger: Long operations, resumable tasks, crash recovery, state persistence."
license: Apache-2.0
metadata:
  author: ai-core
  version: "1.0"
  scope: [root]
  auto_invoke: ["checkpoint", "resume", "session", "persistence", "recovery"]
  tags: [persistence, state, recovery, sessions, checkpoints]
---

# Session Persistence

Patterns for persisting state in long-running operations with recovery capabilities.

## When to Use

- Operations that may take hours or days to complete
- Tasks that should resume after interruption
- Multi-step workflows with checkpoints
- Systems that need crash recovery
- Concurrent access to shared state

## Critical Patterns

> **ALWAYS**:
>
> - Save checkpoints at logical boundaries, not time intervals
> - Include version info in persisted state
> - Validate state integrity before resuming
> - Implement file locking for concurrent access
> - Keep checkpoint files atomic (write-then-rename)

> **NEVER**:
>
> - Write directly to checkpoint files (use temp + rename)
> - Store sensitive data without encryption
> - Assume previous session state is valid
> - Leave orphaned checkpoint files
> - Skip cleanup of old sessions

---

## Checkpoint System

### Checkpoint Manager

```typescript
interface Checkpoint<T> {
  id: string;
  version: string;
  timestamp: Date;
  state: T;
  metadata: {
    step: number;
    totalSteps: number;
    description: string;
  };
  integrity: string; // SHA-256 hash
}

class CheckpointManager<T> {
  private baseDir: string;
  private sessionId: string;
  private version: string;

  constructor(options: {
    baseDir: string;
    sessionId: string;
    version: string;
  }) {
    this.baseDir = options.baseDir;
    this.sessionId = options.sessionId;
    this.version = options.version;
  }

  async save(state: T, metadata: Checkpoint<T>["metadata"]): Promise<string> {
    const checkpoint: Checkpoint<T> = {
      id: `${this.sessionId}-${Date.now()}`,
      version: this.version,
      timestamp: new Date(),
      state,
      metadata,
      integrity: "",
    };

    // Calculate integrity hash
    checkpoint.integrity = await this.calculateHash(checkpoint);

    // Atomic write: temp file then rename
    const checkpointPath = this.getCheckpointPath(checkpoint.id);
    const tempPath = `${checkpointPath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(checkpoint, null, 2));
    await fs.rename(tempPath, checkpointPath);

    // Clean old checkpoints (keep last 5)
    await this.cleanup(5);

    return checkpoint.id;
  }

  async load(checkpointId?: string): Promise<Checkpoint<T> | null> {
    const id = checkpointId || (await this.getLatestCheckpointId());
    if (!id) return null;

    const checkpointPath = this.getCheckpointPath(id);

    try {
      const content = await fs.readFile(checkpointPath, "utf-8");
      const checkpoint = JSON.parse(content) as Checkpoint<T>;

      // Validate integrity
      const expectedHash = checkpoint.integrity;
      checkpoint.integrity = "";
      const actualHash = await this.calculateHash(checkpoint);
      checkpoint.integrity = expectedHash;

      if (actualHash !== expectedHash) {
        throw new Error("Checkpoint integrity check failed");
      }

      // Version compatibility check
      if (!this.isCompatibleVersion(checkpoint.version)) {
        throw new Error(
          `Incompatible checkpoint version: ${checkpoint.version}`,
        );
      }

      return checkpoint;
    } catch (error) {
      console.error(`Failed to load checkpoint ${id}:`, error);
      return null;
    }
  }

  async getLatestCheckpointId(): Promise<string | null> {
    const checkpoints = await this.listCheckpoints();
    return checkpoints.length > 0 ? checkpoints[0].id : null;
  }

  async listCheckpoints(): Promise<{ id: string; timestamp: Date }[]> {
    const files = await fs.readdir(this.baseDir);
    const checkpoints = files
      .filter((f) => f.startsWith(this.sessionId) && f.endsWith(".json"))
      .map((f) => {
        const id = f.replace(".json", "");
        const timestamp = new Date(parseInt(id.split("-").pop()!));
        return { id, timestamp };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return checkpoints;
  }

  private async cleanup(keepCount: number): Promise<void> {
    const checkpoints = await this.listCheckpoints();
    const toDelete = checkpoints.slice(keepCount);

    for (const cp of toDelete) {
      await fs.unlink(this.getCheckpointPath(cp.id)).catch(() => {});
    }
  }

  private getCheckpointPath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }

  private async calculateHash(data: any): Promise<string> {
    const content = JSON.stringify(data);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(content),
    );
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private isCompatibleVersion(version: string): boolean {
    const [major] = version.split(".");
    const [currentMajor] = this.version.split(".");
    return major === currentMajor;
  }
}
```

---

## Session State Structure

### Session File Layout

```
sessions/
├── session-abc123/
│   ├── session.json           # Main session metadata
│   ├── state.json             # Current state
│   ├── checkpoints/
│   │   ├── cp-1706123456.json
│   │   ├── cp-1706123789.json
│   │   └── cp-1706124000.json
│   ├── logs/
│   │   └── session.log
│   └── artifacts/
│       ├── generated-file-1.ts
│       └── generated-file-2.ts
└── session-def456/
    └── ...
```

### Session Manager

```typescript
interface Session<T> {
  id: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "completed" | "failed" | "interrupted";
  config: SessionConfig;
  state: T;
}

interface SessionConfig {
  checkpointInterval: number; // Save every N operations
  maxAge: number; // Max session age in ms
  autoResume: boolean;
  encryption: boolean;
}

class SessionManager<T> {
  private sessionDir: string;
  private checkpointManager: CheckpointManager<T>;
  private lockManager: FileLockManager;
  private session: Session<T> | null = null;

  constructor(baseDir: string) {
    this.sessionDir = baseDir;
    this.lockManager = new FileLockManager();
  }

  async create(
    id: string,
    initialState: T,
    config: SessionConfig,
  ): Promise<Session<T>> {
    const sessionPath = path.join(this.sessionDir, id);
    await fs.mkdir(sessionPath, { recursive: true });
    await fs.mkdir(path.join(sessionPath, "checkpoints"), { recursive: true });
    await fs.mkdir(path.join(sessionPath, "logs"), { recursive: true });
    await fs.mkdir(path.join(sessionPath, "artifacts"), { recursive: true });

    const session: Session<T> = {
      id,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      config,
      state: initialState,
    };

    await this.saveSession(session);
    this.session = session;

    this.checkpointManager = new CheckpointManager({
      baseDir: path.join(sessionPath, "checkpoints"),
      sessionId: id,
      version: session.version,
    });

    return session;
  }

  async resume(id: string): Promise<Session<T> | null> {
    const sessionPath = path.join(this.sessionDir, id, "session.json");

    try {
      // Acquire lock
      await this.lockManager.acquire(sessionPath);

      const content = await fs.readFile(sessionPath, "utf-8");
      const session = JSON.parse(content) as Session<T>;

      // Check if session was interrupted
      if (session.status === "active") {
        // Try to load latest checkpoint
        this.checkpointManager = new CheckpointManager({
          baseDir: path.join(this.sessionDir, id, "checkpoints"),
          sessionId: id,
          version: session.version,
        });

        const checkpoint = await this.checkpointManager.load();
        if (checkpoint) {
          session.state = checkpoint.state;
          console.log(
            `Resumed from checkpoint: ${checkpoint.metadata.description}`,
          );
        }
      }

      session.status = "active";
      session.updatedAt = new Date();
      await this.saveSession(session);
      this.session = session;

      return session;
    } catch (error) {
      console.error(`Failed to resume session ${id}:`, error);
      return null;
    }
  }

  async updateState(state: Partial<T>): Promise<void> {
    if (!this.session) throw new Error("No active session");

    this.session.state = { ...this.session.state, ...state };
    this.session.updatedAt = new Date();
    await this.saveSession(this.session);
  }

  async checkpoint(description: string): Promise<string> {
    if (!this.session) throw new Error("No active session");

    return await this.checkpointManager.save(this.session.state, {
      step: 0, // Set by caller
      totalSteps: 0,
      description,
    });
  }

  async complete(): Promise<void> {
    if (!this.session) return;

    this.session.status = "completed";
    this.session.updatedAt = new Date();
    await this.saveSession(this.session);
    await this.lockManager.release(
      path.join(this.sessionDir, this.session.id, "session.json"),
    );
  }

  async fail(error: Error): Promise<void> {
    if (!this.session) return;

    this.session.status = "failed";
    this.session.updatedAt = new Date();
    await this.saveSession(this.session);

    // Log error
    const logPath = path.join(
      this.sessionDir,
      this.session.id,
      "logs",
      "error.json",
    );
    await fs.writeFile(
      logPath,
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
          timestamp: new Date(),
        },
        null,
        2,
      ),
    );
  }

  private async saveSession(session: Session<T>): Promise<void> {
    const sessionPath = path.join(this.sessionDir, session.id, "session.json");
    const tempPath = `${sessionPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(session, null, 2));
    await fs.rename(tempPath, sessionPath);
  }
}
```

---

## Recovery Patterns

### Automatic Recovery Mode

```typescript
interface RecoveryConfig {
  maxRecoveryAttempts: number;
  recoveryCheckpointAge: number; // Max age of checkpoint to use (ms)
  onRecoveryStart?: (session: Session<any>) => void;
  onRecoverySuccess?: (
    session: Session<any>,
    checkpoint: Checkpoint<any>,
  ) => void;
  onRecoveryFail?: (session: Session<any>, error: Error) => void;
}

async function attemptRecovery<T>(
  sessionManager: SessionManager<T>,
  sessionId: string,
  config: RecoveryConfig,
): Promise<{ success: boolean; session: Session<T> | null }> {
  for (let attempt = 0; attempt < config.maxRecoveryAttempts; attempt++) {
    console.log(
      `Recovery attempt ${attempt + 1}/${config.maxRecoveryAttempts}`,
    );

    try {
      const session = await sessionManager.resume(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      config.onRecoveryStart?.(session);

      // Validate session state
      if (!isValidState(session.state)) {
        throw new Error("Invalid session state");
      }

      config.onRecoverySuccess?.(session, {} as any);
      return { success: true, session };
    } catch (error) {
      console.error(`Recovery attempt ${attempt + 1} failed:`, error);

      if (attempt === config.maxRecoveryAttempts - 1) {
        config.onRecoveryFail?.(null as any, error as Error);
      }

      // Wait before retry
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  return { success: false, session: null };
}
```

### Corruption Detection

```typescript
interface CorruptionCheck {
  valid: boolean;
  issues: string[];
  recoverable: boolean;
}

async function checkSessionCorruption<T>(
  sessionPath: string,
): Promise<CorruptionCheck> {
  const issues: string[] = [];

  // Check session.json exists and is valid JSON
  const sessionFile = path.join(sessionPath, "session.json");
  try {
    const content = await fs.readFile(sessionFile, "utf-8");
    JSON.parse(content);
  } catch (error) {
    issues.push(`Invalid session.json: ${error}`);
  }

  // Check for orphaned lock files
  const lockFile = `${sessionFile}.lock`;
  try {
    const lockStats = await fs.stat(lockFile);
    const lockAge = Date.now() - lockStats.mtime.getTime();
    if (lockAge > 3600000) {
      // 1 hour
      issues.push("Stale lock file detected");
    }
  } catch {
    // No lock file, OK
  }

  // Check checkpoints integrity
  const checkpointsDir = path.join(sessionPath, "checkpoints");
  try {
    const files = await fs.readdir(checkpointsDir);
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      try {
        const content = await fs.readFile(
          path.join(checkpointsDir, file),
          "utf-8",
        );
        JSON.parse(content);
      } catch {
        issues.push(`Corrupted checkpoint: ${file}`);
      }
    }
  } catch {
    issues.push("Checkpoints directory missing");
  }

  return {
    valid: issues.length === 0,
    issues,
    recoverable: !issues.some((i) => i.includes("Invalid session.json")),
  };
}
```

---

## Concurrent Access

### File Lock Manager

```typescript
class FileLockManager {
  private locks: Map<string, { fd: FileHandle; timestamp: Date }> = new Map();
  private lockTimeout = 30000; // 30 seconds

  async acquire(filePath: string, timeout = 10000): Promise<void> {
    const lockPath = `${filePath}.lock`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Try to create lock file exclusively
        const fd = await fs.open(lockPath, "wx");
        await fd.write(
          JSON.stringify({
            pid: process.pid,
            timestamp: new Date(),
            host: os.hostname(),
          }),
        );

        this.locks.set(filePath, { fd, timestamp: new Date() });
        return;
      } catch (error: any) {
        if (error.code === "EEXIST") {
          // Lock exists, check if stale
          const isStale = await this.isLockStale(lockPath);
          if (isStale) {
            await fs.unlink(lockPath).catch(() => {});
            continue;
          }

          // Wait and retry
          await sleep(100);
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to acquire lock on ${filePath} after ${timeout}ms`);
  }

  async release(filePath: string): Promise<void> {
    const lockPath = `${filePath}.lock`;
    const lock = this.locks.get(filePath);

    if (lock) {
      await lock.fd.close();
      this.locks.delete(filePath);
    }

    await fs.unlink(lockPath).catch(() => {});
  }

  private async isLockStale(lockPath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(lockPath, "utf-8");
      const lockInfo = JSON.parse(content);
      const lockAge = Date.now() - new Date(lockInfo.timestamp).getTime();
      return lockAge > this.lockTimeout;
    } catch {
      return true; // If we can't read it, consider it stale
    }
  }

  async releaseAll(): Promise<void> {
    for (const [filePath] of this.locks) {
      await this.release(filePath);
    }
  }
}
```

---

## Cleanup Policies

```typescript
interface CleanupPolicy {
  maxAge: number; // Max age in ms
  maxCount: number; // Max number to keep
  keepCompleted: boolean; // Keep completed sessions
  keepFailed: boolean; // Keep failed sessions
}

class SessionCleaner {
  private baseDir: string;
  private policy: CleanupPolicy;

  constructor(baseDir: string, policy: CleanupPolicy) {
    this.baseDir = baseDir;
    this.policy = policy;
  }

  async cleanup(): Promise<{ deleted: string[]; kept: string[] }> {
    const sessions = await this.listSessions();
    const deleted: string[] = [];
    const kept: string[] = [];

    const now = Date.now();
    let count = 0;

    for (const session of sessions) {
      const shouldDelete =
        // Age policy
        now - session.updatedAt.getTime() > this.policy.maxAge ||
        // Count policy
        count >= this.policy.maxCount ||
        // Status policy
        (!this.policy.keepCompleted && session.status === "completed") ||
        (!this.policy.keepFailed && session.status === "failed");

      if (shouldDelete) {
        await this.deleteSession(session.id);
        deleted.push(session.id);
      } else {
        kept.push(session.id);
        count++;
      }
    }

    return { deleted, kept };
  }

  private async listSessions(): Promise<Session<any>[]> {
    const dirs = await fs.readdir(this.baseDir);
    const sessions: Session<any>[] = [];

    for (const dir of dirs) {
      const sessionPath = path.join(this.baseDir, dir, "session.json");
      try {
        const content = await fs.readFile(sessionPath, "utf-8");
        sessions.push(JSON.parse(content));
      } catch {
        // Skip invalid sessions
      }
    }

    return sessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  private async deleteSession(id: string): Promise<void> {
    const sessionPath = path.join(this.baseDir, id);
    await fs.rm(sessionPath, { recursive: true, force: true });
  }
}
```

---

## Checklist

Before using session persistence:

- [ ] Checkpoint manager configured with integrity checks?
- [ ] Session directory structure created?
- [ ] File locking for concurrent access?
- [ ] Version compatibility checking?
- [ ] Corruption detection implemented?
- [ ] Automatic recovery mode available?
- [ ] Cleanup policy defined?
- [ ] Atomic writes (temp + rename)?
- [ ] Encryption for sensitive data?
- [ ] Graceful shutdown handling?

---

## Related Skills

- `error-handling` - Handle persistence failures
- `llm-orchestration` - Persist multi-LLM session state
- `security` - Encrypt sensitive session data
- `testing` - Test recovery scenarios

---

## Commands

```bash
# List active sessions
ls -la sessions/*/session.json | head -20

# Check for stale locks
find sessions -name "*.lock" -mmin +30

# Clean old sessions
find sessions -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

# Validate session integrity
jq '.' sessions/*/session.json > /dev/null && echo "All valid"
```
