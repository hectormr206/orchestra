import React, { useState, useEffect } from 'react';
import { Box, Text, TextArea } from 'ink';
import TextInput from 'ink-text-input';
import { Button } from './ui/Button';

interface PlanEditorProps {
  initialPlan: string;
  sessionId: string;
  onSave: (plan: string) => Promise<void>;
  onCancel: () => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({
  initialPlan,
  sessionId,
  onSave,
  onCancel,
}) => {
  const [plan, setPlan] = useState(initialPlan);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    validatePlan(plan);
  }, [plan]);

  const validatePlan = (content: string) => {
    if (!content || content.trim().length === 0) {
      setIsValid(false);
      setError('Plan cannot be empty');
      return;
    }

    // Basic Markdown validation
    const hasStructure = 
      content.includes('#') || 
      content.includes('##') || 
      content.includes('-') ||
      content.includes('*');

    if (!hasStructure) {
      setIsValid(false);
      setError('Plan must contain valid Markdown structure (headings, lists)');
      return;
    }

    // Check for code blocks if implementation steps are present
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasImplementationKeywords = 
      content.toLowerCase().includes('implement') ||
      content.toLowerCase().includes('create') ||
      content.toLowerCase().includes('add') ||
      content.toLowerCase().includes('modify');

    if (hasImplementationKeywords && !hasCodeBlocks) {
      setIsValid(false);
      setError('Implementation steps should include code blocks');
      return;
    }

    setIsValid(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!isValid) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (plan !== initialPlan) {
      // Could add confirmation here
    }
    onCancel();
  };

  return (
    <Box flexDirection="column" width={120}>
      {/* Header */}
      <Box borderStyle="double" borderColor="blue" paddingX={1} marginBottom={1}>
        <Text bold color="blue">
          Edit Plan - Session: {sessionId}
        </Text>
      </Box>

      {/* Instructions */}
      <Box marginBottom={1}>
        <Text dimColor>
          Edit the AI-generated plan below. Use Markdown formatting.
          Press ESC to cancel, Ctrl+S to save.
        </Text>
      </Box>

      {/* Editor */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        padding={1}
        marginBottom={1}
        flexGrow={1}
      >
        <TextArea
          value={plan}
          onChange={setPlan}
          placeholder="Enter plan in Markdown format..."
          rows={20}
        />
      </Box>

      {/* Validation Status */}
      <Box marginBottom={1}>
        {isValid ? (
          <Text color="green">✓ Plan format is valid</Text>
        ) : (
          <Text color="red">✗ {error}</Text>
        )}
      </Box>

      {/* Stats */}
      <Box marginBottom={1}>
        <Text dimColor>
          Lines: {plan.split('\n').length} | Characters: {plan.length} | 
          Words: {plan.split(/\s+/).filter(w => w.length > 0).length}
        </Text>
      </Box>

      {/* Actions */}
      <Box>
        <Box marginRight={1}>
          <Button
            onPress={handleSave}
            disabled={!isValid || isSaving}
            label={isSaving ? 'Saving...' : 'Save Plan'}
            variant="primary"
          />
        </Box>
        <Button
          onPress={handleCancel}
          disabled={isSaving}
          label="Cancel"
          variant="secondary"
        />
      </Box>

      {/* Keyboard Shortcuts */}
      <Box marginTop={1}>
        <Text dimColor color="gray">
          Shortcuts: [Ctrl+S] Save | [ESC] Cancel | [Ctrl+Z] Undo | [Ctrl+Y] Redo
        </Text>
      </Box>
    </Box>
  );
};

export default PlanEditor;