import React from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  percent: number;
  width?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  percent,
  width = 40,
  label,
  showPercent = true,
  color = 'green',
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const filledWidth = Math.round((clampedPercent / 100) * width);
  const emptyWidth = width - filledWidth;

  const filled = '='.repeat(filledWidth);
  const empty = '-'.repeat(emptyWidth);

  return (
    <Box>
      {label && <Text color="cyan">{label} </Text>}
      <Text color={color}>{filled}</Text>
      <Text color="cyan">{empty}</Text>
      {showPercent && (
        <Text color="cyan"> {clampedPercent.toFixed(0)}%</Text>
      )}
    </Box>
  );
});
