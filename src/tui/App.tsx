import React, { useState, useEffect } from "react";
import { Box, useApp, useInput } from "ink";
import { Header } from "./components/Header.js";
import { Dashboard } from "./screens/Dashboard.js";
import { TaskInput } from "./screens/TaskInput.js";
import { Execution } from "./screens/Execution.js";
import { PlanReview } from "./screens/PlanReview.js";
import { PlanEditor } from "./screens/PlanEditor.js";
import { DryRun } from "./screens/DryRun.js";
import { SessionDetails } from "./screens/SessionDetails.js";
import { History } from "./screens/History.js";
import { Settings } from "./screens/Settings.js";
import { AdvancedSettings } from "./screens/AdvancedSettings.js";
import { Doctor } from "./screens/Doctor.js";
import { useOrchestrator } from "./hooks/useOrchestrator.js";
import {
  loadSettings,
  saveSettings,
  type TUISettings,
} from "../utils/configLoader.js";

type Screen =
  | "dashboard"
  | "new-task"
  | "dry-run"
  | "execution"
  | "plan-review"
  | "plan-editor"
  | "history"
  | "session-details"
  | "settings"
  | "advanced-settings"
  | "doctor";

interface AppProps {
  initialTask?: string;
  autoStart?: boolean;
}

export const App: React.FC<AppProps> = ({ initialTask, autoStart }) => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(
    autoStart && initialTask ? "execution" : "dashboard",
  );
  const [orchestratorState, orchestratorActions] = useOrchestrator();
  const [settings, setSettings] = useState<TUISettings>({
    parallel: true,
    maxConcurrency: 3,
    autoApprove: false,
    runTests: false,
    testCommand: "npm test",
    gitCommit: false,
    notifications: true,
    cacheEnabled: true,
    // Recovery Mode settings
    maxRecoveryAttempts: 3,
    recoveryTimeoutMinutes: 10,
    autoRevertOnFailure: true,
    // Agent Models
    agents: {
      architect: ["Claude (Opus 4.5)", "Gemini", "Claude (GLM 4.7)", "Codex"],
      executor: ["Claude (GLM 4.7)", "Gemini", "Claude (Opus 4.5)", "Codex"],
      auditor: ["Gemini", "Claude (GLM 4.7)", "Claude (Opus 4.5)", "Codex"],
      consultant: ["Claude (Opus 4.5)", "Gemini", "Claude (GLM 4.7)", "Codex"],
    },
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedToday: 0,
    failedToday: 0,
    cacheEntries: 0,
  });
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { SessionHistory } = await import("../utils/sessionHistory.js");
        const { ResultCache } = await import("../utils/cache.js");

        const history = new SessionHistory();
        await history.init();
        const historyStats = history.getStats();

        const cache = new ResultCache();
        await cache.init();
        const cacheStats = cache.getStats();

        setStats({
          totalSessions: historyStats.total,
          completedToday: historyStats.completed,
          failedToday: historyStats.failed,
          cacheEntries: cacheStats.entries,
        });

        setSessions(history.list({ limit: 20 }));
      } catch {
        // Stats not available
      }
    };

    loadStats();
  }, []);

  // Load settings on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedSettings = await loadSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch {
        // Settings not available, use defaults
      }
    };

    loadSavedSettings();
  }, []);

  // Auto-start if provided
  useEffect(() => {
    if (autoStart && initialTask) {
      orchestratorActions.start(initialTask, {
        autoApprove: settings.autoApprove,
        parallel: settings.parallel,
      });
    }
  }, [autoStart, initialTask]);

  // Global keyboard shortcuts
  useInput((input, key) => {
    if (screen === "dashboard") {
      if (input === "n") setScreen("new-task");
      if (input === "r") setScreen("history");
      if (input === "h") setScreen("history");
      if (input === "s") setScreen("settings");
      if (input === "q") exit();
    }
  });

  // Watch orchestrator phase changes
  useEffect(() => {
    if (orchestratorState.phase === "awaiting-approval") {
      setScreen("plan-review");
    } else if (
      orchestratorState.phase === "executing" ||
      orchestratorState.phase === "auditing" ||
      orchestratorState.phase === "recovery"
    ) {
      setScreen("execution");
    } else if (
      orchestratorState.phase === "complete" ||
      orchestratorState.phase === "error"
    ) {
      // Stay on execution screen to show results
    }
  }, [orchestratorState.phase]);

  const handleNavigate = (destination: string) => {
    switch (destination) {
      case "new-task":
        setScreen("new-task");
        break;
      case "resume":
        setScreen("history");
        break;
      case "history":
        setScreen("history");
        break;
      case "settings":
        setScreen("settings");
        break;
      case "doctor":
        setScreen("doctor");
        break;
      case "exit":
        exit();
        break;
    }
  };

  const handleTaskSubmit = (task: string, options: any) => {
    setCurrentTask(task);
    setCurrentPlan("");

    if (options.dryRun) {
      setScreen("dry-run");
      return;
    }

    setScreen("execution");
    orchestratorActions.start(task, {
      autoApprove: options.autoApprove,
      parallel: options.parallel,
      runTests: options.runTests,
      gitCommit: options.gitCommit,
      agents: options.agents,
    });
  };

  const handleBack = () => {
    setScreen("dashboard");
    orchestratorActions.reset();
  };

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;

      case "new-task":
        return (
          <TaskInput
            onSubmit={handleTaskSubmit}
            onCancel={handleBack}
            defaultTask=""
            initialOptions={{
              autoApprove: settings.autoApprove,
              parallel: settings.parallel,
              runTests: settings.runTests,
              gitCommit: settings.gitCommit,
              agents: settings.agents,
            }}
          />
        );

      case "dry-run":
        return (
          <DryRun
            task={currentTask}
            plan={currentPlan}
            onApprove={() => {
              setScreen("execution");
              orchestratorActions.start(currentTask, {
                autoApprove: settings.autoApprove,
                parallel: settings.parallel,
                runTests: settings.runTests,
                gitCommit: settings.gitCommit,
              });
            }}
            onReject={handleBack}
            onBack={handleBack}
          />
        );

      case "execution":
        return (
          <Execution
            task={orchestratorState.task}
            sessionId={orchestratorState.sessionId}
            phase={orchestratorState.phase as any}
            agents={orchestratorState.agents}
            files={orchestratorState.files}
            logs={orchestratorState.logs}
            progress={orchestratorState.progress}
            startTime={orchestratorState.startTime}
            isRunning={orchestratorState.isRunning}
            onCancel={orchestratorActions.cancel}
            onComplete={handleBack}
          />
        );

      case "plan-review":
        return (
          <PlanReview
            plan={orchestratorState.plan || "No plan available"}
            onApprove={() => {
              orchestratorActions.approvePlan();
              setScreen("execution");
            }}
            onReject={() => {
              orchestratorActions.rejectPlan();
              handleBack();
            }}
            onEdit={() => {
              setCurrentPlan(orchestratorState.plan || "");
              setScreen("plan-editor");
            }}
          />
        );

      case "plan-editor":
        return (
          <PlanEditor
            initialPlan={currentPlan}
            onSave={(editedPlan) => {
              setCurrentPlan(editedPlan);
              orchestratorActions.updatePlan(editedPlan);
              setScreen("plan-review");
            }}
            onCancel={() => {
              setScreen("plan-review");
            }}
          />
        );

      case "history":
        return (
          <History
            sessions={sessions}
            onSelect={(id) => {
              setSelectedSessionId(id);
              setScreen("session-details");
            }}
            onSessionDetails={(id) => {
              setSelectedSessionId(id);
              setScreen("session-details");
            }}
            onBack={handleBack}
            onDelete={async (id) => {
              setSessions((prev) => prev.filter((s) => s.id !== id));
            }}
            onSessionsChange={async () => {
              // Reload sessions
              try {
                const { SessionHistory } = await import("../utils/sessionHistory.js");
                const history = new SessionHistory();
                await history.init();
                setSessions(history.list({ limit: 20 }));
              } catch {
                // Ignore errors
              }
            }}
          />
        );

      case "session-details":
        return (
          <SessionDetails
            sessionId={selectedSessionId}
            onBack={() => {
              setScreen("history");
            }}
          />
        );

      case "settings":
        return (
          <Settings
            config={settings}
            onChange={setSettings}
            onSave={async () => {
              try {
                await saveSettings(settings);
              } catch {
                // Failed to save, but continue anyway
              }
              setScreen("dashboard");
            }}
            onBack={handleBack}
            onAdvancedSettings={() => {
              setScreen("advanced-settings");
            }}
          />
        );

      case "advanced-settings":
        return (
          <AdvancedSettings
            config={settings}
            onChange={setSettings}
            onSave={async () => {
              try {
                await saveSettings(settings);
              } catch {
                // Failed to save, but continue anyway
              }
            }}
            onBack={() => {
              setScreen("settings");
            }}
          />
        );

      case "doctor":
        return <Doctor onBack={handleBack} />;

      default:
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {screen === "dashboard" && <Header />}
      {screen !== "dashboard" && screen !== "execution" && <Header compact />}
      {renderScreen()}
    </Box>
  );
};
