import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import {
  loadSettings,
  saveSettings,
  type TUISettings,
} from "../../utils/configLoader.js";

interface AdvancedSettingsProps {
  config: TUISettings;
  onChange: (config: TUISettings) => void;
  onSave: () => void;
  onBack: () => void;
}

type SettingCategory =
  | "adapters"
  | "recovery"
  | "parallelization"
  | "cache"
  | "agents";

interface SettingItem {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  value: any;
  options?: string[];
  category: SettingCategory;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  onChange,
  onSave,
  onBack,
}) => {
  const [currentCategory, setCurrentCategory] =
    useState<SettingCategory>("adapters");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingValue, setEditingValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const categories: Array<{ value: SettingCategory; label: string }> = [
    { value: "adapters", label: "🤖 Adapters" },
    { value: "recovery", label: "🔧 Recovery" },
    { value: "parallelization", label: "⚡ Parallelization" },
    { value: "cache", label: "💾 Cache" },
    { value: "agents", label: "👥 Agent Models" },
  ];

  const settingItems: SettingItem[] = [
    // Adapters
    {
      key: "zaiApiKey",
      label: "ZAI API Key",
      type: "text",
      value: "",
      category: "adapters",
    },
    {
      key: "geminiApiKey",
      label: "Gemini API Key",
      type: "text",
      value: "",
      category: "adapters",
    },
    {
      key: "openaiApiKey",
      label: "OpenAI API Key",
      type: "text",
      value: "",
      category: "adapters",
    },

    // Recovery
    {
      key: "maxRecoveryAttempts",
      label: "Max Recovery Attempts",
      type: "number",
      value: config.maxRecoveryAttempts,
      category: "recovery",
    },
    {
      key: "recoveryTimeoutMinutes",
      label: "Recovery Timeout (minutes)",
      type: "number",
      value: config.recoveryTimeoutMinutes,
      category: "recovery",
    },
    {
      key: "autoRevertOnFailure",
      label: "Auto Revert on Failure",
      type: "boolean",
      value: config.autoRevertOnFailure,
      category: "recovery",
    },

    // Parallelization
    {
      key: "parallel",
      label: "Enable Parallel Execution",
      type: "boolean",
      value: config.parallel,
      category: "parallelization",
    },
    {
      key: "maxConcurrency",
      label: "Max Concurrency",
      type: "number",
      value: config.maxConcurrency,
      category: "parallelization",
    },

    // Cache
    {
      key: "cacheEnabled",
      label: "Enable Cache",
      type: "boolean",
      value: config.cacheEnabled,
      category: "cache",
    },
  ];

  const visibleItems = settingItems.filter(
    (item) => item.category === currentCategory,
  );

  useInput((input, key) => {
    if (isEditing) {
      if (key.return) {
        saveEdit();
      }
      if (key.escape) {
        setIsEditing(false);
        setEditingValue("");
      }
      return;
    }

    if (key.escape) {
      onBack();
      return;
    }

    if (input === "s") {
      saveAndValidate();
      return;
    }

    if (input === "c") {
      setCurrentCategory((prev) => {
        const currentIndex = categories.findIndex((cat) => cat.value === prev);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex].value;
      });
      setSelectedIndex(0);
      return;
    }

    if (input === "e" && visibleItems[selectedIndex]) {
      startEdit();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(visibleItems.length - 1, prev + 1));
    }

    // Toggle boolean values
    if (input === " " && visibleItems[selectedIndex]?.type === "boolean") {
      const item = visibleItems[selectedIndex];
      const newValue = !item.value;
      updateSetting(item.key, newValue);
    }
  });

  const startEdit = () => {
    const item = visibleItems[selectedIndex];
    if (item.type === "boolean") return;

    setEditingValue(String(item.value));
    setIsEditing(true);
  };

  const saveEdit = () => {
    const item = visibleItems[selectedIndex];
    let newValue: any = editingValue;

    if (item.type === "number") {
      newValue = parseInt(editingValue, 10);
      if (isNaN(newValue)) {
        setSaveStatus("Invalid number");
        setTimeout(() => setSaveStatus(""), 2000);
        setIsEditing(false);
        setEditingValue("");
        return;
      }
    }

    updateSetting(item.key, newValue);
    setIsEditing(false);
    setEditingValue("");
  };

  const updateSetting = (key: string, value: any) => {
    const newConfig = { ...config };

    switch (key) {
      case "maxRecoveryAttempts":
        newConfig.maxRecoveryAttempts = value;
        break;
      case "recoveryTimeoutMinutes":
        newConfig.recoveryTimeoutMinutes = value;
        break;
      case "autoRevertOnFailure":
        newConfig.autoRevertOnFailure = value;
        break;
      case "parallel":
        newConfig.parallel = value;
        break;
      case "maxConcurrency":
        newConfig.maxConcurrency = value;
        break;
      case "cacheEnabled":
        newConfig.cacheEnabled = value;
        break;
      default:
        // API keys are stored in environment variables, not config
        if (key.endsWith("ApiKey")) {
          setSaveStatus("API keys must be set as environment variables");
          setTimeout(() => setSaveStatus(""), 3000);
          return;
        }
    }

    onChange(newConfig);
    setSaveStatus("Updated - press 's' to save");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const saveAndValidate = async () => {
    const errors: string[] = [];

    // Validate configuration
    if (config.maxRecoveryAttempts < 1 || config.maxRecoveryAttempts > 10) {
      errors.push("Max recovery attempts must be between 1 and 10");
    }

    if (
      config.recoveryTimeoutMinutes < 1 ||
      config.recoveryTimeoutMinutes > 60
    ) {
      errors.push("Recovery timeout must be between 1 and 60 minutes");
    }

    if (config.maxConcurrency < 1 || config.maxConcurrency > 10) {
      errors.push("Max concurrency must be between 1 and 10");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaveStatus("Validation failed");
      setTimeout(() => {
        setSaveStatus("");
        setValidationErrors([]);
      }, 5000);
      return;
    }

    try {
      await saveSettings(config);
      setSaveStatus("Saved successfully!");
      onSave();
      setTimeout(() => {
        setSaveStatus("");
        onBack();
      }, 1000);
    } catch (error) {
      setSaveStatus("Save failed: " + String(error));
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const renderValue = (item: SettingItem) => {
    if (item.key.endsWith("ApiKey")) {
      return (
        <Text color="white" backgroundColor="black">
          (Environment Variable)
        </Text>
      );
    }

    if (isEditing && visibleItems[selectedIndex] === item) {
      return (
        <TextInput
          value={editingValue}
          onChange={setEditingValue}
          placeholder={String(item.value)}
          onSubmit={() => {}}
        />
      );
    }

    switch (item.type) {
      case "boolean":
        return (
          <Text color={item.value ? "green" : "red"} backgroundColor="black">
            {item.value ? "✓ Enabled" : "✗ Disabled"}
          </Text>
        );
      case "number":
        return (
          <Text color="cyan" backgroundColor="black">
            {String(item.value)}
          </Text>
        );
      default:
        return (
          <Text color="white" backgroundColor="black">
            {String(item.value || "-")}
          </Text>
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        backgroundColor="black"
      >
        <Text bold color="cyan" backgroundColor="black">
          ⚙️ ADVANCED SETTINGS
        </Text>
      </Box>

      {/* Category Tabs */}
      <Box marginTop={1} backgroundColor="black">
        {categories.map((cat) => (
          <Box key={cat.value} marginX={1} backgroundColor="black">
            <Text
              color={currentCategory === cat.value ? "cyan" : "white"}
              bold={currentCategory === cat.value}
              underline={currentCategory === cat.value}
              backgroundColor="black"
            >
              {cat.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Settings List */}
      <Box
        marginTop={1}
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
        height={18}
        backgroundColor="black"
      >
        {visibleItems.map((item, index) => (
          <Box
            key={item.key}
            backgroundColor={selectedIndex === index ? "blue" : "black"}
            paddingX={1}
          >
            <Box
              width={35}
              backgroundColor={selectedIndex === index ? "blue" : "black"}
            >
              <Text
                color="white"
                bold={selectedIndex === index}
                backgroundColor={selectedIndex === index ? "blue" : "black"}
              >
                {item.label}:
              </Text>
            </Box>
            <Box
              flexGrow={1}
              backgroundColor={selectedIndex === index ? "blue" : "black"}
            >
              {renderValue(item)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Box
          marginTop={1}
          borderStyle="single"
          borderColor="red"
          padding={1}
          flexDirection="column"
        >
          <Text color="red" bold>
            Validation Errors:
          </Text>
          {validationErrors.map((error, index) => (
            <Text key={index} color="red">
              • {error}
            </Text>
          ))}
        </Box>
      )}

      {/* Save Status */}
      {saveStatus && (
        <Box marginTop={1}>
          <Text
            color={
              saveStatus.includes("failed") || saveStatus.includes("Invalid")
                ? "red"
                : saveStatus.includes("Saved")
                  ? "green"
                  : "yellow"
            }
          >
            {saveStatus}
          </Text>
        </Box>
      )}

      {/* Help */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        backgroundColor="black"
      >
        <Box flexDirection="column" backgroundColor="black">
          <Text color="white" backgroundColor="black">
            ↑/↓: Navigate │ c: Switch category │ e: Edit │ Space: Toggle boolean
            │ s: Save │ Esc: Back
          </Text>
          <Text color="white" backgroundColor="black">
            💡 API keys are set as environment variables: ZAI_API_KEY,
            GEMINI_API_KEY, OPENAI_API_KEY
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
