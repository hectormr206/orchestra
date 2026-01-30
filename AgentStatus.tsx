import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface AgentInfo {
  name: string;
  adapter: string;
  status: 'idle' | 'working' | 'complete' | 'error' | 'fallback';
  duration?: number;
  fallbackFrom?: string;
}

interface AgentStatusProps {
  agents: AgentInfo[];
}

const MAX_NAME_LENGTH = 12;
const MAX_ADAPTER_LENGTH = 10;
const MAX_STATUS_LENGTH = 18;

const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 2) + '..';
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

export const AgentStatus: React.FC<AgentStatusProps> = ({ agents }) => {
  const getStatusDisplay = (agent: AgentInfo) => {
    switch (agent.status) {
      case 'idle':
        return <Text color="gray">◯ Idle</Text>;
      case 'working':
        return (
          <Text color="yellow">
            <Spinner type="dots" /> Working...
          </Text>
        );
      case 'complete':
        return (
          <Text color="green">
            ✓ Done {agent.duration ? `(${formatDuration(agent.duration).padStart(7, ' ')})` : '       '}
          </Text>
        );
      case 'error':
        return <Text color="red">✗ Error            </Text>;
      case 'fallback':
        return (
          <Text color="magenta">
            ↻ Fallback {truncateString(agent.fallbackFrom || 'unknown', MAX_ADAPTER_LENGTH)}
          </Text>
        );
    }
  };

  const getAgentIcon = (name: string) => {
    if (name.toLowerCase().includes('architect')) return '📐';
    if (name.toLowerCase().includes('executor')) return '⚡';
    if (name.toLowerCase().includes('auditor')) return '🔍';
    if (name.toLowerCase().includes('consultant')) return '💡';
    return '🤖';
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="blue" padding={1}>
      <Text bold color="blue">Agents</Text>
      <Text color="cyan">─────────────────────────────</Text>
      {agents.map((agent) => (
        <Box key={agent.name} marginTop={1}>
          <Box width={14}>
            <Text>
              {getAgentIcon(agent.name)} {truncateString(agent.name, MAX_NAME_LENGTH)}
            </Text>
          </Box>
          <Box width={12}>
            <Text color="gray">{truncateString(agent.adapter, MAX_ADAPTER_LENGTH)}</Text>
          </Box>
          <Box width={MAX_STATUS_LENGTH}>
            {getStatusDisplay(agent)}
          </Box>
        </Box>
      ))}
    </Box>
  );
};