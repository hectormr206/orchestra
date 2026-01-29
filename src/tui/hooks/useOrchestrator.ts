import { useState, useCallback, useRef, useEffect } from 'react';
import { Orchestrator, type PlanApprovalResult } from '../../orchestrator/Orchestrator.js';
import type { FileStatus } from '../components/FileList.js';
import type { AgentInfo } from '../components/AgentStatus.js';
import type { LogEntry } from '../components/LogView.js';

export interface OrchestratorState {
  isRunning: boolean;
  sessionId: string;
  task: string;
  phase: 'idle' | 'planning' | 'awaiting-approval' | 'executing' | 'auditing' | 'complete' | 'error';
  plan: string | null;
  files: FileStatus[];
  agents: AgentInfo[];
  logs: LogEntry[];
  progress: { current: number; total: number };
  duration: number;
  error: string | null;
}

export interface OrchestratorActions {
  start: (task: string, options: {
    autoApprove?: boolean;
    parallel?: boolean;
    runTests?: boolean;
    gitCommit?: boolean;
  }) => Promise<void>;
  approvePlan: () => void;
  rejectPlan: () => void;
  cancel: () => void;
  reset: () => void;
}

export function useOrchestrator(): [OrchestratorState, OrchestratorActions] {
  const [state, setState] = useState<OrchestratorState>({
    isRunning: false,
    sessionId: '',
    task: '',
    phase: 'idle',
    plan: null,
    files: [],
    agents: [
      { name: 'Architect', adapter: 'Codex', status: 'idle' },
      { name: 'Executor', adapter: 'GLM 4.7', status: 'idle' },
      { name: 'Auditor', adapter: 'Gemini', status: 'idle' },
      { name: 'Consultant', adapter: 'Codex', status: 'idle' },
    ],
    logs: [],
    progress: { current: 0, total: 0 },
    duration: 0,
    error: null,
  });

  const orchestratorRef = useRef<Orchestrator | null>(null);
  const planResolveRef = useRef<((result: PlanApprovalResult) => void) | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((level: LogEntry['level'], message: string, agent?: string) => {
    setState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          timestamp: new Date().toISOString(),
          level,
          message,
          agent,
        },
      ].slice(-100), // Keep last 100 logs
    }));
  }, []);

  const updateAgent = useCallback((name: string, update: Partial<AgentInfo>) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) =>
        a.name === name ? { ...a, ...update } : a
      ),
    }));
  }, []);

  const start = useCallback(async (task: string, options: {
    autoApprove?: boolean;
    parallel?: boolean;
    runTests?: boolean;
    gitCommit?: boolean;
  }) => {
    startTimeRef.current = Date.now();

    setState((prev) => ({
      ...prev,
      isRunning: true,
      task,
      phase: 'planning',
      plan: null,
      files: [],
      logs: [],
      progress: { current: 0, total: 0 },
      duration: 0,
      error: null,
      agents: prev.agents.map((a) => ({ ...a, status: 'idle' as const })),
    }));

    // Update duration periodically
    durationIntervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        duration: Date.now() - startTimeRef.current,
      }));
    }, 100);

    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setState((prev) => ({ ...prev, sessionId }));
    addLog('info', 'Starting new session: ' + sessionId);

    const orchestrator = new Orchestrator(
      {
        autoApprove: options.autoApprove,
        parallel: options.parallel,
        runTests: options.runTests,
        gitCommit: options.gitCommit,
      },
      {
        onPhaseStart: (phase, agent) => {
          addLog('info', 'Phase started: ' + phase, agent);

          if (phase === 'planning') {
            setState((prev) => ({ ...prev, phase: 'planning' }));
            updateAgent('Architect', { status: 'working' });
          } else if (phase === 'executing') {
            setState((prev) => ({ ...prev, phase: 'executing' }));
            updateAgent('Executor', { status: 'working' });
          } else if (phase === 'auditing') {
            setState((prev) => ({ ...prev, phase: 'auditing' }));
            updateAgent('Auditor', { status: 'working' });
          }
        },
        onPhaseComplete: (phase, agent, result) => {
          addLog('success', 'Phase complete: ' + phase + ' (' + (result.duration / 1000).toFixed(1) + 's)', agent);

          if (phase === 'planning') {
            updateAgent('Architect', { status: 'complete', duration: result.duration });
          } else if (phase === 'executing') {
            updateAgent('Executor', { status: 'complete', duration: result.duration });
          } else if (phase === 'auditing') {
            updateAgent('Auditor', { status: 'complete', duration: result.duration });
          }
        },
        onError: (phase, error) => {
          addLog('error', 'Error in ' + phase + ': ' + error);
          setState((prev) => ({ ...prev, phase: 'error', error }));
        },
        onIteration: (iteration, max) => {
          addLog('info', 'Iteration ' + iteration + '/' + max);
        },
        onPlanReady: options.autoApprove ? undefined : async (planContent, planFile) => {
          setState((prev) => ({ ...prev, phase: 'awaiting-approval', plan: planContent }));
          addLog('info', 'Plan ready for approval');

          return new Promise<PlanApprovalResult>((resolve) => {
            planResolveRef.current = resolve;
          });
        },
        onFileStart: (file, index, total) => {
          addLog('info', 'Processing file: ' + file);
          setState((prev) => ({
            ...prev,
            progress: { current: index, total },
            files: [
              ...prev.files.filter((f) => f.path !== file),
              { path: file, status: 'processing' as const },
            ],
          }));
        },
        onFileComplete: (file, success, duration) => {
          addLog(success ? 'success' : 'error', 'File ' + (success ? 'complete' : 'failed') + ': ' + file);
          setState((prev) => ({
            ...prev,
            progress: { ...prev.progress, current: prev.progress.current + 1 },
            files: prev.files.map((f) =>
              f.path === file
                ? { ...f, status: success ? 'complete' as const : 'error' as const, duration }
                : f
            ),
          }));
        },
        onSyntaxCheck: (file, valid, error) => {
          if (!valid) {
            addLog('warning', 'Syntax error in ' + file + ': ' + (error?.substring(0, 50) || 'unknown'));
          }
        },
        onConsultant: (file, reason) => {
          addLog('info', 'Consultant helping with ' + file, 'Consultant');
          updateAgent('Consultant', { status: 'working' });
        },
        onAdapterFallback: (from, to, reason) => {
          addLog('warning', 'Fallback: ' + from + ' → ' + to + ' (' + reason + ')');
        },
      }
    );

    orchestratorRef.current = orchestrator;

    try {
      const success = await orchestrator.run(task);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setState((prev) => ({
        ...prev,
        isRunning: false,
        phase: success ? 'complete' : 'error',
        duration: Date.now() - startTimeRef.current,
      }));

      addLog(success ? 'success' : 'error', success ? 'Task completed successfully' : 'Task failed');
    } catch (error) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setState((prev) => ({
        ...prev,
        isRunning: false,
        phase: 'error',
        error: String(error),
        duration: Date.now() - startTimeRef.current,
      }));

      addLog('error', 'Task failed: ' + String(error));
    }
  }, [addLog, updateAgent]);

  const approvePlan = useCallback(() => {
    if (planResolveRef.current) {
      planResolveRef.current({ approved: true });
      planResolveRef.current = null;
      setState((prev) => ({ ...prev, phase: 'executing' }));
      addLog('success', 'Plan approved');
    }
  }, [addLog]);

  const rejectPlan = useCallback(() => {
    if (planResolveRef.current) {
      planResolveRef.current({ approved: false, reason: 'rejected' });
      planResolveRef.current = null;
      setState((prev) => ({ ...prev, phase: 'idle', isRunning: false }));
      addLog('warning', 'Plan rejected');
    }
  }, [addLog]);

  const cancel = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (planResolveRef.current) {
      planResolveRef.current({ approved: false, reason: 'rejected' });
      planResolveRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRunning: false,
      phase: 'idle',
    }));

    addLog('warning', 'Task cancelled by user');
  }, [addLog]);

  const reset = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    setState({
      isRunning: false,
      sessionId: '',
      task: '',
      phase: 'idle',
      plan: null,
      files: [],
      agents: [
        { name: 'Architect', adapter: 'Codex', status: 'idle' },
        { name: 'Executor', adapter: 'GLM 4.7', status: 'idle' },
        { name: 'Auditor', adapter: 'Gemini', status: 'idle' },
        { name: 'Consultant', adapter: 'Codex', status: 'idle' },
      ],
      logs: [],
      progress: { current: 0, total: 0 },
      duration: 0,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  return [state, { start, approvePlan, rejectPlan, cancel, reset }];
}
