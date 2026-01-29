import React, { useState, useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import { Header } from './components/Header.js';
import { Dashboard } from './screens/Dashboard.js';
import { TaskInput } from './screens/TaskInput.js';
import { Execution } from './screens/Execution.js';
import { PlanReview } from './screens/PlanReview.js';
import { History } from './screens/History.js';
import { Settings } from './screens/Settings.js';
import { Doctor } from './screens/Doctor.js';
import { useOrchestrator } from './hooks/useOrchestrator.js';

type Screen = 'dashboard' | 'new-task' | 'execution' | 'plan-review' | 'history' | 'settings' | 'doctor';

interface AppProps {
  initialTask?: string;
  autoStart?: boolean;
}

export const App: React.FC<AppProps> = ({ initialTask, autoStart }) => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(autoStart && initialTask ? 'execution' : 'dashboard');
  const [orchestratorState, orchestratorActions] = useOrchestrator();
  const [settings, setSettings] = useState({
    parallel: true,
    maxConcurrency: 3,
    autoApprove: false,
    runTests: false,
    testCommand: 'npm test',
    gitCommit: false,
    notifications: true,
    cacheEnabled: true,
  });
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedToday: 0,
    failedToday: 0,
    cacheEntries: 0,
  });
  const [sessions, setSessions] = useState<any[]>([]);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { SessionHistory } = await import('../utils/sessionHistory.js');
        const { ResultCache } = await import('../utils/cache.js');

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
    if (screen === 'dashboard') {
      if (input === 'n') setScreen('new-task');
      if (input === 'r') setScreen('history');
      if (input === 'h') setScreen('history');
      if (input === 's') setScreen('settings');
      if (input === 'q') exit();
    }
  });

  // Watch orchestrator phase changes
  useEffect(() => {
    if (orchestratorState.phase === 'awaiting-approval') {
      setScreen('plan-review');
    } else if (orchestratorState.phase === 'executing' || orchestratorState.phase === 'auditing') {
      setScreen('execution');
    } else if (orchestratorState.phase === 'complete' || orchestratorState.phase === 'error') {
      // Stay on execution screen to show results
    }
  }, [orchestratorState.phase]);

  const handleNavigate = (destination: string) => {
    switch (destination) {
      case 'new-task':
        setScreen('new-task');
        break;
      case 'resume':
        setScreen('history');
        break;
      case 'history':
        setScreen('history');
        break;
      case 'settings':
        setScreen('settings');
        break;
      case 'doctor':
        setScreen('doctor');
        break;
      case 'exit':
        exit();
        break;
    }
  };

  const handleTaskSubmit = (task: string, options: any) => {
    if (options.dryRun) {
      // TODO: Implement dry-run screen
      return;
    }

    setScreen('execution');
    orchestratorActions.start(task, {
      autoApprove: options.autoApprove,
      parallel: options.parallel,
      runTests: options.runTests,
      gitCommit: options.gitCommit,
    });
  };

  const handleBack = () => {
    setScreen('dashboard');
    orchestratorActions.reset();
  };

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;

      case 'new-task':
        return (
          <TaskInput
            onSubmit={handleTaskSubmit}
            onCancel={handleBack}
            defaultTask=""
          />
        );

      case 'execution':
        return (
          <Execution
            task={orchestratorState.task}
            sessionId={orchestratorState.sessionId}
            phase={orchestratorState.phase as any}
            agents={orchestratorState.agents}
            files={orchestratorState.files}
            logs={orchestratorState.logs}
            progress={orchestratorState.progress}
            duration={orchestratorState.duration}
            onCancel={orchestratorActions.cancel}
            onComplete={handleBack}
          />
        );

      case 'plan-review':
        return (
          <PlanReview
            plan={orchestratorState.plan || 'No plan available'}
            onApprove={() => {
              orchestratorActions.approvePlan();
              setScreen('execution');
            }}
            onReject={() => {
              orchestratorActions.rejectPlan();
              handleBack();
            }}
            onEdit={() => {
              // TODO: Implement plan editing
            }}
          />
        );

      case 'history':
        return (
          <History
            sessions={sessions}
            onSelect={(id) => {
              // TODO: Load and display session details
            }}
            onBack={handleBack}
            onDelete={async (id) => {
              // TODO: Delete session
              setSessions((prev) => prev.filter((s) => s.id !== id));
            }}
          />
        );

      case 'settings':
        return (
          <Settings
            config={settings}
            onChange={setSettings}
            onSave={() => {
              // TODO: Persist settings
              setScreen('dashboard');
            }}
            onBack={handleBack}
          />
        );

      case 'doctor':
        return <Doctor onBack={handleBack} />;

      default:
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {screen === 'dashboard' && <Header />}
      {screen !== 'dashboard' && screen !== 'execution' && <Header compact />}
      {renderScreen()}
    </Box>
  );
};
