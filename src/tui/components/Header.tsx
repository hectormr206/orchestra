import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <Box borderStyle="single" borderColor="cyan" paddingX={1} backgroundColor="black">
        <Text bold color="magenta" backgroundColor="black">
          ORCHESTRA
        </Text>
        <Text color="cyan" backgroundColor="black"> v0.1.0 | Meta-Orchestrator</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold color="magenta" backgroundColor="black">
        {`  ___  ____   ____ _   _ _____ ____ _____ ____      _    `}
      </Text>
      <Text bold color="cyan" backgroundColor="black">
        {` / _ \\|  _ \\ / ___| | | | ____/ ___|_   _|  _ \\    / \\   `}
      </Text>
      <Text bold color="green" backgroundColor="black">
        {`| | | | |_) | |   | |_| |  _| \\___ \\ | | | |_) |  / _ \\  `}
      </Text>
      <Text bold color="yellow" backgroundColor="black">
        {`| |_| |  _ <| |___|  _  | |___ ___) || | |  _ <  / ___ \\ `}
      </Text>
      <Text bold color="red" backgroundColor="black">
        {` \\___/|_| \\_\\\\____|_| |_|_____|____/ |_| |_| \\_\\/_/   \\_\\`}
      </Text>
      <Box marginTop={1}>
        <Text color="cyan" backgroundColor="black">Meta-Orchestrator for AI Development Tools</Text>
      </Box>
      <Text color="cyan" backgroundColor="black">------------------------------------------------</Text>
    </Box>
  );
};
