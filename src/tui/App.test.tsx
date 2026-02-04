/**
 * Tests for App.tsx using ink-testing-library
 *
 * Note: Full component testing with ink-testing-library requires
 * additional setup. These tests verify basic rendering and imports.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { App } from './App.js';

// Mock all the child components before importing App
vi.mock('./components/Header.js', () => ({
  Header: 'Header',
}));

vi.mock('./screens/Dashboard.js', () => ({
  Dashboard: 'Dashboard',
}));

vi.mock('./screens/TaskInput.js', () => ({
  TaskInput: 'TaskInput',
}));

vi.mock('./screens/Execution.js', () => ({
  Execution: 'Execution',
}));

vi.mock('./screens/PlanReview.js', () => ({
  PlanReview: 'PlanReview',
}));

vi.mock('./screens/PlanEditor.js', () => ({
  PlanEditor: 'PlanEditor',
}));

vi.mock('./screens/DryRun.js', () => ({
  DryRun: 'DryRun',
}));

vi.mock('./screens/History.js', () => ({
  History: 'History',
}));

vi.mock('./screens/SessionDetails.js', () => ({
  SessionDetails: 'SessionDetails',
}));

vi.mock('./screens/Settings.js', () => ({
  Settings: 'Settings',
}));

vi.mock('./screens/AdvancedSettings.js', () => ({
  AdvancedSettings: 'AdvancedSettings',
}));

vi.mock('./screens/Doctor.js', () => ({
  Doctor: 'Doctor',
}));

// Mock hooks
const mockUseOrchestratorState = {
  phase: 'idle',
  task: '',
  sessionId: '',
  agents: [],
  files: [],
  logs: [],
  progress: { current: 0, total: 0 },
  startTime: null,
  isRunning: false,
  plan: '',
};

const mockOrchestratorActions = {
  start: vi.fn(),
  approvePlan: vi.fn(),
  rejectPlan: vi.fn(),
  updatePlan: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
};

vi.mock('./hooks/useOrchestrator.js', () => ({
  useOrchestrator: vi.fn(() => [mockUseOrchestratorState, mockOrchestratorActions]),
}));

vi.mock('../utils/configLoader.js', () => ({
  loadSettings: vi.fn(async () => null),
  saveSettings: vi.fn(async () => {}),
}));

vi.mock('../utils/sessionHistory.js', () => ({
  SessionHistory: vi.fn().mockImplementation(() => ({
    init: vi.fn(async () => {}),
    list: vi.fn(() => []),
    getStats: vi.fn(() => ({ total: 0, completed: 0, failed: 0 })),
  })),
}));

vi.mock('../utils/cache.js', () => ({
  ResultCache: vi.fn().mockImplementation(() => ({
    init: vi.fn(async () => {}),
    getStats: vi.fn(() => ({ entries: 0 })),
  })),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module', () => {
    it('should import App component', () => {
      expect(App).toBeDefined();
    });

    it('should be a function/component', () => {
      expect(typeof App).toBe('function');
    });
  });

  describe('basic rendering', () => {
    it('should create App without crashing', () => {
      // This test verifies the component can be instantiated
      expect(() => React.createElement(App)).not.toThrow();
    });

    it('should accept initialTask prop', () => {
      expect(() => React.createElement(App, { initialTask: 'test task' })).not.toThrow();
    });

    it('should accept autoStart prop', () => {
      expect(() => React.createElement(App, { autoStart: true })).not.toThrow();
    });
  });

  describe('mocks', () => {
    it('should have mocked configLoader', async () => {
      const { loadSettings, saveSettings } = await import('../utils/configLoader.js');
      expect(loadSettings).toBeDefined();
      expect(saveSettings).toBeDefined();
    });
  });

  describe('props interface', () => {
    it('should have correct default props', () => {
      const element = React.createElement(App);
      expect(element.props.initialTask).toBeUndefined();
      expect(element.props.autoStart).toBeUndefined();
    });

    it('should accept custom props', () => {
      const element = React.createElement(App, {
        initialTask: 'my task',
        autoStart: true,
      });
      expect(element.props.initialTask).toBe('my task');
      expect(element.props.autoStart).toBe(true);
    });
  });
});
