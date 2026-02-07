import React from "react";
import { Box, Text } from "ink";

export interface AgentInfo {
  name: string;
  adapter: string;
  status: "idle" | "working" | "complete" | "error" | "fallback";
  duration?: number;
  fallbackFrom?: string;
}

interface AgentStatusProps {
  agents: AgentInfo[];
}

const getStatusDisplay = (agent: AgentInfo) => {
  switch (agent.status) {
    case "idle":
      return <Text color="gray">- Idle</Text>;
    case "working":
      return <Text color="yellow">{">"} Working...</Text>;
    case "complete":
      return (
        <Text color="green">
          + Done{" "}
          {agent.duration ? `(${(agent.duration / 1000).toFixed(1)}s)` : ""}
        </Text>
      );
    case "error":
      return <Text color="red">x Error</Text>;
    case "fallback":
      return (
        <Text color="magenta">~ Fallback from {agent.fallbackFrom}</Text>
      );
  }
};

const agentsAreEqual = (prev: AgentStatusProps, next: AgentStatusProps) => {
  if (prev.agents.length !== next.agents.length) return false;
  for (let i = 0; i < prev.agents.length; i++) {
    const a = prev.agents[i];
    const b = next.agents[i];
    if (
      a.name !== b.name ||
      a.adapter !== b.adapter ||
      a.status !== b.status ||
      a.duration !== b.duration ||
      a.fallbackFrom !== b.fallbackFrom
    )
      return false;
  }
  return true;
};

export const AgentStatus: React.FC<AgentStatusProps> = React.memo(({ agents }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      padding={1}
    >
      <Text bold color="blue">
        Agents
      </Text>
      {agents.map((agent) => (
        <Box key={agent.name} marginTop={1}>
          <Box width={16}>
            <Text>{agent.name}</Text>
          </Box>
          <Box width={15}>
            <Text color="gray">{agent.adapter}</Text>
          </Box>
          <Box>{getStatusDisplay(agent)}</Box>
        </Box>
      ))}
    </Box>
  );
}, agentsAreEqual);
