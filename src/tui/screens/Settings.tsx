import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { TUISettings } from "../../utils/configLoader.js";
import type { ModelType } from "../../types.js";

interface SettingsProps {
  config: TUISettings;
  onChange: (config: TUISettings) => void;
  onSave: () => void;
  onBack: () => void;
  onAdvancedSettings?: () => void;
}

type SettingItem =
  | { key: string; label: string; type: "boolean" }
  | { key: string; label: string; type: "number"; min: number; max: number }
  | { key: string; label: string; type: "string" }
  | { key: string; label: string; type: "select"; options: readonly string[] }
  | { key: "advanced"; label: string; type: "action" };

export const Settings: React.FC<SettingsProps> = ({
  config,
  onChange,
  onSave,
  onBack,
  onAdvancedSettings,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingText, setEditingText] = useState(false);

  const models = ["Claude (Kimi)", "Claude (GLM)", "Gemini", "Codex", "Claude"];

  const settings: readonly SettingItem[] = [
    // --- Architect ---
    {
      key: "agents.architect.0",
      label: "Architect (Primary)",
      type: "select",
      options: models,
    },
    {
      key: "agents.architect.1",
      label: "Architect (Fallback 1)",
      type: "select",
      options: models,
    },
    {
      key: "agents.architect.2",
      label: "Architect (Fallback 2)",
      type: "select",
      options: models,
    },
    {
      key: "agents.architect.3",
      label: "Architect (Fallback 3)",
      type: "select",
      options: models,
    },

    // --- Executor ---
    {
      key: "agents.executor.0",
      label: "Executor (Primary)",
      type: "select",
      options: models,
    },
    {
      key: "agents.executor.1",
      label: "Executor (Fallback 1)",
      type: "select",
      options: models,
    },

    // --- Auditor ---
    {
      key: "agents.auditor.0",
      label: "Auditor (Primary)",
      type: "select",
      options: models,
    },
    {
      key: "agents.auditor.1",
      label: "Auditor (Fallback 1)",
      type: "select",
      options: models,
    },
    {
      key: "agents.auditor.2",
      label: "Auditor (Fallback 2)",
      type: "select",
      options: models,
    },

    // --- Consultant ---
    {
      key: "agents.consultant.0",
      label: "Consultant (Primary)",
      type: "select",
      options: models,
    },
    {
      key: "agents.consultant.1",
      label: "Consultant (Fallback 1)",
      type: "select",
      options: models,
    },

    // --- General Settings ---
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
    // Observer settings
    { key: "observerEnabled", label: "Observer Validation", type: "boolean" },
    {
      key: "observerMode",
      label: "Observer Mode",
      type: "select",
      options: ["web", "output"],
    },
    { key: "observerAppUrl", label: "Observer App URL", type: "string" },
    { key: "observerDevServerCommand", label: "Dev Server Command", type: "string" },
    {
      key: "observerVisionModel",
      label: "Vision Model",
      type: "select",
      options: ["kimi", "glm"],
    },
    { key: "observerRoutes", label: "Routes (web mode)", type: "string" },
    { key: "observerCommands", label: "Commands (output mode)", type: "string" },

    { key: "advanced", label: "Advanced Settings...", type: "action" },
  ] as SettingItem[];

  // Helper to access nested keys safely
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((o, i) => o?.[i], obj);
  };

  const setNestedValue = (obj: any, path: string, value: any): any => {
    if (!path.includes(".")) {
      return { ...obj, [path]: value };
    }
    const [head, ...rest] = path.split(".");
    const child = obj[head];
    if (Array.isArray(child)) {
      const idx = Number(rest[0]);
      if (rest.length === 1) {
        const newArr = [...child];
        newArr[idx] = value;
        return { ...obj, [head]: newArr };
      }
      const newArr = [...child];
      newArr[idx] = setNestedValue(child[idx], rest.slice(1).join("."), value);
      return { ...obj, [head]: newArr };
    }
    return { ...obj, [head]: setNestedValue(child ?? {}, rest.join("."), value) };
  };

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
    const currentValue = getNestedValue(config, currentSetting.key);

    // Handle action type (Advanced Settings)
    if (currentSetting.type === "action" && (input === " " || key.return)) {
      if (currentSetting.key === "advanced" && onAdvancedSettings) {
        onAdvancedSettings();
      }
      return;
    }

    if (currentSetting.type === "boolean" && (input === " " || key.return)) {
      onChange(setNestedValue(config, currentSetting.key, !currentValue));
    }

    if (currentSetting.type === "number") {
      if (key.leftArrow) {
        const newValue = Math.max(
          currentSetting.min || 1,
          (currentValue as number) - 1,
        );
        onChange(setNestedValue(config, currentSetting.key, newValue));
      }
      if (key.rightArrow) {
        const newValue = Math.min(
          currentSetting.max || 10,
          (currentValue as number) + 1,
        );
        onChange(setNestedValue(config, currentSetting.key, newValue));
      }
    }

    if (currentSetting.type === "select") {
      const options = currentSetting.options;
      const currentIndex = options.indexOf(currentValue as string);

      if (key.leftArrow) {
        const newIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(setNestedValue(config, currentSetting.key, options[newIndex]));
      }
      if (key.rightArrow) {
        const newIndex = (currentIndex + 1) % options.length;
        onChange(setNestedValue(config, currentSetting.key, options[newIndex]));
      }
    }

    if (input === "s") {
      onSave();
    }
  });

  const renderValue = (setting: SettingItem) => {
    const value = getNestedValue(config, setting.key);

    if (setting.type === "action") {
      return (
        <Box width={20}>
          <Text color="cyan">→</Text>
        </Box>
      );
    }

    if (setting.type === "boolean") {
      return (
        <Box width={16}>
          <Text color={value ? "green" : "red"}>
            [{value ? "x" : " "}] {value ? "Enabled " : "Disabled"}
          </Text>
        </Box>
      );
    }

    if (setting.type === "number") {
      const paddedValue = String(value).padStart(2, " ");
      return (
        <Box width={10}>
          <Text color="cyan">
            {"<"} {paddedValue} {">"}
          </Text>
        </Box>
      );
    }

    if (setting.type === "select") {
      return (
        <Box width={30}>
          <Text color="cyan">
            {"< "}
          </Text>
          <Text color="green" bold>
            {value as string}
          </Text>
          <Text color="cyan">
            {" >"}
          </Text>
        </Box>
      );
    }

    return (
      <Box width={20}>
        <Text color="yellow">
          {String(value) || "(not set)"}
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="single" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">
          SETTINGS
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {settings.map((setting, index) => (
          <Box
            key={setting.key}
            paddingX={1}
          >
            <Box
              width={3}
            >
              <Text
                color="white"
              >
                {selectedIndex === index ? "> " : "  "}
              </Text>
            </Box>
            <Box
              width={26}
            >
              <Text
                color="white"
              >
                {setting.label}
              </Text>
            </Box>
            {renderValue(setting)}
          </Box>
        ))}
      </Box>

      {/* Instructions */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="yellow"
        padding={1}
        width={40}
      >
        <Text color="yellow">
          {settings[selectedIndex].type === "boolean" && "Space/Enter: Toggle"}
          {(settings[selectedIndex].type === "number" ||
            settings[selectedIndex].type === "select") &&
            "Left/Right: Change Value"}
          {settings[selectedIndex].type === "string" && "Enter: Edit text"}
          {settings[selectedIndex].type === "action" && "Enter: Open"}
        </Text>
      </Box>

      {/* Help */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          ↑/↓: Navigate | s: Save | Esc: Back (without saving)
        </Text>
      </Box>
    </Box>
  );
};
