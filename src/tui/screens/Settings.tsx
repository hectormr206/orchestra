import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface SettingsConfig {
  parallel: boolean;
  maxConcurrency: number;
  autoApprove: boolean;
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
  // Recovery Mode settings
  maxRecoveryAttempts: number;
  recoveryTimeoutMinutes: number;
  autoRevertOnFailure: boolean;
}

interface SettingsProps {
  config: SettingsConfig;
  onChange: (config: SettingsConfig) => void;
  onSave: () => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  config,
  onChange,
  onSave,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingText, setEditingText] = useState(false);

  const settings = [
    { key: "parallel", label: "Parallel Execution", type: "boolean" },
    {
      key: "maxConcurrency",
      label: "Max Concurrency",
      type: "number",
      min: 1,
      max: 10,
    },
    { key: "autoApprove", label: "Auto-approve Plans", type: "boolean" },
    { key: "runTests", label: "Run Tests After", type: "boolean" },
    { key: "testCommand", label: "Test Command", type: "string" },
    { key: "gitCommit", label: "Git Auto-commit", type: "boolean" },
    { key: "notifications", label: "Desktop Notifications", type: "boolean" },
    { key: "cacheEnabled", label: "Cache Results", type: "boolean" },
    // Recovery Mode settings
    {
      key: "maxRecoveryAttempts",
      label: "Recovery Attempts",
      type: "number",
      min: 1,
      max: 10,
    },
    {
      key: "recoveryTimeoutMinutes",
      label: "Recovery Timeout (min)",
      type: "number",
      min: 1,
      max: 60,
    },
    {
      key: "autoRevertOnFailure",
      label: "Auto-revert on Failure",
      type: "boolean",
    },
  ] as const;

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
    if (key.upArrow && !editingText) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow && !editingText) {
      setSelectedIndex((prev) => Math.min(settings.length - 1, prev + 1));
    }

    const currentSetting = settings[selectedIndex];

    if (currentSetting.type === "boolean" && (input === " " || key.return)) {
      onChange({
        ...config,
        [currentSetting.key]:
          !config[currentSetting.key as keyof SettingsConfig],
      });
    }

    if (currentSetting.type === "number") {
      if (key.leftArrow) {
        const newValue = Math.max(
          currentSetting.min || 1,
          (config[currentSetting.key as keyof SettingsConfig] as number) - 1,
        );
        onChange({ ...config, [currentSetting.key]: newValue });
      }
      if (key.rightArrow) {
        const newValue = Math.min(
          currentSetting.max || 10,
          (config[currentSetting.key as keyof SettingsConfig] as number) + 1,
        );
        onChange({ ...config, [currentSetting.key]: newValue });
      }
    }

    if (input === "s") {
      onSave();
    }
  });

  const renderValue = (setting: (typeof settings)[number]) => {
    const value = config[setting.key as keyof SettingsConfig];

    if (setting.type === "boolean") {
      // Fixed width for boolean values: "[x] Enabled " or "[ ] Disabled"
      return (
        <Box width={16}>
          <Text color={value ? "green" : "red"}>
            [{value ? "x" : " "}] {value ? "Enabled " : "Disabled"}
          </Text>
        </Box>
      );
    }

    if (setting.type === "number") {
      // Pad number to 2 digits for consistent width
      const paddedValue = String(value).padStart(2, " ");
      return (
        <Box width={10}>
          <Text color="cyan">
            {"<"} {paddedValue} {">"}
          </Text>
        </Box>
      );
    }

    return (
      <Box width={20}>
        <Text color="yellow">{String(value) || "(not set)"}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
          ⚙️ SETTINGS
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {settings.map((setting, index) => (
          <Box
            key={setting.key}
            backgroundColor={selectedIndex === index ? "blue" : undefined}
            paddingX={1}
          >
            <Box width={3}>
              <Text color={selectedIndex === index ? "white" : "gray"}>
                {selectedIndex === index ? "> " : "  "}
              </Text>
            </Box>
            <Box width={26}>
              <Text color={selectedIndex === index ? "white" : "gray"}>
                {setting.label}
              </Text>
            </Box>
            {renderValue(setting)}
          </Box>
        ))}
      </Box>

      {/* Instructions based on selected setting type - fixed width */}
      <Box
        marginTop={2}
        borderStyle="round"
        borderColor="yellow"
        padding={1}
        width={30}
      >
        <Text color="yellow">
          {settings[selectedIndex].type === "boolean" &&
            "Space/Enter: Toggle  "}
          {settings[selectedIndex].type === "number" && "Left/Right: Adjust   "}
          {settings[selectedIndex].type === "string" && "Enter: Edit text     "}
        </Text>
      </Box>

      {/* Help */}
      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          ↑/↓: Navigate │ s: Save │ Esc: Back (without saving)
        </Text>
      </Box>
    </Box>
  );
};
