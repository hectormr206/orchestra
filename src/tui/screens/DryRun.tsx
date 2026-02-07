import React, { useState, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { analyzeDryRun, type DryRunPlan } from "../../utils/dryRun.js";

interface DryRunProps {
  task: string;
  plan?: string;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}

export const DryRun: React.FC<DryRunProps> = ({
  task,
  plan,
  onApprove,
  onReject,
  onBack,
}) => {
  const [selectedAction, setSelectedAction] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dryRunData, setDryRunData] = useState<DryRunPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Load dry run analysis
  React.useEffect(() => {
    const loadAnalysis = async () => {
      setLoading(true);
      try {
        const result = await analyzeDryRun(task, plan);
        setDryRunData(result);
      } catch (error) {
        console.error("Failed to analyze dry run:", error);
        // Set empty data on error
        setDryRunData({
          task,
          estimatedFiles: [],
          estimatedDuration: "Unknown",
          adaptersToUse: {
            architect: "Codex → Gemini → GLM 4.7",
            executor: "GLM 4.7",
            auditor: "Gemini → GLM 4.7",
          },
          warnings: ["Failed to analyze task"],
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [task, plan]);

  const actions = [
    { label: "Execute", color: "green", icon: ">", action: onApprove },
    { label: "Cancel", color: "red", icon: "x", action: onReject },
    { label: "Back", color: "gray", icon: "←", action: onBack },
  ];

  useInput((input, key) => {
    if (loading) return;

    if (key.leftArrow) {
      setSelectedAction((prev) => (prev - 1 + actions.length) % actions.length);
    }
    if (key.rightArrow) {
      setSelectedAction((prev) => (prev + 1) % actions.length);
    }
    if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      const maxScroll = dryRunData
        ? Math.max(0, dryRunData.estimatedFiles.length - 8)
        : 0;
      setScrollOffset((prev) => Math.min(maxScroll, prev + 1));
    }
    if (key.return) {
      actions[selectedAction].action();
    }
    if (input === "e") onApprove();
    if (input === "c") onReject();
    if (input === "b" || key.escape) onBack();
  });

  const visibleFiles = dryRunData
    ? dryRunData.estimatedFiles.slice(scrollOffset, scrollOffset + 8)
    : [];
  const scrollPercent =
    dryRunData && dryRunData.estimatedFiles.length > 8
      ? Math.round(
          (scrollOffset / (dryRunData.estimatedFiles.length - 8)) * 100,
        )
      : 0;

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="single"
          borderColor="cyan"
          paddingX={2}
        >
          <Text bold color="cyan">
            ? DRY RUN ANALYSIS
          </Text>
        </Box>
        <Box marginTop={2}>
          <Text color="yellow">
            Analyzing task...
          </Text>
        </Box>
      </Box>
    );
  }

  if (!dryRunData) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="single"
          borderColor="cyan"
          paddingX={2}
        >
          <Text bold color="cyan">
            ? DRY RUN ANALYSIS
          </Text>
        </Box>
        <Box marginTop={2}>
          <Text color="red">
            Failed to analyze task
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">
            Press Esc or Back to return
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box
        borderStyle="single"
        borderColor="cyan"
        paddingX={2}
      >
        <Text bold color="cyan">
          ? DRY RUN ANALYSIS
        </Text>
      </Box>

      {/* Task */}
      <Box marginTop={1}>
        <Text bold color="white">
          = Task:
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">
          {dryRunData.task}
        </Text>
      </Box>

      {/* Adapters */}
      <Box marginTop={1}>
        <Text bold color="white">
          @ Adapters:
        </Text>
      </Box>
      <Box marginLeft={2} flexDirection="column">
        <Text color="gray">
          Architect:{" "}
          <Text color="green">
            {dryRunData.adaptersToUse.architect}
          </Text>
        </Text>
        <Text color="gray">
          Executor:{" "}
          <Text color="green">
            {dryRunData.adaptersToUse.executor}
          </Text>
        </Text>
        <Text color="gray">
          Auditor:{" "}
          <Text color="green">
            {dryRunData.adaptersToUse.auditor}
          </Text>
        </Text>
      </Box>

      {/* Estimated Files */}
      <Box marginTop={1}>
        <Text bold color="white">
          {">"} Files to create/modify ({dryRunData.estimatedFiles.length}):
        </Text>
      </Box>
      <Box
        marginTop={1}
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
        height={10}
      >
        {dryRunData.estimatedFiles.length === 0 ? (
          <Text color="gray">
            No files detected
          </Text>
        ) : (
          visibleFiles.map((file, index) => (
            <Text key={index} color="yellow">
              {"  "}• {file}
            </Text>
          ))
        )}
      </Box>
      {dryRunData.estimatedFiles.length > 8 && (
        <Box justifyContent="flex-end">
          <Text color="gray">
            Scroll: {scrollPercent}% | {scrollOffset + 1}-
            {Math.min(scrollOffset + 8, dryRunData.estimatedFiles.length)}/
            {dryRunData.estimatedFiles.length}
          </Text>
        </Box>
      )}

      {/* Estimated Duration */}
      <Box marginTop={1}>
        <Text bold color="white">
          ~ Estimated Duration:
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="cyan">{dryRunData.estimatedDuration}</Text>
      </Box>

      {/* Warnings */}
      {dryRunData.warnings.length > 0 && (
        <>
          <Box marginTop={1}>
            <Text bold color="yellow">
              ! Warnings:
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            {dryRunData.warnings.map((warning, index) => (
              <Text key={index} color="yellow">
                {"  "}• {warning}
              </Text>
            ))}
          </Box>
        </>
      )}

      {/* Notice */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          This is a dry run. No files will be created or modified.
        </Text>
      </Box>

      {/* Actions */}
      <Box marginTop={2} justifyContent="center">
        {actions.map((action, index) => (
          <Box key={action.label} marginX={2}>
            <Text
              color={selectedAction === index ? action.color : "gray"}
              bold={selectedAction === index}
            >
              {selectedAction === index ? "> " : "  "}[{action.icon}]{" "}
              {action.label}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Help */}
      <Box
        marginTop={2}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          ←/→: Select action | ↑/↓: Scroll files | Enter: Confirm | e/c/b: Quick
          select
        </Text>
      </Box>
    </Box>
  );
};
