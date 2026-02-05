import React from "react";
import { Box, Text } from "ink";
import { Menu, MenuItem } from "../components/Menu.js";

interface DashboardProps {
  onNavigate: (screen: string) => void;
  stats?: {
    totalSessions: number;
    completedToday: number;
    failedToday: number;
    cacheEntries: number;
  };
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, stats }) => {
  const menuItems: MenuItem[] = [
    {
      label: "New Task",
      value: "new-task",
      icon: "🚀",
      description: "Start a new orchestration task",
    },
    {
      label: "Resume Session",
      value: "resume",
      icon: "↻",
      description: "Continue an interrupted session",
    },
    {
      label: "History",
      value: "history",
      icon: "📜",
      description: "View past sessions",
    },
    {
      label: "Settings",
      value: "settings",
      icon: "⚙️",
      description: "Configure Orchestra",
    },
    {
      label: "Doctor",
      value: "doctor",
      icon: "🩺",
      description: "Check system status",
    },
    { label: "Exit", value: "exit", icon: "👋", description: "Exit Orchestra" },
  ];

  const handleSelect = (item: MenuItem) => {
    onNavigate(item.value);
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Quick Stats */}
      {stats && (
        <Box
          marginBottom={2}
          borderStyle="round"
          borderColor="cyan"
          padding={1}
        >
          <Box flexDirection="row" justifyContent="space-around" width="100%">
            <Box flexDirection="column" alignItems="center">
              <Text bold color="cyan" backgroundColor="black">
                {String(stats.totalSessions)}
              </Text>
              <Text color="cyan">Total</Text>
            </Box>
            <Box flexDirection="column" alignItems="center">
              <Text bold color="green" backgroundColor="black">
                {String(stats.completedToday)}
              </Text>
              <Text color="green">Completed</Text>
            </Box>
            <Box flexDirection="column" alignItems="center">
              <Text bold color="red" backgroundColor="black">
                {String(stats.failedToday)}
              </Text>
              <Text color="red">Failed</Text>
            </Box>
            <Box flexDirection="column" alignItems="center">
              <Text bold color="blue" backgroundColor="black">
                {String(stats.cacheEntries)}
              </Text>
              <Text color="blue">Cached</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Main Menu */}
      <Box flexDirection="row">
        <Box flexDirection="column" width="50%">
          <Menu items={menuItems} onSelect={handleSelect} title="Main Menu" />
        </Box>

        {/* Shortcuts */}
        <Box flexDirection="column" marginLeft={4}>
          <Text bold color="cyan" backgroundColor="black">
            Keyboard Shortcuts
          </Text>
          <Text color="cyan">─────────────────────</Text>
          <Box marginTop={1}>
            <Text color="yellow" backgroundColor="black">n</Text>
            <Text color="cyan"> - New task</Text>
          </Box>
          <Box>
            <Text color="yellow" backgroundColor="black">r</Text>
            <Text color="cyan"> - Resume session</Text>
          </Box>
          <Box>
            <Text color="yellow" backgroundColor="black">h</Text>
            <Text color="cyan"> - History</Text>
          </Box>
          <Box>
            <Text color="yellow" backgroundColor="black">s</Text>
            <Text color="cyan"> - Settings</Text>
          </Box>
          <Box>
            <Text color="yellow" backgroundColor="black">q</Text>
            <Text color="cyan"> - Quit</Text>
          </Box>
        </Box>
      </Box>

      {/* Footer hint */}
      <Box marginTop={2}>
        <Text color="yellow" backgroundColor="black">Use ↑/↓ to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
};
