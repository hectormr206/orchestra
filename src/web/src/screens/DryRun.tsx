import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { useOrchestration } from '../hooks/useOrchestration';

interface DryRunProps {
  task: string;
  onExecute: () => void;
  onCancel: () => void;
}

export const DryRun: React.FC<DryRunProps> = ({ task, onExecute, onCancel }) => {
  const { analyzeTask, analysis, isAnalyzing, error } = useOrchestration();
  const [selectedOption, setSelectedOption] = useState<number>(0);

  useEffect(() => {
    analyzeTask(task);
  }, [task]);

  const options = [
    { label: 'Execute Task', value: 'execute' },
    { label: 'Cancel', value: 'cancel' },
  ];

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    if (key.return) {
      if (selectedOption === 0) {
        onExecute();
      } else {
        onCancel();
      }
    }
    if (key.upArrow) {
      setSelectedOption(Math.max(0, selectedOption - 1));
    }
    if (key.downArrow) {
      setSelectedOption(Math.min(options.length - 1, selectedOption + 1));
    }
  });

  if (isAnalyzing) {
    return (
      <Box flexDirection="column" alignItems="center" paddingY={1}>
        <Box marginBottom={1}>
          <Spinner type="dots" />
          <Text> Analyzing task...</Text>
        </Box>
        <Text dimColor>This may take a moment</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={1}>
          <Text color="red">✗ Analysis failed</Text>
        </Box>
        <Text color="red">{error}</Text>
        <Box marginTop={1}>
          <Text dimColor>Press ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text dimColor>No analysis available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Gradient name="summer">
          <BigText text="DRY RUN" />
        </Gradient>
      </Box>

      <Box flexDirection="column" marginBottom={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Task:
          </Text>
        </Box>
        <Text>{task}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Adapters:
          </Text>
        </Box>
        <Text>
          {analysis.adapters.join(' → ')}
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Estimated Files:
          </Text>
        </Box>
        <Box flexDirection="column">
          {analysis.estimatedFiles.map((file, index) => (
            <Box key={index}>
              <Text>• {file}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1} paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Estimated Duration:
          </Text>
        </Box>
        <Text>{analysis.estimatedDuration}</Text>
      </Box>

      {analysis.warnings && analysis.warnings.length > 0 && (
        <Box flexDirection="column" marginBottom={1} paddingX={2}>
          <Box marginBottom={1}>
            <Text bold color="yellow">
              Warnings:
            </Text>
          </Box>
          <Box flexDirection="column">
            {analysis.warnings.map((warning, index) => (
              <Box key={index}>
                <Text color="yellow">⚠ {warning}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box marginTop={1} paddingX={2}>
        <Box flexDirection="column">
          {options.map((option, index) => (
            <Box key={option.value}>
              <Text
                color={index === selectedOption ? 'green' : 'white'}
                bold={index === selectedOption}
              >
                {index === selectedOption ? '> ' : '  '}
                {option.label}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      <Box marginTop={1} paddingX={2}>
        <Text dimColor>
          Use ↑↓ to select, Enter to confirm, ESC to cancel
        </Text>
      </Box>
    </Box>
  );
};

export default DryRun;