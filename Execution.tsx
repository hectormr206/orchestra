import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../components/Header.js';
import { StatusBar } from '../components/StatusBar.js';
import { ProgressBar } from '../components/ProgressBar.js';
import { FileList, FileStatus } from '../components/FileList.js';
import { AgentStatus, AgentInfo } from '../components/AgentStatus.js';
import { LogView, LogEntry } from '../components/LogView.js';
import { truncateText } from '../utils/text.js';

interface ExecutionProps {
  task: string;
  sessionId: string;
  phase: 'planning' | 'executing' | 'auditing' | 'complete' | 'error';
  agents: AgentInfo[];
  files: FileStatus[];
  logs: LogEntry[];
  progress: { current: number; total: number };
  duration: number;
  onCancel?: () => void;
  onComplete?: () => void;
  onExit?: () => void;
}

export const Execution: React.FC<ExecutionProps> = ({
  task,
  sessionId,
  phase,
  agents,
  files,
  logs,
  progress,
  duration,
  onCancel,
  onComplete,
  onExit,
}) => {
  useInput((input, key) => {
    if (key.escape) {
      // Si la fase es 'complete' o 'error', salir limpiamente al dashboard
      if (phase === 'complete' || phase === 'error') {
        if (onExit) {
          onExit();
        }
      } 
      // Si la tarea está en ejecución (planning, executing, auditing), cancelar
      else if (phase === 'planning' || phase === 'executing' || phase === 'auditing') {
        if (onCancel) {
          onCancel();
        }
      }
    }
    if (key.return && phase === 'complete' && onComplete) {
      onComplete();
    }
  });

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const progressPercent = progress.total > 0
    ? (progress.current / progress.total) * 100
    : 0;

  return (
    <Box flexDirection="column" height="100%">
      <Header compact />

      <StatusBar
        status={phase}
        sessionId={sessionId}
        currentFile={files.find(f => f.status === 'processing')?.path}
        progress={progress}
      />

      {/* Task Display */}
      <Box marginY={1} paddingX={1}>
        <Text color="gray">Task: </Text>
        <Text color="white">{truncateText(task, 70)}</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Left Panel - Agents and Progress */}
        <Box flexDirection="column" width="40%">
          <AgentStatus agents={agents} />

          <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
            <Text bold color="green">Progress</Text>
            <Text color="cyan">─────────────────────────────</Text>
            <Box marginTop={1}>
              <ProgressBar
                percent={progressPercent}
                width={30}
                label="Files:"
                color={phase === 'error' ? 'red' : 'green'}
              />
            </Box>
            <Box marginTop={1}>
              <Text color="gray">Duration: </Text>
              <Text color="white">{formatDuration(duration)}</Text>
            </Box>
            <Box>
              <Text color="gray">Phase: </Text>
              <Text color="cyan">{phase}</Text>
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Files and Logs */}
        <Box flexDirection="column" width="60%" marginLeft={1}>
          <Box borderStyle="round" borderColor="yellow" padding={1} height={12}>
            <Box flexDirection="column">
              <Text bold color="yellow">Files ({progress.current}/{progress.total})</Text>
              <Text color="cyan">─────────────────────────────────</Text>
              <FileList files={files} maxVisible={8} />
            </Box>
          </Box>

          <Box marginTop={1}>
            <LogView logs={logs} maxLines={10} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
        {phase === 'complete' ? (
          <Text color="green">✅ Complete! Press Enter to continue, Esc to exit</Text>
        ) : phase === 'error' ? (
          <Text color="red">❌ Error occurred. Press Esc to return</Text>
        ) : (
          <Text color="gray">Press Esc to cancel</Text>
        )}
      </Box>
    </Box>
  );
};