import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

interface HeaderProps {
  compact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Gradient name="rainbow">
          <Text bold>🎵 ORCHESTRA</Text>
        </Gradient>
        <Text color="gray"> v0.1.0 │ Meta-Orchestrator</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="rainbow">
        <BigText text="ORCHESTRA" font="chrome" />
      </Gradient>
      <Text color="gray">Meta-Orchestrator for AI Development Tools</Text>
      <Text color="cyan">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
    </Box>
  );
};
