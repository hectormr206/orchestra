import React, { useState, useEffect, useCallback } from 'react';
import { Box } from 'ink';
import Orchestrator from '../orchestrator/Orchestrator.js';
import { OrchestratorState, OrchestratorPhase } from '../types.js';
import Dashboard from './screens/Dashboard.js';
import Execution from './screens/Execution.js';
import History from './screens/History.js';
import PlanReview from './screens/PlanReview.js';
import Settings from './screens/Settings.js';
import Doctor from './screens/Doctor.js';

type Screen = 'dashboard' | 'execution' | 'history' | 'planReview' | 'settings' | 'doctor';

interface AppProps {
  orchestrator: Orchestrator;
  initialScreen?: Screen;
}

const App: React.FC<AppProps> = ({ orchestrator, initialScreen = 'dashboard' }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);
  const [state, setState] = useState<OrchestratorState>(orchestrator.getState());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = orchestrator.onStateChange((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, [orchestrator]);

  const handleBack = useCallback(() => {
    setCurrentScreen('dashboard');
    setSelectedSessionId(null);
  }, []);

  const handleCancelAndExit = useCallback(() => {
    orchestrator.cancel();
    setCurrentScreen('dashboard');
    setSelectedSessionId(null);
  }, [orchestrator]);

  const orchestratorActions = useCallback(
    () => ({
      start: async (task: string) => {
        await orchestrator.start(task);
      },
      pause: () => {
        orchestrator.pause();
      },
      resume: () => {
        orchestrator.resume();
      },
      cancel: () => {
        orchestrator.cancel();
      },
      approvePlan: () => {
        orchestrator.approvePlan();
      },
      rejectPlan: () => {
        orchestrator.rejectPlan();
      },
      retry: () => {
        orchestrator.retry();
      },
    }),
    [orchestrator]
  );

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setSelectedSessionId(sessionId);
      setCurrentScreen('planReview');
    },
    []
  );

  const handleNewTask = useCallback(
    (task: string) => {
      orchestrator.setTask(task);
      setCurrentScreen('execution');
    },
    [orchestrator]
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard onSelectSession={handleSelectSession} onNewTask={handleNewTask} />;
      
      case 'execution':
        return (
          <Execution
            phase={state.phase as OrchestratorPhase}
            task={state.task}
            plan={state.plan}
            currentAgent={state.currentAgent}
            currentFile={state.currentFile}
            progress={state.progress}
            duration={state.duration}
            logs={state.logs}
            error={state.error}
            sessionId={state.sessionId}
            onPause={orchestratorActions().pause}
            onResume={orchestratorActions().resume}
            onCancel={handleCancelAndExit}
            onApprovePlan={orchestratorActions().approvePlan}
            onRejectPlan={orchestratorActions().rejectPlan}
            onRetry={orchestratorActions().retry}
            onExit={handleBack}
          />
        );
      
      case 'history':
        return <History onSelectSession={handleSelectSession} onBack={handleBack} />;
      
      case 'planReview':
        return selectedSessionId ? (
          <PlanReview sessionId={selectedSessionId} onBack={handleBack} />
        ) : null;
      
      case 'settings':
        return <Settings onBack={handleBack} />;
      
      case 'doctor':
        return <Doctor onBack={handleBack} />;
      
      default:
        return <Dashboard onSelectSession={handleSelectSession} onNewTask={handleNewTask} />;
    }
  };

  return <Box flexDirection="column">{renderScreen()}</Box>;
};

export default App;