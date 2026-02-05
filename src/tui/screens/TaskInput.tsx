import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { ModelType, AgentConfig } from "../../types.js";

interface TaskInputProps {
  onSubmit: (task: string, options: TaskOptions) => void;
  onCancel: () => void;
  defaultTask?: string;
  initialOptions?: Partial<TaskOptions>; // Added to inherit settings
}

interface TaskOptions {
  autoApprove: boolean;
  parallel: boolean;
  runTests: boolean;
  gitCommit: boolean;
  dryRun: boolean;
  agents?: AgentConfig;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onSubmit,
  onCancel,
  defaultTask = "",
  initialOptions = {}, // Default empty object
}) => {
  const [task, setTask] = useState(defaultTask);
  const [options, setOptions] = useState<TaskOptions>({
    autoApprove: false,
    parallel: true,
    runTests: false,
    gitCommit: false,
    dryRun: false,
    ...initialOptions, // Override defaults with passed settings
  });
  const [focusedOption, setFocusedOption] = useState(-1); // -1 = text input

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.tab) {
      setFocusedOption((prev) => (prev + 1) % 6);
    }
    if (focusedOption >= 0 && (input === " " || key.return)) {
      const optionKeys: (keyof TaskOptions)[] = [
        "autoApprove",
        "parallel",
        "runTests",
        "gitCommit",
        "dryRun",
      ];
      if (focusedOption < optionKeys.length) {
        setOptions((prev) => ({
          ...prev,
          [optionKeys[focusedOption]]: !prev[optionKeys[focusedOption]],
        }));
      } else if (focusedOption === 5 && task.trim()) {
        onSubmit(task.trim(), options);
      }
    }
  });

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      onSubmit(value.trim(), options);
    }
  };

  const OptionCheckbox: React.FC<{
    label: string;
    checked: boolean;
    focused: boolean;
  }> = ({ label, checked, focused }) => (
    <Box backgroundColor="black">
      <Text color={focused ? "cyan" : "white"} backgroundColor="black">
        {focused ? "▶ " : "  "}[{checked ? "✓" : " "}] {label}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1} backgroundColor="black">
      <Text bold color="cyan" backgroundColor="black">
        📝 Enter Your Task
      </Text>
      <Text color="white" backgroundColor="black">
        Describe what you want to build or accomplish
      </Text>
      <Text color="white" backgroundColor="black">
        ─────────────────────────────────────────────────
      </Text>

      <Box marginTop={1} marginBottom={1} backgroundColor="black">
        <Text color="yellow" backgroundColor="black">
          Task:{" "}
        </Text>
        <Box
          borderStyle="single"
          borderColor={focusedOption === -1 ? "cyan" : "gray"}
          paddingX={1}
          backgroundColor="black"
        >
          <TextInput
            value={task}
            onChange={setTask}
            onSubmit={handleSubmit}
            placeholder="e.g., Create a REST API with Flask and SQLAlchemy"
          />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" backgroundColor="black">
        <Text bold color="white" backgroundColor="black">
          Options (Tab to navigate, Space to toggle):
        </Text>
        <Box marginTop={1} flexDirection="column">
          <OptionCheckbox
            label="Auto-approve plan"
            checked={options.autoApprove}
            focused={focusedOption === 0}
          />
          <OptionCheckbox
            label="Parallel execution"
            checked={options.parallel}
            focused={focusedOption === 1}
          />
          <OptionCheckbox
            label="Run tests after"
            checked={options.runTests}
            focused={focusedOption === 2}
          />
          <OptionCheckbox
            label="Git auto-commit"
            checked={options.gitCommit}
            focused={focusedOption === 3}
          />
          <OptionCheckbox
            label="Dry run only"
            checked={options.dryRun}
            focused={focusedOption === 4}
          />
        </Box>
      </Box>

      <Box marginTop={2} backgroundColor="black">
        <Text
          color={focusedOption === 5 ? "green" : "white"}
          backgroundColor="black"
        >
          {focusedOption === 5 ? "▶ " : "  "}
          [Enter] Start Orchestration
        </Text>
      </Box>

      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        backgroundColor="black"
      >
        <Text color="white" backgroundColor="black">
          Tab: Navigate options │ Space: Toggle │ Enter: Submit │ Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
};
