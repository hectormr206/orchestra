/**
 * Analytics Dashboard - Trends, agent performance, and error analysis
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { SessionHistory } from '../../utils/sessionHistory.js';
import { AnalyticsEngine, type TrendData, type AgentStats, type ErrorFrequency } from '../../utils/analytics.js';

interface AnalyticsProps {
  onBack: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [topErrors, setTopErrors] = useState<ErrorFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const history = new SessionHistory();
        await history.init();

        // Filter by time range
        let sessions = history.list({ limit: 1000 });
        if (timeRange !== 'all') {
          const days = parseInt(timeRange);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          sessions = sessions.filter(s => new Date(s.startTime) >= cutoff);
        }

        // Load full session data for analytics
        const fullSessions = await Promise.all(
          sessions.map(s => history.getFullSession(s.id))
        );

        const validSessions = fullSessions.filter((s): s is NonNullable<typeof s> => s !== null);

        const engine = new AnalyticsEngine(validSessions);
        setTrends(engine.calculateTrends('week'));
        setAgentStats(engine.getAgentPerformance());
        setTopErrors(engine.getTopErrors(10));
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  useInput((input) => {
    if (input === 'q' || input === 'escape') {
      onBack();
    }
    if (input === '1') setTimeRange('7d');
    if (input === '2') setTimeRange('30d');
    if (input === '3') setTimeRange('90d');
    if (input === '4') setTimeRange('all');
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">Loading analytics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Box marginTop={1}>
          <Text color="gray">Press q to go back</Text>
        </Box>
      </Box>
    );
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={2}>
        <Text bold color="cyan"># ANALYTICS DASHBOARD</Text>
      </Box>

      {/* Time Range Selector */}
      <Box marginTop={1}>
        <Text color="white">Range: </Text>
        <Text color={timeRange === '7d' ? 'cyan' : 'gray'} bold={timeRange === '7d'}>1: 7d</Text>
        <Text color="white"> | </Text>
        <Text color={timeRange === '30d' ? 'cyan' : 'gray'} bold={timeRange === '30d'}>2: 30d</Text>
        <Text color="white"> | </Text>
        <Text color={timeRange === '90d' ? 'cyan' : 'gray'} bold={timeRange === '90d'}>3: 90d</Text>
        <Text color="white"> | </Text>
        <Text color={timeRange === 'all' ? 'cyan' : 'gray'} bold={timeRange === 'all'}>4: all</Text>
        <Text color="white"> | </Text>
        <Text color="gray">q: Back</Text>
      </Box>

      {/* Success Rate Trend */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="cyan"
        flexDirection="column"
        padding={1}
      >
        <Text bold color="cyan">^ Success Rate Trend (Last 8 periods)</Text>
        {trends.length === 0 ? (
          <Text color="gray">No trend data available</Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {trends.slice(-8).map(t => (
              <Box key={t.period}>
                <Box width={12}>
                  <Text color="white">{t.period}:</Text>
                </Box>
                <Box width={10}>
                  <Text color={t.successRate > 0.8 ? 'green' : t.successRate > 0.5 ? 'yellow' : 'red'}>
                    {(t.successRate * 100).toFixed(1)}%
                  </Text>
                </Box>
                <Text color="gray">
                  ({t.completed}/{t.total})
                </Text>
                <Text color="white"> | </Text>
                <Text color="gray">
                  Avg: {formatDuration(t.avgDuration)}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Agent Performance */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="magenta"
        flexDirection="column"
        padding={1}
      >
        <Text bold color="magenta">@ Agent Performance</Text>
        {agentStats.length === 0 ? (
          <Text color="gray">No agent data available</Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {agentStats.map(a => (
              <Box key={a.agentRole}>
                <Box width={12}>
                  <Text color="white">{a.agentRole}:</Text>
                </Box>
                <Box width={10}>
                  <Text color={a.successRate > 0.8 ? 'green' : 'yellow'}>
                    {(a.successRate * 100).toFixed(1)}%
                  </Text>
                </Box>
                <Text color="white"> | </Text>
                <Text color="gray">
                  {a.avgLatencyMs.toFixed(0)}ms
                </Text>
                <Text color="white"> | </Text>
                <Text color="gray">
                  ${a.totalCost.toFixed(2)}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Top Errors */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="red"
        flexDirection="column"
        padding={1}
      >
        <Text bold color="red">! Top Errors (Frequency)</Text>
        {topErrors.length === 0 ? (
          <Text color="gray">No errors found :)</Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {topErrors.slice(0, 5).map((e, idx) => (
              <Box key={idx} flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color="white">{idx + 1}. </Text>
                  <Text color="yellow">[{e.count}x] </Text>
                  <Text color="red">
                    {e.errorMessage.substring(0, 60)}...
                  </Text>
                </Box>
                <Box marginLeft={3}>
                  <Text color="gray">
                    Affected: {e.affectedSessions.length} session(s)
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Help */}
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        <Text color="white">
          1-4: Change time range | q/Esc: Back
        </Text>
      </Box>
    </Box>
  );
};
