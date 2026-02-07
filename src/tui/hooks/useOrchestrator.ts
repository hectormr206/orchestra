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
    | "observing"
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
      { name: "Observer", adapter: "Kimi Vision", status: "idle" },
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
  const cancelledRef = useRef<boolean>(false);

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
      cancelledRef.current = false;
      const currentStartTime = Date.now();

      const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

      setState((prev) => ({
        ...prev,
        isRunning: true,
        task,
        sessionId,
        phase: "planning",
        plan: null,
        files: [],
        logs: [],
        progress: { current: 0, total: 0 },
        startTime: currentStartTime,
        error: null,
        agents: prev.agents.map((a) => ({ ...a, status: "idle" as const })),
      }));

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
            addLog("info", "Phase started: " + phase, agent);

            const agentMap: Record<string, string> = {
              planning: "Architect",
              executing: "Executor",
              auditing: "Auditor",
              observing: "Observer",
            };
            const agentName = agentMap[phase];
            if (agentName) {
              setState((prev) => ({
                ...prev,
                phase: phase as any,
                agents: prev.agents.map((a) =>
                  a.name === agentName
                    ? { ...a, status: "working" as const }
                    : a,
                ),
              }));
            } else if (phase === "testing") {
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

            const agentMap: Record<string, string> = {
              planning: "Architect",
              executing: "Executor",
              auditing: "Auditor",
              observing: "Observer",
            };
            const agentName = agentMap[phase];
            if (agentName) {
              setState((prev) => ({
                ...prev,
                agents: prev.agents.map((a) =>
                  a.name === agentName
                    ? {
                        ...a,
                        status:
                          phase === "observing" && !result.success
                            ? ("error" as const)
                            : ("complete" as const),
                        duration: result.duration,
                      }
                    : a,
                ),
              }));
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
              "Fallback: " + from + " -> " + to + " (" + reason + ")",
              agentName,
            );

            if (agentName) {
              setState((prev) => ({
                ...prev,
                agents: prev.agents.map((agent) =>
                  agent.name === agentName
                    ? {
                        ...agent,
                        adapter: to,
                        status: "fallback" as const,
                        fallbackFrom: from,
                      }
                    : agent,
                ),
              }));
            }
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
          onObserverStart: () => {
            addLog("info", "Observer: Starting visual validation...", "Observer");
            updateAgent("Observer", { status: "working" });
          },
          onRouteCapture: (route, index, total) => {
            addLog("info", `Observer: Capturing ${route} (${index + 1}/${total})`, "Observer");
          },
          onRouteValidation: (route, result) => {
            addLog(
              result.status === "APPROVED" ? "success" : "warning",
              `Observer: ${route} - ${result.status} (${result.issues.length} issues)`,
              "Observer",
            );
          },
          onObserverComplete: (result) => {
            addLog(
              result.success ? "success" : "warning",
              `Observer: Validation complete - ${result.totalIssues} total issues`,
              "Observer",
            );
          },
          onObserverError: (error) => {
            addLog("error", "Observer error: " + error, "Observer");
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
          {
            name: "Observer",
            adapter: "Kimi Vision",
            status: "idle",
          },
        ],
      }));

      try {
        // En TUI, al iniciar una nueva tarea explícitamente, limpiamos cualquier sesión anterior pendiente
        await orchestrator.clean();

        const success = await orchestrator.run(task);

        // Don't overwrite state if user cancelled during execution
        if (!cancelledRef.current) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            phase: success ? "complete" : "error",
          }));

          addLog(
            success ? "success" : "error",
            success ? "Task completed successfully" : "Task failed",
          );
        }
      } catch (error) {
        // Don't overwrite state if user cancelled during execution
        if (!cancelledRef.current) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            phase: "error",
            error: String(error),
          }));

          addLog("error", "Task failed: " + String(error));
        }
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
    cancelledRef.current = true;

    // Resolve pending plan approval if waiting
    if (planResolveRef.current) {
      planResolveRef.current({ approved: false, reason: "rejected" });
      planResolveRef.current = null;
    }

    addLog("warning", "Task cancelled by user");
    setState((prev) => ({
      ...prev,
      isRunning: false,
      phase: "idle",
      error: null,
    }));
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
        { name: "Observer", adapter: "Kimi Vision", status: "idle" },
      ],
      logs: [],
      progress: { current: 0, total: 0 },
      startTime: 0,
      error: null,
    });
  }, []);

  return [state, { start, approvePlan, rejectPlan, updatePlan, cancel, reset }];
}
