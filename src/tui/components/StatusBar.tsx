import React from "react";
import { Box, Text } from "ink";

type Status =
  | "idle"
  | "planning"
  | "executing"
  | "auditing"
  | "recovery"
  | "observing"
  | "complete"
  | "error";

interface StatusBarProps {
  status: Status;
  sessionId?: string;
  currentFile?: string;
  progress?: { current: number; total: number };
}

const getStatusColor = (status: Status) => {
  switch (status) {
    case "idle":
      return "gray";
    case "planning":
      return "blue";
    case "executing":
      return "yellow";
    case "auditing":
      return "magenta";
    case "recovery":
      return "#FFA500";
    case "observing":
      return "#9B59B6";
    case "complete":
      return "green";
    case "error":
      return "red";
    default:
      return "white";
  }
};

const getStatusIcon = (status: Status) => {
  switch (status) {
    case "idle":
      return "-";
    case "planning":
      return "*";
    case "executing":
      return ">";
    case "auditing":
      return "?";
    case "recovery":
      return "~";
    case "observing":
      return "o";
    case "complete":
      return "+";
    case "error":
      return "x";
    default:
      return "?";
  }
};

export const StatusBar: React.FC<StatusBarProps> = React.memo(({
  status,
  sessionId,
  currentFile,
  progress,
}) => {
  const color = getStatusColor(status);

  return (
    <Box
      borderStyle="single"
      borderColor={color}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box>
        <Box width={4}>
          <Text color={color}>
            {getStatusIcon(status)}
          </Text>
        </Box>
        <Text color={color}>
          {status.toUpperCase()}
        </Text>
        {currentFile && (
          <Text color="cyan">
            {" "}| {currentFile}
          </Text>
        )}
      </Box>
      <Box>
        {progress && (
          <Text color="cyan">{`[${progress.current}/${progress.total}]`}</Text>
        )}
        {sessionId && (
          <Text color="cyan">
            {" "}| Session: {sessionId.substring(0, 8)}
          </Text>
        )}
      </Box>
    </Box>
  );
});
