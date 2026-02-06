import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import type { OrchestrationTask } from '../types';

interface TaskInputProps {
  onSubmit?: (task: OrchestrationTask) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [task, setTask] = useState('');
  const [parallel, setParallel] = useState(false);
  const [runTests, setRunTests] = useState(true);
  const [gitCommit, setGitCommit] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setIsSubmitting(true);

    try {
      const orchestrationTask: OrchestrationTask = {
        description: task.trim(),
        options: {
          parallel,
          runTests,
          gitCommit,
          dryRun,
          autoApprove,
        },
      };

      if (onSubmit) {
        onSubmit(orchestrationTask);
      } else {
        const response = await api.startOrchestration(orchestrationTask);
        toast.success('Task created successfully');
        
        if (dryRun) {
          navigate(`/dry-run/${response.sessionId}`);
        } else {
          navigate(`/execution/${response.sessionId}`);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Task
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Describe your task and configure execution options
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Task Description
            </label>
            <textarea
              id="task-description"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Add user authentication with OAuth2 and implement login page"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Execution Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Execution Options
            </h3>

            {/* Parallel Execution */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="parallel"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Parallel Execution
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process multiple files concurrently (faster but more resource-intensive)
                </p>
              </div>
              <input
                id="parallel"
                type="checkbox"
                checked={parallel}
                onChange={(e) => setParallel(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Run Tests */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="runTests"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Run Tests
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically run tests after code generation
                </p>
              </div>
              <input
                id="runTests"
                type="checkbox"
                checked={runTests}
                onChange={(e) => setRunTests(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Git Commit */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="gitCommit"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Auto Commit
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically create git commit after successful completion
                </p>
              </div>
              <input
                id="gitCommit"
                type="checkbox"
                checked={gitCommit}
                onChange={(e) => setGitCommit(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Options
            </h3>

            {/* Dry Run */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="dryRun"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Dry Run
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze task without executing (preview mode)
                </p>
              </div>
              <input
                id="dryRun"
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {/* Auto Approve */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <label
                  htmlFor="autoApprove"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Auto Approve
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Skip plan review and execute immediately (use with caution)
                </p>
              </div>
              <input
                id="autoApprove"
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Warning for Auto Approve */}
          {autoApprove && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Warning: Auto Approve Enabled
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    The task will execute immediately without plan review. This can lead to
                    unexpected code changes. Use only for trusted tasks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Task...
                </>
              ) : (
                <>
                  {dryRun ? 'Analyze Task' : 'Start Task'}
                  <svg
                    className="ml-2 -mr-1 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskInput;