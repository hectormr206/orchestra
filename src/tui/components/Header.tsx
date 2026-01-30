import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text bold color="magenta">
          ORCHESTRA
        </Text>
        <Text color="gray"> v0.1.0 | Meta-Orchestrator</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold color="magenta">
        {`  ___  ____   ____ _   _ _____ ____ _____ ____      _    `}
      </Text>
      <Text bold color="cyan">
        {` / _ \\|  _ \\ / ___| | | | ____/ ___|_   _|  _ \\    / \\   `}
      </Text>
      <Text bold color="green">
        {`| | | | |_) | |   | |_| |  _| \\___ \\ | | | |_) |  / _ \\  `}
      </Text>
      <Text bold color="yellow">
        {`| |_| |  _ <| |___|  _  | |___ ___) || | |  _ <  / ___ \\ `}
      </Text>
      <Text bold color="red">
        {` \\___/|_| \\_\\\\____|_| |_|_____|____/ |_| |_| \\_\\/_/   \\_\\`}
      </Text>
      <Box marginTop={1}>
        <Text color="gray">Meta-Orchestrator for AI Development Tools</Text>
      </Box>
      <Text color="cyan">------------------------------------------------</Text>
    </Box>
  );
};
