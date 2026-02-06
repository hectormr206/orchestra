import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast, { Toaster } from 'react-hot-toast';
import api from '../lib/api';
import { PlanData } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import PlanEditor from './PlanEditor';

const PlanReview: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [sessionId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPlan = async () => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getPlan(sessionId);
      setPlan(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;

    try {
      setIsSubmitting(true);
      await api.approvePlan(sessionId);
      toast.success('Plan approved successfully!');
      navigate(`/execution/${sessionId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve plan';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!sessionId) return;

    const confirmed = window.confirm('Are you sure you want to reject this plan? The orchestration will be cancelled.');
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await api.rejectPlan(sessionId);
      toast.success('Plan rejected. Orchestration cancelled.');
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject plan';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async (updatedPlan: string) => {
    if (!sessionId) return;

    try {
      setIsSubmitting(true);
      await api.updatePlan(sessionId, updatedPlan);
      toast.success('Plan updated successfully!');
      setIsEditing(false);
      await loadPlan();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update plan';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Plan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Plan not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <PlanEditor
        plan={plan.content}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        isLoading={isSubmitting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Plan Review
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Session: {sessionId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                Awaiting Approval
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Plan Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {plan.task || 'Implementation Plan'}
                </h2>
                {plan.architect && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generated by <span className="font-medium">{plan.architect}</span>
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                {plan.timestamp && new Date(plan.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Markdown Content */}
          <div className="px-6 py-6">
            <MarkdownRenderer content={plan.content} />
          </div>

          {/* Scroll Indicator */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-750">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Scroll to review the complete plan</span>
              </div>
              {plan.estimatedFiles && (
                <span>Estimated files: {plan.estimatedFiles}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review carefully before approving. Changes will be applied to your codebase.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Edit Plan
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Approve & Execute</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plan Metadata */}
        {plan.metadata && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Plan Metadata
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plan.metadata.complexity && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Complexity</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {plan.metadata.complexity}
                  </dd>
                </div>
              )}
              {plan.metadata.estimatedDuration && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Estimated Duration</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {plan.metadata.estimatedDuration}
                  </dd>
                </div>
              )}
              {plan.metadata.dependencies && plan.metadata.dependencies.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Dependencies</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <ul className="list-disc list-inside space-y-1">
                      {plan.metadata.dependencies.map((dep, idx) => (
                        <li key={idx}>{dep}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 z-20"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default PlanReview;