import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

const STATUS_WIDTH = 2;
const DURATION_WIDTH = 8;
const MAX_PATH_LENGTH = 50;

export interface FileStatus {
  path: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  duration?: number;
  error?: string;
}

interface FileListProps {
  files: FileStatus[];
  maxVisible?: number;
}

function truncatePath(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  const suffix = '...';
  const truncatedLength = max - suffix.length;

  if (truncatedLength <= 0) {
    return suffix.substring(0, max);
  }

  const segments = value.split('/');
  if (segments.length <= 2) {
    return value.substring(0, truncatedLength) + suffix;
  }

  const first = segments[0];
  const last = segments[segments.length - 1];
  const middleAvailable = max - first.length - last.length - 4;

  if (middleAvailable <= 0) {
    return value.substring(0, truncatedLength) + suffix;
  }

  return `${first}/.../${last}`;
}

function formatDuration(durationInMs?: number): string {
  if (durationInMs === undefined || durationInMs === null) {
    return '';
  }
  return `(${(durationInMs / 1000).toFixed(1)}s)`;
}

export const FileList: React.FC<FileListProps> = ({ files, maxVisible = 10 }) => {
  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'pending': return <Text color="gray">◯</Text>;
      case 'processing': return <Text color="yellow"><Spinner type="dots" /></Text>;
      case 'complete': return <Text color="green">✓</Text>;
      case 'error': return <Text color="red">✗</Text>;
    }
  };

  const getStatusColor = (status: FileStatus['status']) => {
    switch (status) {
      case 'pending': return 'gray';
      case 'processing': return 'yellow';
      case 'complete': return 'green';
      case 'error': return 'red';
    }
  };

  const visibleFiles = files.slice(-maxVisible);
  const hiddenCount = files.length - maxVisible;

  return (
    <Box flexDirection="column" width="100%">
      {hiddenCount > 0 && (
        <Text color="gray" dimColor>... and {hiddenCount} more files above</Text>
      )}
      {visibleFiles.map((file, index) => (
        <Box
          key={file.path + index}
          width="100%"
          flexGrow={1}
          flexShrink={0}
        >
          <Box width={STATUS_WIDTH} flexShrink={0}>
            {getStatusIcon(file.status)}
          </Box>
          <Box flexGrow={1} flexShrink={1}>
            <Text color={getStatusColor(file.status)}>
              {' '}{truncatePath(file.path, MAX_PATH_LENGTH)}
            </Text>
          </Box>
          {file.duration !== undefined && (
            <Box width={DURATION_WIDTH} flexShrink={0}>
              <Text color="gray">{formatDuration(file.duration)}</Text>
            </Box>
          )}
          {file.error && (
            <Text color="red"> - {file.error.substring(0, 30)}...</Text>
          )}
        </Box>
      ))}
    </Box>
  );
};