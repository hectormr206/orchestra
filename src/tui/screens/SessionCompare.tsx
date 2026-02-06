/**
 * Session Comparison Screen - Compare two sessions side by side
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { compareSessions, type ComparisonResult, type DiffLine } from '../../utils/sessionCompare.js';

interface SessionCompareProps {
  sessionAId: string;
  sessionBId: string;
  onBack: () => void;
}

export const SessionCompare: React.FC<SessionCompareProps> = ({
  sessionAId,
  sessionBId,
  onBack
}) => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'metrics' | 'plan' | 'files'>('metrics');
  const [scrollOffset, setScrollOffset] = useState(0);

  const visibleLines = 15;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const comparison = await compareSessions(sessionAId, sessionBId);
        setResult(comparison);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionAId, sessionBId]);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onBack();
    }
    if (input === '1') {
      setTab('metrics');
      setScrollOffset(0);
    }
    if (input === '2') {
      setTab('plan');
      setScrollOffset(0);
    }
    if (input === '3') {
      setTab('files');
      setScrollOffset(0);
    }
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      const maxScroll = getMaxScroll();
      setScrollOffset(prev => Math.min(maxScroll, prev + 1));
    }
  });

  const getMaxScroll = (): number => {
    if (!result) return 0;

    switch (tab) {
      case 'plan':
        return Math.max(0, result.planDiff.length - visibleLines);
      case 'files':
        return Math.max(0, result.fileDifferences.length - visibleLines);
      default:
        return 0;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getDiffColor = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added': return 'green';
      case 'removed': return 'red';
      default: return 'white';
    }
  };

  const getDiffPrefix = (type: DiffLine['type']): string => {
    switch (type) {
      case 'added': return '+ ';
      case 'removed': return '- ';
      default: return '  ';
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1} backgroundColor="black">
        <Text color="cyan" backgroundColor="black">Comparing sessions...</Text>
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box flexDirection="column" padding={1} backgroundColor="black">
        <Text color="red" backgroundColor="black">Error: {error || 'Failed to load comparison'}</Text>
        <Box marginTop={1}>
          <Text color="gray" backgroundColor="black">Press q to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} backgroundColor="black">
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={2} backgroundColor="black">
        <Text bold color="cyan" backgroundColor="black">🆚 SESSION COMPARISON</Text>
      </Box>

      {/* Session IDs */}
      <Box marginTop={1} backgroundColor="black">
        <Text color="white" backgroundColor="black">A: </Text>
        <Text color="cyan" backgroundColor="black">{result.sessionA.id.substring(0, 12)}</Text>
        <Text color="white" backgroundColor="black"> │ B: </Text>
        <Text color="magenta" backgroundColor="black">{result.sessionB.id.substring(0, 12)}</Text>
      </Box>

      {/* Tab Selector */}
      <Box marginTop={1} backgroundColor="black">
        <Text color={tab === 'metrics' ? 'cyan' : 'gray'} bold={tab === 'metrics'} backgroundColor="black">
          1: Metrics
        </Text>
        <Text color="white" backgroundColor="black"> │ </Text>
        <Text color={tab === 'plan' ? 'cyan' : 'gray'} bold={tab === 'plan'} backgroundColor="black">
          2: Plan
        </Text>
        <Text color="white" backgroundColor="black"> │ </Text>
        <Text color={tab === 'files' ? 'cyan' : 'gray'} bold={tab === 'files'} backgroundColor="black">
          3: Files
        </Text>
        <Text color="white" backgroundColor="black"> │ </Text>
        <Text color="gray" backgroundColor="black">↑/↓: Scroll │ q: Back</Text>
      </Box>

      {/* Tab Content */}
      {tab === 'metrics' && (
        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="round"
          borderColor="cyan"
          padding={1}
          backgroundColor="black"
        >
          <Text bold color="cyan" backgroundColor="black">📊 Metrics Delta</Text>

          <Box marginTop={1} backgroundColor="black">
            <Box width={20} backgroundColor="black">
              <Text color="white" backgroundColor="black">Duration:</Text>
            </Box>
            <Text color={result.metricsDelta.durationDelta > 0 ? 'red' : 'green'} backgroundColor="black">
              {result.metricsDelta.durationDelta > 0 ? '+' : ''}
              {formatDuration(Math.abs(result.metricsDelta.durationDelta))}
            </Text>
            <Text color="gray" backgroundColor="black">
              {' '}({result.metricsDelta.durationPercent > 0 ? '+' : ''}
              {result.metricsDelta.durationPercent.toFixed(1)}%)
            </Text>
          </Box>

          <Box marginTop={1} backgroundColor="black">
            <Box width={20} backgroundColor="black">
              <Text color="white" backgroundColor="black">Iterations:</Text>
            </Box>
            <Text color={result.metricsDelta.iterationsDelta > 0 ? 'red' : result.metricsDelta.iterationsDelta < 0 ? 'green' : 'white'} backgroundColor="black">
              {result.metricsDelta.iterationsDelta > 0 ? '+' : ''}
              {result.metricsDelta.iterationsDelta}
            </Text>
          </Box>

          <Box marginTop={1} backgroundColor="black">
            <Box width={20} backgroundColor="black">
              <Text color="white" backgroundColor="black">Files Created:</Text>
            </Box>
            <Text color={result.metricsDelta.filesCreatedDelta > 0 ? 'green' : result.metricsDelta.filesCreatedDelta < 0 ? 'red' : 'white'} backgroundColor="black">
              {result.metricsDelta.filesCreatedDelta > 0 ? '+' : ''}
              {result.metricsDelta.filesCreatedDelta}
            </Text>
          </Box>

          <Box marginTop={2} flexDirection="column" backgroundColor="black">
            <Text bold color="white" backgroundColor="black">Task Comparison:</Text>
            <Box marginTop={1} flexDirection="column" backgroundColor="black">
              <Text color="cyan" backgroundColor="black">A: {result.sessionA.task.substring(0, 60)}...</Text>
              <Text color="magenta" backgroundColor="black">B: {result.sessionB.task.substring(0, 60)}...</Text>
            </Box>
          </Box>
        </Box>
      )}

      {tab === 'plan' && (
        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="round"
          borderColor="magenta"
          padding={1}
          height={visibleLines + 3}
          backgroundColor="black"
        >
          <Text bold color="magenta" backgroundColor="black">📝 Plan Diff</Text>

          {result.planDiff.length === 0 ? (
            <Text color="gray" backgroundColor="black">Plans are identical</Text>
          ) : (
            <Box flexDirection="column" marginTop={1} backgroundColor="black">
              {result.planDiff
                .slice(scrollOffset, scrollOffset + visibleLines)
                .map((line, idx) => (
                  <Box key={idx} backgroundColor="black">
                    <Text color={getDiffColor(line.type)} backgroundColor="black">
                      {getDiffPrefix(line.type)}{line.content.substring(0, 80)}
                    </Text>
                  </Box>
                ))}
            </Box>
          )}
        </Box>
      )}

      {tab === 'files' && (
        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          padding={1}
          height={visibleLines + 3}
          backgroundColor="black"
        >
          <Text bold color="yellow" backgroundColor="black">📁 File Differences</Text>

          {result.fileDifferences.length === 0 ? (
            <Text color="gray" backgroundColor="black">No file differences</Text>
          ) : (
            <Box flexDirection="column" marginTop={1} backgroundColor="black">
              {result.fileDifferences
                .slice(scrollOffset, scrollOffset + visibleLines)
                .map((diff, idx) => (
                  <Box key={idx} backgroundColor="black">
                    {!diff.inA && diff.inB && (
                      <Text color="green" backgroundColor="black">+ {diff.path}</Text>
                    )}
                    {diff.inA && !diff.inB && (
                      <Text color="red" backgroundColor="black">- {diff.path}</Text>
                    )}
                    {diff.inA && diff.inB && diff.statusChanged && (
                      <Text color="yellow" backgroundColor="black">
                        ~ {diff.path} ({diff.oldStatus} → {diff.newStatus})
                      </Text>
                    )}
                    {diff.inA && diff.inB && !diff.statusChanged && (
                      <Text color="white" backgroundColor="black">  {diff.path}</Text>
                    )}
                  </Box>
                ))}
            </Box>
          )}
        </Box>
      )}

      {/* Scroll Indicator */}
      {tab !== 'metrics' && getMaxScroll() > 0 && (
        <Box justifyContent="flex-end" backgroundColor="black">
          <Text color="gray" backgroundColor="black">
            Scroll: {Math.round((scrollOffset / Math.max(1, getMaxScroll())) * 100)}%
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
        <Text color="white" backgroundColor="black">
          1-3: Switch tabs │ ↑/↓: Scroll │ q/Esc: Back
        </Text>
      </Box>
    </Box>
  );
};
