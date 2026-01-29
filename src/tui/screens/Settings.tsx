import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface SettingsConfig {
  parallel: boolean;
  maxConcurrency: number;
  autoApprove: boolean;
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
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
    { key: 'parallel', label: 'Parallel Execution', type: 'boolean' },
    { key: 'maxConcurrency', label: 'Max Concurrency', type: 'number', min: 1, max: 10 },
    { key: 'autoApprove', label: 'Auto-approve Plans', type: 'boolean' },
    { key: 'runTests', label: 'Run Tests After', type: 'boolean' },
    { key: 'testCommand', label: 'Test Command', type: 'string' },
    { key: 'gitCommit', label: 'Git Auto-commit', type: 'boolean' },
    { key: 'notifications', label: 'Desktop Notifications', type: 'boolean' },
    { key: 'cacheEnabled', label: 'Cache Results', type: 'boolean' },
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

    if (currentSetting.type === 'boolean' && (input === ' ' || key.return)) {
      onChange({
        ...config,
        [currentSetting.key]: !config[currentSetting.key as keyof SettingsConfig],
      });
    }

    if (currentSetting.type === 'number') {
      if (key.leftArrow) {
        const newValue = Math.max(currentSetting.min || 1, (config[currentSetting.key as keyof SettingsConfig] as number) - 1);
        onChange({ ...config, [currentSetting.key]: newValue });
      }
      if (key.rightArrow) {
        const newValue = Math.min(currentSetting.max || 10, (config[currentSetting.key as keyof SettingsConfig] as number) + 1);
        onChange({ ...config, [currentSetting.key]: newValue });
      }
    }

    if (input === 's') {
      onSave();
    }
  });

  const renderValue = (setting: typeof settings[number]) => {
    const value = config[setting.key as keyof SettingsConfig];

    if (setting.type === 'boolean') {
      return (
        <Text color={value ? 'green' : 'red'}>
          [{value ? '✓' : ' '}] {value ? 'Enabled' : 'Disabled'}
        </Text>
      );
    }

    if (setting.type === 'number') {
      return (
        <Text color="cyan">
          ◀ {value} ▶
        </Text>
      );
    }

    return <Text color="yellow">{String(value) || '(not set)'}</Text>;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan">⚙️ SETTINGS</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {settings.map((setting, index) => (
          <Box
            key={setting.key}
            backgroundColor={selectedIndex === index ? 'blue' : undefined}
            paddingX={1}
          >
            <Box width={30}>
              <Text color={selectedIndex === index ? 'white' : 'gray'}>
                {selectedIndex === index ? '▶ ' : '  '}
                {setting.label}
              </Text>
            </Box>
            <Box>
              {renderValue(setting)}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Instructions based on selected setting type */}
      <Box marginTop={2} borderStyle="round" borderColor="yellow" padding={1}>
        <Text color="yellow">
          {settings[selectedIndex].type === 'boolean' && 'Space/Enter: Toggle'}
          {settings[selectedIndex].type === 'number' && '←/→: Adjust value'}
          {settings[selectedIndex].type === 'string' && 'Enter: Edit text'}
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
