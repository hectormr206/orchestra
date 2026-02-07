import React, { useMemo } from "react";
import { Box, Text, useInput } from "ink";
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
    | "observing"
    | "complete"
    | "error";
  agents: AgentInfo[];
  files: FileStatus[];
  logs: LogEntry[];
  progress: { current: number; total: number };
  startTime: number;
  isRunning: boolean;
  onCancel?: () => void;
  onComplete?: () => void;
}

export const Execution: React.FC<ExecutionProps> = React.memo(({
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
      if ((phase === "error" || phase === "complete") && onComplete) {
        onComplete();
      } else if (onCancel) {
        onCancel();
      }
    }
    if (key.return && phase === "complete" && onComplete) {
      onComplete();
    }
  });

  const currentFile = useMemo(
    () => files.find((f) => f.status === "processing")?.path,
    [files],
  );

  const progressPercent = useMemo(
    () => (progress.total > 0 ? (progress.current / progress.total) * 100 : 0),
    [progress.current, progress.total],
  );

  const phaseStatus = phase === "planning" || phase === "executing" || phase === "auditing" ||
    phase === "recovery" || phase === "observing" || phase === "complete" || phase === "error"
    ? phase : "idle" as const;

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar
        status={phaseStatus}
        sessionId={sessionId}
        currentFile={currentFile}
        progress={progress}
      />

      {/* Task Display */}
      <Box marginY={1} paddingX={1}>
        <Text color="white">Task: </Text>
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
            borderStyle="single"
            borderColor="gray"
            padding={1}
          >
            <Text bold color="green">
              Progress
            </Text>
            <Box marginTop={1}>
              <ProgressBar
                percent={progressPercent}
                width={30}
                label="Files:"
                color={phase === "error" ? "red" : "green"}
              />
            </Box>
            <Box marginTop={1}>
              <Text color="white">Duration: </Text>
              <DurationDisplay startTime={startTime} isRunning={isRunning} />
            </Box>
            <Box>
              <Text color="white">Phase: </Text>
              <Text
                color={phase === "recovery" ? "yellow" : phase === "observing" ? "#9B59B6" : "cyan"}
              >
                {phase}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Right Panel - Files and Logs */}
        <Box flexDirection="column" width="60%" marginLeft={1}>
          <Box
            borderStyle="single"
            borderColor="gray"
            padding={1}
            height={12}
          >
            <Box flexDirection="column">
              <Text bold color="yellow">
                {`Files (${progress.current}/${progress.total})`}
              </Text>
              <FileList files={files} maxVisible={8} />
            </Box>
          </Box>

          <Box marginTop={1}>
            <LogView logs={logs} maxLines={10} enableScroll={true} isActive={true} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        marginTop={1}
      >
        {phase === "complete" ? (
          <Text color="green">
            Complete! Press Enter to continue, Esc to exit
          </Text>
        ) : phase === "error" ? (
          <Text color="red">
            Error occurred. Press Esc to return
          </Text>
        ) : (
          <Text color="white">
            Press Esc to cancel
          </Text>
        )}
      </Box>
    </Box>
  );
});
