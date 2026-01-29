import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface TaskInputProps {
  onSubmit: (task: string, options: TaskOptions) => void;
  onCancel: () => void;
  defaultTask?: string;
}

interface TaskOptions {
  autoApprove: boolean;
  parallel: boolean;
  runTests: boolean;
  gitCommit: boolean;
  dryRun: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onSubmit,
  onCancel,
  defaultTask = '',
}) => {
  const [task, setTask] = useState(defaultTask);
  const [options, setOptions] = useState<TaskOptions>({
    autoApprove: false,
    parallel: true,
    runTests: false,
    gitCommit: false,
    dryRun: false,
  });
  const [focusedOption, setFocusedOption] = useState(-1); // -1 = text input

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.tab) {
      setFocusedOption((prev) => (prev + 1) % 6);
    }
    if (focusedOption >= 0 && (input === ' ' || key.return)) {
      const optionKeys: (keyof TaskOptions)[] = [
        'autoApprove', 'parallel', 'runTests', 'gitCommit', 'dryRun'
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
    <Box>
      <Text color={focused ? 'cyan' : 'white'}>
        {focused ? '▶ ' : '  '}
        [{checked ? '✓' : ' '}] {label}
      </Text>
    </Box>
  );

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">📝 Enter Your Task</Text>
      <Text color="gray">Describe what you want to build or accomplish</Text>
      <Text color="gray">─────────────────────────────────────────────────</Text>

      <Box marginTop={1} marginBottom={1}>
        <Text color="yellow">Task: </Text>
        <Box borderStyle="single" borderColor={focusedOption === -1 ? 'cyan' : 'gray'} paddingX={1}>
          <TextInput
            value={task}
            onChange={setTask}
            onSubmit={handleSubmit}
            placeholder="e.g., Create a REST API with Flask and SQLAlchemy"
          />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="white">Options (Tab to navigate, Space to toggle):</Text>
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

      <Box marginTop={2}>
        <Text color={focusedOption === 5 ? 'green' : 'gray'}>
          {focusedOption === 5 ? '▶ ' : '  '}
          [Enter] Start Orchestration
        </Text>
      </Box>

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          Tab: Navigate options │ Space: Toggle │ Enter: Submit │ Esc: Cancel
        </Text>
      </Box>
    </Box>
  );
};
