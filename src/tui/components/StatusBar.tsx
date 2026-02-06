import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  status:
    | "idle"
    | "planning"
    | "executing"
    | "auditing"
    | "recovery"
    | "complete"
    | "error";
  sessionId?: string;
  currentFile?: string;
  progress?: { current: number; total: number };
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  sessionId,
  currentFile,
  progress,
}) => {
  const getStatusColor = () => {
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
        return "#FFA500"; // Orange for recovery
      case "complete":
        return "green";
      case "error":
        return "red";
      default:
        return "white";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "idle":
        return "◯";
      case "planning":
        return "📝";
      case "executing":
        return "⚡";
      case "auditing":
        return "🔍";
      case "recovery":
        return "🔄";
      case "complete":
        return "✅";
      case "error":
        return "❌";
      default:
        return "?";
    }
  };

  return (
    <Box
      borderStyle="single"
      borderColor={getStatusColor()}
      paddingX={1}
      justifyContent="space-between"
      backgroundColor="black"
    >
      <Box>
        <Box width={4}>
          <Text color={getStatusColor()} backgroundColor="black">
            {getStatusIcon()}
          </Text>
        </Box>
        <Text color={getStatusColor()} backgroundColor="black">
          {status.toUpperCase()}
        </Text>
        {currentFile && (
          <Text color="cyan" backgroundColor="black">
            {" "}
            │ {currentFile}
          </Text>
        )}
      </Box>
      <Box>
        {progress && (
          <Text
            color="cyan"
            backgroundColor="black"
          >{`[${progress.current}/${progress.total}]`}</Text>
        )}
        {sessionId && (
          <Text color="cyan" backgroundColor="black">
            {" "}
            │ Session: {sessionId.substring(0, 8)}
          </Text>
        )}
      </Box>
    </Box>
  );
};
