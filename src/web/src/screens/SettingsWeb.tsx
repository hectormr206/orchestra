/**
 * Settings - Web UI
 * Configuración completa de Orchestra con paridad del TUI
 */

import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';

interface TUISettings {
  agents: {
    architect: string[];
    executor: string[];
    auditor: string[];
    consultant: string[];
  };
  parallel: boolean;
  maxConcurrency: number;
  autoApprove: boolean;
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
  maxRecoveryAttempts: number;
  recoveryTimeoutMinutes: number;
  autoRevertOnFailure: boolean;
}

const defaultSettings: TUISettings = {
  agents: {
    architect: ['Kimi', 'Gemini', 'Codex', 'Claude'],
    executor: ['Claude (GLM 4.7)', 'Kimi'],
    auditor: ['Gemini', 'Codex', 'Claude'],
    consultant: ['Codex', 'Kimi'],
  },
  parallel: true,
  maxConcurrency: 3,
  autoApprove: false,
  runTests: true,
  testCommand: 'npm test',
  gitCommit: true,
  notifications: true,
  cacheEnabled: true,
  maxRecoveryAttempts: 3,
  recoveryTimeoutMinutes: 10,
  autoRevertOnFailure: true,
};

const modelOptions = ['Kimi', 'Claude (GLM 4.7)', 'Gemini', 'Codex', 'Claude'];

export default function SettingsWeb() {
  const [settings, setSettings] = useState<TUISettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'agents' | 'general' | 'recovery'>('agents');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('orchestra-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('orchestra-settings', JSON.stringify(settings));
    setHasChanges(false);
    alert('✅ Settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  const updateSetting = <K extends keyof TUISettings>(key: K, value: TUISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateAgentModel = (agent: keyof TUISettings['agents'], index: number, model: string) => {
    setSettings(prev => {
      const newAgents = { ...prev.agents };
      newAgents[agent] = [...newAgents[agent]];
      newAgents[agent][index] = model;
      return { ...prev, agents: newAgents };
    });
    setHasChanges(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Configure Orchestra agents, models, and behavior
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You have unsaved changes. Click "Save Changes" to apply them.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['agents', 'general', 'recovery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab === 'agents' && '🤖 Agents & Models'}
              {tab === 'general' && '⚙️ General'}
              {tab === 'recovery' && '🔄 Recovery Mode'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Architect */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🏗️ Architect (Planning Phase)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Creates implementation plans using Agent Swarm patterns
              </p>
              <div className="space-y-4">
                {['Primary', 'Fallback 1', 'Fallback 2', 'Fallback 3'].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <select
                      value={settings.agents.architect[idx] || ''}
                      onChange={(e) => updateAgentModel('architect', idx, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {modelOptions.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Executor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Executor (Code Generation)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generates code based on the plan (optimized for cost)
              </p>
              <div className="space-y-4">
                {['Primary', 'Fallback 1'].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <select
                      value={settings.agents.executor[idx] || ''}
                      onChange={(e) => updateAgentModel('executor', idx, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {modelOptions.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Auditor */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Auditor (Code Review)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Reviews code quality with massive context window
              </p>
              <div className="space-y-4">
                {['Primary', 'Fallback 1', 'Fallback 2'].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <select
                      value={settings.agents.auditor[idx] || ''}
                      onChange={(e) => updateAgentModel('auditor', idx, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {modelOptions.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultant */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🧠 Consultant (Algorithmic Help)
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Surgical algorithmic help (used only when needed)
              </p>
              <div className="space-y-4">
                {['Primary', 'Fallback 1'].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <select
                      value={settings.agents.consultant[idx] || ''}
                      onChange={(e) => updateAgentModel('consultant', idx, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {modelOptions.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            {/* Parallel Execution */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Parallel Execution
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process multiple files concurrently
                </p>
              </div>
              <button
                onClick={() => updateSetting('parallel', !settings.parallel)}
                className={`${
                  settings.parallel ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.parallel ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Max Concurrency */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Max Concurrency: {settings.maxConcurrency}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.maxConcurrency}
                onChange={(e) => updateSetting('maxConcurrency', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Auto-approve Plans */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Auto-approve Plans
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Skip manual plan approval step
                </p>
              </div>
              <button
                onClick={() => updateSetting('autoApprove', !settings.autoApprove)}
                className={`${
                  settings.autoApprove ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.autoApprove ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Run Tests */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Run Tests After Generation
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically run tests after code generation
                </p>
              </div>
              <button
                onClick={() => updateSetting('runTests', !settings.runTests)}
                className={`${
                  settings.runTests ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.runTests ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Test Command */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Test Command
              </label>
              <input
                type="text"
                value={settings.testCommand}
                onChange={(e) => updateSetting('testCommand', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="npm test"
              />
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Git Auto-commit */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Git Auto-commit
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically commit changes with conventional commits
                </p>
              </div>
              <button
                onClick={() => updateSetting('gitCommit', !settings.gitCommit)}
                className={`${
                  settings.gitCommit ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.gitCommit ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Desktop Notifications
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show desktop notifications for task completion
                </p>
              </div>
              <button
                onClick={() => updateSetting('notifications', !settings.notifications)}
                className={`${
                  settings.notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Cache Results */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Cache Results
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cache API responses to reduce costs
                </p>
              </div>
              <button
                onClick={() => updateSetting('cacheEnabled', !settings.cacheEnabled)}
                className={`${
                  settings.cacheEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.cacheEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recovery' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                🔄 Recovery Mode
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                When normal audit loop fails, Recovery Mode activates to validate syntax and detect incomplete code blocks.
              </p>
            </div>

            {/* Max Recovery Attempts */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Recovery Attempts: {settings.maxRecoveryAttempts}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.maxRecoveryAttempts}
                onChange={(e) => updateSetting('maxRecoveryAttempts', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>10</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Maximum number of recovery attempts before giving up
              </p>
            </div>

            {/* Recovery Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Recovery Timeout: {settings.recoveryTimeoutMinutes} minutes
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={settings.recoveryTimeoutMinutes}
                onChange={(e) => updateSetting('recoveryTimeoutMinutes', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 min</span>
                <span>60 min</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Maximum time allowed for recovery mode
              </p>
            </div>

            {/* Auto-revert on Failure */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Auto-revert on Failure
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically revert changes if recovery fails
                </p>
              </div>
              <button
                onClick={() => updateSetting('autoRevertOnFailure', !settings.autoRevertOnFailure)}
                className={`${
                  settings.autoRevertOnFailure ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
              >
                <span
                  className={`${
                    settings.autoRevertOnFailure ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Model Cost Info */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          💰 Model Cost Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Claude (GLM 4.7):</span>
            <span className="text-gray-600 dark:text-gray-400"> $0.05/M tokens (Most economical)</span>
          </div>
          <div>
            <span className="font-medium">Gemini 3 Pro:</span>
            <span className="text-gray-600 dark:text-gray-400"> $0.15/M tokens (Massive context)</span>
          </div>
          <div>
            <span className="font-medium">Kimi k2.5:</span>
            <span className="text-gray-600 dark:text-gray-400"> $0.30/M tokens (Agent Swarm)</span>
          </div>
          <div>
            <span className="font-medium">GPT-5.2 Codex:</span>
            <span className="text-gray-600 dark:text-gray-400"> $0.50/M tokens (Surgical use)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
