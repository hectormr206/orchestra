import React from 'react';
import { Box, Text } from 'ink';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  agent?: string;
}

interface LogViewProps {
  logs: LogEntry[];
  maxLines?: number;
  showTimestamp?: boolean;
}

export const LogView: React.FC<LogViewProps> = ({
  logs,
  maxLines = 15,
  showTimestamp = true,
}) => {
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'blue';
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'debug': return 'gray';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'ℹ';
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'debug': return '·';
    }
  };

  const visibleLogs = logs.slice(-maxLines);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      padding={1}
      height={maxLines + 3}
    >
      <Text bold color="white">Logs</Text>
      <Text color="gray">{'─'.repeat(50)}</Text>
      {visibleLogs.length === 0 ? (
        <Text color="gray" dimColor>No logs yet...</Text>
      ) : (
        visibleLogs.map((log, index) => (
          <Box key={index}>
            {showTimestamp && (
              <Text color="gray" dimColor>
                {log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}{' '}
              </Text>
            )}
            <Text color={getLevelColor(log.level)}>
              {getLevelIcon(log.level)}{' '}
            </Text>
            {log.agent && (
              <Text color="cyan">[{log.agent}] </Text>
            )}
            <Text color="white">{log.message}</Text>
          </Box>
        ))
      )}
    </Box>
  );
};
