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
            ✓ Done {agent.duration ? `(${(agent.duration / 1000).toFixed(1)}s)` : ''}
          </Text>
        );
      case 'error':
        return <Text color="red">✗ Error</Text>;
      case 'fallback':
        return (
          <Text color="magenta">
            ↻ Fallback from {agent.fallbackFrom}
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
          <Box width={20}>
            <Text>
              {getAgentIcon(agent.name)} {agent.name}
            </Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{agent.adapter}</Text>
          </Box>
          <Box>{getStatusDisplay(agent)}</Box>
        </Box>
      ))}
    </Box>
  );
};
