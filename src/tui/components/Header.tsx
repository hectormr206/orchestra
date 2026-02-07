import React from "react";
import { Box, Text } from "ink";

export const Header: React.FC = React.memo(() => {
  return (
    <Box paddingX={1}>
      <Text bold color="cyan">orchestra</Text>
      <Text color="gray" dimColor> {process.cwd()}</Text>
    </Box>
  );
});
