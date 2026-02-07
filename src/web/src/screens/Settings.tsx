import { useState, useEffect } from 'react';
import api from '../lib/api';

interface ConfigSettings {
  execution: {
    parallel: boolean;
    maxConcurrency: number;
    maxIterations: number;
    timeout: number;
    pipeline: boolean;
    watch: boolean;
  };
  test: {
    command: string;
    timeout: number;
    runAfterGeneration: boolean;
  };
  git: {
    autoCommit: boolean;
    commitMessageTemplate: string;
    branch: string;
  };
  tui: {
    autoApprove: boolean;
    notifications: boolean;
    cacheEnabled: boolean;
    maxRecoveryAttempts: number;
    recoveryTimeoutMinutes: number;
    autoRevertOnFailure: boolean;
  };
  agents: {
    architect: string[];
    executor: string[];
    auditor: string[];
    consultant: string[];
  };
  languages: string[];
}

const MODEL_TYPES = [
  'Claude (GLM)',
  'Gemini',
  'Codex',
  'Claude (Opus 4.5)'
] as const;

const SUPPORTED_LANGUAGES = [
  'python',
  'javascript',
  'typescript',
  'go',
  'rust',
  'json',
  'yaml'
] as const;

const DEFAULT_CONFIG: ConfigSettings = {
  execution: {
    parallel: true,
    maxConcurrency: 3,
    maxIterations: 10,
    timeout: 300000,
    pipeline: false,
    watch: false
  },
  test: {
    command: '',
    timeout: 120000,
    runAfterGeneration: true
  },
  git: {
    autoCommit: true,
    commitMessageTemplate: 'feat: {task}',
    branch: 'main'
  },
  tui: {
    autoApprove: false,
    notifications: true,
    cacheEnabled: true,
    maxRecoveryAttempts: 3,
    recoveryTimeoutMinutes: 10,
    autoRevertOnFailure: true
  },
  agents: {
    architect: ['Codex', 'Gemini', 'Claude (GLM)'],
    executor: ['Claude (GLM)'],
    auditor: ['Gemini', 'Claude (GLM)'],
    consultant: ['Codex', 'Gemini', 'Claude (GLM)']
  },
  languages: ['typescript', 'javascript']
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'agents' | 'execution' | 'testing' | 'git' | 'recovery'>('general');
  const [config, setConfig] = useState<ConfigSettings>(DEFAULT_CONFIG);
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [authToken, setAuthToken] = useState('');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadSettings();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/config');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedServerUrl = localStorage.getItem('orchestra-server-url');
    const savedAuthToken = localStorage.getItem('orchestra-auth-token');
    const savedTheme = localStorage.getItem('orchestra-theme');

    if (savedServerUrl) setServerUrl(savedServerUrl);
    if (savedAuthToken) setAuthToken(savedAuthToken);
    if (savedTheme) setTheme(savedTheme);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const axiosApi = await import('../lib/api');
      const response = await axiosApi.default.axios?.put('/api/config', config);
      showMessage('success', 'Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      showMessage('error', 'Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('orchestra-server-url', serverUrl);
    localStorage.setItem('orchestra-auth-token', authToken);
    localStorage.setItem('orchestra-theme', theme);
    showMessage('success', 'Settings saved successfully!');
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    showMessage('success', 'Configuration reset to defaults.');
  };

  const updateConfig = (section: keyof ConfigSettings, key: string, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateAgent = (agent: keyof ConfigSettings['agents'], models: string[]) => {
    setConfig(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [agent]: models
      }
    }));
  };

  const toggleLanguage = (lang: string) => {
    setConfig(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: '⚙️' },
    { id: 'agents' as const, label: 'Agents', icon: '🤖' },
    { id: 'execution' as const, label: 'Execution', icon: '⚡' },
    { id: 'testing' as const, label: 'Testing', icon: '🧪' },
    { id: 'git' as const, label: 'Git', icon: '📦' },
    { id: 'recovery' as const, label: 'Recovery', icon: '🔧' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure Orchestra behavior and preferences
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-sm ${
            message.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      General Settings
                    </h3>
                  </div>

                  <div>
                    <label htmlFor="server-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Server URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="server-url"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="http://localhost:8080"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        URL of the Orchestra server
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auth Token (Optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        id="auth-token"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter authentication token"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Token for authenticated requests (if required)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Theme
                    </label>
                    <div className="mt-1">
                      <select
                        id="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Supported Languages
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`
                            px-3 py-2 text-sm font-medium rounded-md border
                            ${config.languages.includes(lang)
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }
                          `}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 flex gap-3">
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Agent Configuration
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Configure AI model fallback chains for each agent type. Models will be tried in order.
                    </p>
                  </div>

                  {(['architect', 'executor', 'auditor', 'consultant'] as const).map((agent) => (
                    <div key={agent} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white capitalize mb-3">
                        {agent} Agent
                      </h4>
                      <div className="space-y-2">
                        {MODEL_TYPES.map((model) => (
                          <label key={model} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.agents[agent].includes(model)}
                              onChange={(e) => {
                                const current = config.agents[agent];
                                updateAgent(
                                  agent,
                                  e.target.checked
                                    ? [...current, model]
                                    : current.filter(m => m !== model)
                                );
                              }}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{model}</span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Current chain: {config.agents[agent].join(' → ') || 'None selected'}
                      </p>
                    </div>
                  ))}

                  <div className="pt-5 flex gap-3">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Agent Config'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'execution' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Execution Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.execution.parallel}
                          onChange={(e) => updateConfig('execution', 'parallel', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Parallel Processing</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Process multiple files concurrently
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.execution.pipeline}
                          onChange={(e) => updateConfig('execution', 'pipeline', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Pipeline Mode</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Audit files as they complete execution
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.execution.watch}
                          onChange={(e) => updateConfig('execution', 'watch', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Watch Mode</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Re-run on file changes
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="max-concurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max Concurrency
                      </label>
                      <input
                        type="number"
                        id="max-concurrency"
                        min="1"
                        max="10"
                        value={config.execution.maxConcurrency}
                        onChange={(e) => updateConfig('execution', 'maxConcurrency', parseInt(e.target.value) || 1)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Max concurrent file operations
                      </p>
                    </div>

                    <div>
                      <label htmlFor="max-iterations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max Iterations
                      </label>
                      <input
                        type="number"
                        id="max-iterations"
                        min="1"
                        max="50"
                        value={config.execution.maxIterations}
                        onChange={(e) => updateConfig('execution', 'maxIterations', parseInt(e.target.value) || 1)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Maximum audit iterations
                      </p>
                    </div>

                    <div>
                      <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        id="timeout"
                        min="10000"
                        max="600000"
                        step="10000"
                        value={config.execution.timeout}
                        onChange={(e) => updateConfig('execution', 'timeout', parseInt(e.target.value) || 300000)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Operation timeout (milliseconds)
                      </p>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Execution Settings'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'testing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Testing Configuration
                    </h3>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.test.runAfterGeneration}
                        onChange={(e) => updateConfig('test', 'runAfterGeneration', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Run Tests After Code Generation</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Automatically run tests after code is generated
                    </p>
                  </div>

                  <div>
                    <label htmlFor="test-command" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Test Command
                    </label>
                    <input
                      type="text"
                      id="test-command"
                      value={config.test.command}
                      onChange={(e) => updateConfig('test', 'command', e.target.value)}
                      placeholder="npm test (auto-detected if empty)"
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave empty for auto-detection
                    </p>
                  </div>

                  <div>
                    <label htmlFor="test-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Test Timeout (ms)
                    </label>
                    <input
                      type="number"
                      id="test-timeout"
                      min="10000"
                      max="600000"
                      step="10000"
                      value={config.test.timeout}
                      onChange={(e) => updateConfig('test', 'timeout', parseInt(e.target.value) || 120000)}
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Maximum time to wait for tests
                    </p>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Test Settings'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'git' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Git Configuration
                    </h3>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.git.autoCommit}
                        onChange={(e) => updateConfig('git', 'autoCommit', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-Commit After Success</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Automatically commit changes after successful completion
                    </p>
                  </div>

                  <div>
                    <label htmlFor="commit-template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Commit Message Template
                    </label>
                    <input
                      type="text"
                      id="commit-template"
                      value={config.git.commitMessageTemplate}
                      onChange={(e) => updateConfig('git', 'commitMessageTemplate', e.target.value)}
                      placeholder="feat: {task}"
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use {'{task}'} as placeholder for task description
                    </p>
                  </div>

                  <div>
                    <label htmlFor="git-branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Default Branch
                    </label>
                    <input
                      type="text"
                      id="git-branch"
                      value={config.git.branch}
                      onChange={(e) => updateConfig('git', 'branch', e.target.value)}
                      placeholder="main"
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Default branch for commits
                    </p>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Git Settings'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'recovery' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Recovery Mode Settings
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Configure automatic recovery when normal audit loop fails
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.tui.autoApprove}
                        onChange={(e) => updateConfig('tui', 'autoApprove', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-Approve Plans</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Skip plan approval and execute automatically
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.tui.notifications}
                        onChange={(e) => updateConfig('tui', 'notifications', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Notifications</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Show desktop notifications for events
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.tui.cacheEnabled}
                        onChange={(e) => updateConfig('tui', 'cacheEnabled', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Response Cache</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Cache AI responses to reduce API calls
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.tui.autoRevertOnFailure}
                        onChange={(e) => updateConfig('tui', 'autoRevertOnFailure', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-Revert on Failure</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                      Automatically revert changes when recovery fails
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="recovery-attempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max Recovery Attempts
                      </label>
                      <input
                        type="number"
                        id="recovery-attempts"
                        min="1"
                        max="10"
                        value={config.tui.maxRecoveryAttempts}
                        onChange={(e) => updateConfig('tui', 'maxRecoveryAttempts', parseInt(e.target.value) || 3)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Maximum attempts per file
                      </p>
                    </div>

                    <div>
                      <label htmlFor="recovery-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recovery Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        id="recovery-timeout"
                        min="1"
                        max="60"
                        value={config.tui.recoveryTimeoutMinutes}
                        onChange={(e) => updateConfig('tui', 'recoveryTimeoutMinutes', parseInt(e.target.value) || 10)}
                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Maximum time for recovery mode
                      </p>
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Recovery Settings'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 dark:text-blue-300 text-xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Orchestra Web UI
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Version 0.1.0 - A modern web interface for Orchestra CLI.
                Requires Orchestra Server to be running.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}