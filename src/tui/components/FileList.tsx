import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

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
    <Box flexDirection="column">
      {hiddenCount > 0 && (
        <Text color="gray" dimColor>... and {hiddenCount} more files above</Text>
      )}
      {visibleFiles.map((file, index) => (
        <Box key={file.path + index}>
          {getStatusIcon(file.status)}
          <Text color={getStatusColor(file.status)}> {file.path}</Text>
          {file.duration && (
            <Text color="gray"> ({(file.duration / 1000).toFixed(1)}s)</Text>
          )}
          {file.error && (
            <Text color="red"> - {file.error.substring(0, 30)}...</Text>
          )}
        </Box>
      ))}
    </Box>
  );
};
