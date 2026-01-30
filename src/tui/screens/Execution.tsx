import React from "react";
import { Box, Text, useInput } from "ink";
import { Header } from "../components/Header.js";
import { StatusBar } from "../components/StatusBar.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { FileList, FileStatus } from "../components/FileList.js";
import { AgentStatus, AgentInfo } from "../components/AgentStatus.js";
import { LogView, LogEntry } from "../components/LogView.js";
import { DurationDisplay } from "../components/DurationDisplay.js";

interface ExecutionProps {
  task: string;
  sessionId: string;
  phase:
    | "planning"
    | "executing"
    | "auditing"
    | "recovery"
    | "complete"
    | "error";
  agents: AgentInfo[];
  files: FileStatus[];
  logs: LogEntry[];
  progress: { current: number; total: number };
  startTime: number; // Changed from duration - DurationDisplay calculates locally
  isRunning: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
}

export const Execution: React.FC<ExecutionProps> = ({
  task,
  sessionId,
  phase,
  agents,
  files,
  logs,
  progress,
  startTime,
  isRunning,
  onCancel,
  onComplete,
}) => {
  useInput((input, key) => {
    if (key.escape) {
      // On error or complete, Esc should navigate back to dashboard
      if ((phase === "error" || phase === "complete") && onComplete) {
        onComplete();
      } else if (onCancel) {
        // During active phases, Esc cancels the task
        onCancel();
      }
    }
    if (key.return && phase === "complete" && onComplete) {
      onComplete();
    }
  });

  const getPhaseStatus = ():
    | "idle"
    | "planning"
    | "executing"
    | "auditing"
    | "recovery"
    | "complete"
    | "error" => {
    switch (phase) {
      case "planning":
        return "planning";
      case "executing":
        return "executing";
      case "auditing":
        return "auditing";
      case "recovery":
        return "recovery";
      case "complete":
        return "complete";
      case "error":
        return "error";
      default:
        return "idle";
    }
  };

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Box flexDirection="column" height="100%">
      <Header compact />

      <StatusBar
        status={getPhaseStatus()}
        sessionId={sessionId}
        currentFile={files.find((f) => f.status === "processing")?.path}
        progress={progress}
      />

      {/* Task Display */}
      <Box marginY={1} paddingX={1}>
        <Text color="gray">Task: </Text>
        <Text color="white">
          {task.substring(0, 70)}
          {task.length > 70 ? "..." : ""}
        </Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Left Panel - Agents and Progress */}
        <Box flexDirection="column" width="40%">
          <AgentStatus agents={agents} />

          <Box
            marginTop={1}
            flexDirection="column"
            borderStyle="round"
            borderColor="green"
            padding={1}
          >
            <Text bold color="green">
              Progress
            </Text>
            <Text color="cyan">─────────────────────────────</Text>
            <Box marginTop={1}>
              <ProgressBar
                percent={progressPercent}
                width={30}
                label="Files:"
                color={phase === "error" ? "red" : "green"}
              />
            </Box>
            <Box marginTop={1}>
              <Text color="gray">Duration: </Text>
              <DurationDisplay startTime={startTime} isRunning={isRunning} />
            </Box>
            <Box>
              <Text color="gray">Phase: </Text>
              <Text color={phase === "recovery" ? "yellow" : "cyan"}>
                {phase === "recovery" ? "🔄 Recovery" : phase}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Files and Logs */}
        <Box flexDirection="column" width="60%" marginLeft={1}>
          <Box borderStyle="round" borderColor="yellow" padding={1} height={12}>
            <Box flexDirection="column">
              <Text bold color="yellow">
                Files ({progress.current}/{progress.total})
              </Text>
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
        {phase === "complete" ? (
          <Text color="green">
            ✅ Complete! Press Enter to continue, Esc to exit
          </Text>
        ) : phase === "error" ? (
          <Text color="red">❌ Error occurred. Press Esc to return</Text>
        ) : (
          <Text color="gray">Press Esc to cancel</Text>
        )}
      </Box>
    </Box>
  );
};
