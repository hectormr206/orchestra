import { useState, useCallback, useRef, useEffect } from "react";
import {
  Orchestrator,
  type PlanApprovalResult,
} from "../../orchestrator/Orchestrator.js";
import type { FileStatus } from "../components/FileList.js";
import type { AgentInfo } from "../components/AgentStatus.js";
import type { LogEntry } from "../components/LogView.js";
import type { AgentConfig } from "../../types.js";

export interface OrchestratorState {
  isRunning: boolean;
  sessionId: string;
  task: string;
  phase:
    | "idle"
    | "planning"
    | "awaiting-approval"
    | "executing"
    | "auditing"
    | "recovery"
    | "complete"
    | "error";
  plan: string | null;
  files: FileStatus[];
  agents: AgentInfo[];
  logs: LogEntry[];
  progress: { current: number; total: number };
  startTime: number; // Changed from duration - component calculates duration locally
  error: string | null;
}

export interface OrchestratorActions {
  start: (
    task: string,
    options: {
      autoApprove?: boolean;
      parallel?: boolean;
      runTests?: boolean;
      gitCommit?: boolean;
      agents?: AgentConfig;
    },
  ) => Promise<void>;
  approvePlan: () => void;
  rejectPlan: () => void;
  updatePlan: (editedPlan: string) => void;
  cancel: () => void;
  reset: () => void;
}

export function useOrchestrator(): [OrchestratorState, OrchestratorActions] {
  const [state, setState] = useState<OrchestratorState>({
    isRunning: false,
    sessionId: "",
    task: "",
    phase: "idle",
    plan: null,
    files: [],
    agents: [
      { name: "Architect", adapter: "Codex", status: "idle" },
      { name: "Executor", adapter: "GLM 4.7", status: "idle" },
      { name: "Auditor", adapter: "Gemini", status: "idle" },
      { name: "Consultant", adapter: "Codex", status: "idle" },
    ],
    logs: [],
    progress: { current: 0, total: 0 },
    startTime: 0,
    error: null,
  });

  const orchestratorRef = useRef<Orchestrator | null>(null);
  const planResolveRef = useRef<((result: PlanApprovalResult) => void) | null>(
    null,
  );
  const editedPlanRef = useRef<string | null>(null);

  // LOG BATCHING TO PREVENT FLICKERING -------------------------------------
  const logBufferRef = useRef<LogEntry[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  const addLog = useCallback(
    (level: LogEntry["level"], message: string, agent?: string) => {
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        agent,
      };

      logBufferRef.current.push(newLog);

      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(() => {
          setState((prev) => {
            const buffer = logBufferRef.current;
            logBufferRef.current = []; // Clear buffer immediately
            flushTimeoutRef.current = null;

            return {
              ...prev,
              logs: [...prev.logs, ...buffer].slice(-100), // Keep last 100 logs
            };
          });
        }, 100); // Throttle updates to max 10 times per second
      }
    },
    [],
  );
  // ------------------------------------------------------------------------

  const updateAgent = useCallback(
    (name: string, update: Partial<AgentInfo>) => {
      setState((prev) => ({
        ...prev,
        agents: prev.agents.map((a) =>
          a.name === name ? { ...a, ...update } : a,
        ),
      }));
    },
    [],
  );

  const start = useCallback(
    async (
      task: string,
      options: {
        autoApprove?: boolean;
        parallel?: boolean;
        runTests?: boolean;
        gitCommit?: boolean;
        agents?: AgentConfig;
      },
    ) => {
      const currentStartTime = Date.now();

      setState((prev) => ({
        ...prev,
        isRunning: true,
        task,
        phase: "planning",
        plan: null,
        files: [],
        logs: [],
        progress: { current: 0, total: 0 },
        startTime: currentStartTime,
        error: null,
        agents: prev.agents.map((a) => ({ ...a, status: "idle" as const })),
      }));

      // Duration is now calculated locally in DurationDisplay component
      // No more interval timer causing parent re-renders

      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      setState((prev) => ({ ...prev, sessionId }));
      addLog("info", "Starting new session: " + sessionId);

      const orchestrator = new Orchestrator(
        {
          autoApprove: options.autoApprove,
          parallel: options.parallel,
          runTests: options.runTests,
          gitCommit: options.gitCommit,
          agents: options.agents,
        },
        {
          onPhaseStart: (phase, agent) => {
            // ... (keep existing callbacks)
            addLog("info", "Phase started: " + phase, agent);

            if (phase === "planning") {
              setState((prev) => ({ ...prev, phase: "planning" }));
              updateAgent("Architect", { status: "working" });
            } else if (phase === "executing") {
              setState((prev) => ({ ...prev, phase: "executing" }));
              updateAgent("Executor", { status: "working" });
            } else if (phase === "auditing") {
              setState((prev) => ({ ...prev, phase: "auditing" }));
              updateAgent("Auditor", { status: "working" });
            } else if (phase === "testing") {
              // Testing phase - don't change TUI phase, it's a quick step
              addLog("info", "Running tests...");
            }
          },
          // ... (keep other callbacks)
          onPhaseComplete: (phase, agent, result) => {
            addLog(
              "success",
              "Phase complete: " +
                phase +
                " (" +
                (result.duration / 1000).toFixed(1) +
                "s)",
              agent,
            );

            if (phase === "planning") {
              updateAgent("Architect", {
                status: "complete",
                duration: result.duration,
              });
            } else if (phase === "executing") {
              updateAgent("Executor", {
                status: "complete",
                duration: result.duration,
              });
            } else if (phase === "auditing") {
              updateAgent("Auditor", {
                status: "complete",
                duration: result.duration,
              });
            }
          },
          onError: (phase, error) => {
            addLog("error", "Error in " + phase + ": " + error);
            setState((prev) => ({ ...prev, phase: "error", error }));
          },
          onIteration: (iteration, max) => {
            addLog("info", "Iteration " + iteration + "/" + max);
          },
          onPlanReady: options.autoApprove
            ? undefined
            : async (planContent, planFile) => {
                setState((prev) => ({
                  ...prev,
                  phase: "awaiting-approval",
                  plan: planContent,
                }));
                addLog("info", "Plan ready for approval");

                return new Promise<PlanApprovalResult>((resolve) => {
                  planResolveRef.current = resolve;
                });
              },
          onFileStart: (file, index, total) => {
            addLog("info", "Processing file: " + file);
            setState((prev) => ({
              ...prev,
              progress: { current: index, total },
              files: [
                ...prev.files.filter((f) => f.path !== file),
                { path: file, status: "processing" as const },
              ],
            }));
          },
          onFileComplete: (file, success, duration) => {
            addLog(
              success ? "success" : "error",
              "File " + (success ? "complete" : "failed") + ": " + file,
            );
            setState((prev) => ({
              ...prev,
              progress: {
                ...prev.progress,
                current: prev.progress.current + 1,
              },
              files: prev.files.map((f) =>
                f.path === file
                  ? {
                      ...f,
                      status: success
                        ? ("complete" as const)
                        : ("error" as const),
                      duration,
                    }
                  : f,
              ),
            }));
          },
          onSyntaxCheck: (file, valid, error) => {
            if (!valid) {
              addLog(
                "warning",
                "Syntax error in " +
                  file +
                  ": " +
                  (error?.substring(0, 50) || "unknown"),
              );
            }
          },
          onConsultant: (file, reason) => {
            addLog("info", "Consultant helping with " + file, "Consultant");
            updateAgent("Consultant", { status: "working" });
          },
          onAdapterFallback: (from, to, reason, agentName) => {
            addLog(
              "warning",
              "Fallback: " + from + " → " + to + " (" + reason + ")",
              agentName,
            );

            // Update the UI to show the new active model
            setState((prev) => ({
              ...prev,
              agents: prev.agents.map((agent) => {
                // If agentName is provided, update only that agent
                if (agentName && agent.name === agentName) {
                  return {
                    ...agent,
                    adapter: to,
                    status: "fallback",
                    fallbackFrom: from,
                  };
                }
                // Fallback for older behavior (shouldn't happen with new orchestrator)
                if (!agentName && agent.adapter === from) {
                  return {
                    ...agent,
                    adapter: to,
                    status: "fallback",
                    fallbackFrom: from,
                  };
                }
                return agent;
              }),
            }));
          },
          onRecoveryStart: (failedFiles) => {
            addLog(
              "warning",
              "Recovery Mode started for " + failedFiles.length + " file(s)",
            );
            updateAgent("Consultant", { status: "working" });
          },
          onRecoveryAttempt: (attempt, max, remaining) => {
            addLog(
              "info",
              "Recovery attempt " +
                attempt +
                "/" +
                max +
                " - " +
                remaining +
                " file(s) remaining",
            );
          },
          onFileReverted: (file) => {
            addLog("warning", "File reverted: " + file);
            setState((prev) => ({
              ...prev,
              files: prev.files.map((f) =>
                f.path === file ? { ...f, status: "error" as const } : f,
              ),
            }));
          },
          onFileDeleted: (file) => {
            addLog("warning", "File deleted: " + file);
            setState((prev) => ({
              ...prev,
              files: prev.files.filter((f) => f.path !== file),
            }));
          },
          onRecoveryComplete: (success, recovered, failed) => {
            if (success) {
              addLog(
                "success",
                "Recovery complete! " + recovered.length + " file(s) recovered",
              );
            } else {
              addLog(
                "error",
                "Recovery failed. " +
                  failed.length +
                  " file(s) could not be fixed",
              );
            }
            updateAgent("Consultant", {
              status: success ? "complete" : "error",
            });
          },
        },
      );

      orchestratorRef.current = orchestrator;

      // Update agents with configured models
      setState((prev) => ({
        ...prev,
        agents: [
          {
            name: "Architect",
            adapter: orchestrator.architectAdapter.getInfo().model,
            status: "idle",
          },
          {
            name: "Executor",
            adapter: orchestrator.executorAdapter.getInfo().model,
            status: "idle",
          },
          {
            name: "Auditor",
            adapter: orchestrator.auditorAdapter.getInfo().model,
            status: "idle",
          },
          {
            name: "Consultant",
            adapter: orchestrator.consultantAdapter.getInfo().model,
            status: "idle",
          },
        ],
      }));

      try {
        // En TUI, al iniciar una nueva tarea explícitamente, limpiamos cualquier sesión anterior pendiente
        await orchestrator.clean();

        const success = await orchestrator.run(task);

        setState((prev) => ({
          ...prev,
          isRunning: false,
          phase: success ? "complete" : "error",
        }));

        addLog(
          success ? "success" : "error",
          success ? "Task completed successfully" : "Task failed",
        );
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          phase: "error",
          error: String(error),
        }));

        addLog("error", "Task failed: " + String(error));
      }
    },
    [addLog, updateAgent],
  );

  const approvePlan = useCallback(() => {
    if (planResolveRef.current) {
      const result: PlanApprovalResult = editedPlanRef.current
        ? { approved: true, editedPlan: editedPlanRef.current }
        : { approved: true };

      if (editedPlanRef.current) {
        addLog("info", "Using edited plan");
      }
      planResolveRef.current(result);
      planResolveRef.current = null;
      editedPlanRef.current = null;
      setState((prev) => ({ ...prev, phase: "executing" }));
      addLog("success", "Plan approved");
    }
  }, [addLog]);

  const updatePlan = useCallback((editedPlan: string) => {
    editedPlanRef.current = editedPlan;
    setState((prev) => ({ ...prev, plan: editedPlan }));
    addLog("info", "Plan updated");
  }, [addLog]);

  const rejectPlan = useCallback(() => {
    if (planResolveRef.current) {
      planResolveRef.current({ approved: false, reason: "rejected" });
      planResolveRef.current = null;
      setState((prev) => ({ ...prev, phase: "idle", isRunning: false }));
      addLog("warning", "Plan rejected");
    }
  }, [addLog]);

  const cancel = useCallback(() => {
    // Don't cancel if task already completed or errored
    setState((prev) => {
      if (
        prev.phase === "complete" ||
        prev.phase === "error" ||
        prev.phase === "idle"
      ) {
        // Already done, just return to dashboard instead of showing cancelled
        return prev;
      }

      // Actually cancel an in-progress task
      if (planResolveRef.current) {
        planResolveRef.current({ approved: false, reason: "rejected" });
        planResolveRef.current = null;
      }

      addLog("warning", "Task cancelled by user");
      return {
        ...prev,
        isRunning: false,
        phase: "idle",
      };
    });
  }, [addLog]);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      sessionId: "",
      task: "",
      phase: "idle",
      plan: null,
      files: [],
      agents: [
        { name: "Architect", adapter: "Codex", status: "idle" },
        { name: "Executor", adapter: "GLM 4.7", status: "idle" },
        { name: "Auditor", adapter: "Gemini", status: "idle" },
        { name: "Consultant", adapter: "Codex", status: "idle" },
      ],
      logs: [],
      progress: { current: 0, total: 0 },
      startTime: 0,
      error: null,
    });
  }, []);

  return [state, { start, approvePlan, rejectPlan, updatePlan, cancel, reset }];
}
