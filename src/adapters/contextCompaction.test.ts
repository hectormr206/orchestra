/**
 * Tests for Context Compaction Helper
 */

import { describe, it, expect } from 'vitest';
import {
  compactPrompt,
  isContextExceededError,
  estimateTokens,
  wouldExceedContext,
} from './contextCompaction.js';

describe('contextCompaction', () => {
  describe('compactPrompt', () => {
    it('should reduce prompt size while keeping essential information', () => {
      const verbose = `
        Please note that you should create a function that validates user input.
        It's important to ensure that the input is sanitized.
        Remember to handle edge cases.
        Don't forget to add proper error handling.
        As mentioned before, security is critical.
      `;

      const result = compactPrompt(verbose);

      expect(result.compactedLength).toBeLessThan(result.originalLength);
      expect(result.reductionPercent).toBeGreaterThan(0);
      expect(result.compactedPrompt).toBeDefined();
    });

    it('should remove repeated phrases', () => {
      const repeated = `
        Create a login function. Create a login function.
        Add validation. Add validation. Add validation.
        Test the code. Test the code.
      `;

      const result = compactPrompt(repeated);

      expect(result.reductionPercent).toBeGreaterThan(40);
      expect(result.compactedPrompt).not.toContain('Create a login function. Create a login function.');
    });

    it('should process prompts with code blocks', () => {
      const withCode = `
        Create this function:
        \`\`\`typescript
        function example() {
          return 42;
        }
        \`\`\`
        And implement these additional features with proper validation.
      `;

      const result = compactPrompt(withCode);

      // Should process without errors
      expect(result.compactedPrompt).toBeDefined();
      expect(result.originalLength).toBe(withCode.length);
      expect(result.compactedPrompt.length).toBeGreaterThan(0);
    });

    it('should remove verbose phrases', () => {
      const verbose = 'Please note that you should implement the feature. Make sure to test it.';
      const result = compactPrompt(verbose);

      expect(result.compactedPrompt).not.toContain('Please note that');
      expect(result.compactedPrompt).not.toContain('Make sure to');
    });

    it('should handle short prompts without breaking them', () => {
      const short = 'Create a login function with validation.';
      const result = compactPrompt(short);

      expect(result.compactedPrompt).toBeTruthy();
      expect(result.compactedPrompt.length).toBeGreaterThan(10);
    });

    it('should achieve target reduction when requested', () => {
      const longPrompt = `
        This is a very long prompt that contains a lot of information.
        It has many sentences that explain different aspects of the task.
        Some sentences are more important than others.
        We need to implement user authentication with JWT tokens.
        The system should validate all inputs properly.
        Error handling must be comprehensive and user-friendly.
        Please ensure that security best practices are followed.
        Don't forget to write unit tests for all functions.
        Integration tests are also important for the API endpoints.
        Documentation should be clear and concise.
        Code comments should explain complex logic.
        Variable names should be descriptive and follow conventions.
        The code should be maintainable and scalable.
      `.repeat(5); // Make it really long

      const result = compactPrompt(longPrompt, 0.7); // 70% reduction target

      expect(result.reductionPercent).toBeGreaterThanOrEqual(60);
    });

    it('should preserve action-oriented sentences', () => {
      const prompt = `
        This is just context information that is not critical.
        Create the authentication service with JWT.
        Some more verbose explanation about why this is important.
        Implement input validation for all endpoints.
        Another long paragraph explaining background information.
        Test all edge cases thoroughly.
      `;

      const result = compactPrompt(prompt, 0.5);

      expect(result.compactedPrompt).toContain('authentication');
      expect(result.compactedPrompt).toContain('validation');
      expect(result.compactedPrompt).toContain('Test');
    });
  });

  describe('isContextExceededError', () => {
    it('should detect English context exceeded messages', () => {
      const errors = [
        'Error: context length exceeded',
        'Maximum context window reached',
        'Token limit exceeded',
        'Input too large for model',
        'Prompt is too long',
        'Request too large',
        'CONTEXT_LENGTH_EXCEEDED',
        'InvalidRequestError: This model\'s maximum context length',
      ];

      for (const error of errors) {
        expect(isContextExceededError(error)).toBe(true);
      }
    });

    it('should detect Chinese context exceeded messages', () => {
      const errors = [
        '错误：上下文过长',
        '输入过长，请缩短',
      ];

      for (const error of errors) {
        expect(isContextExceededError(error)).toBe(true);
      }
    });

    it('should return false for non-context errors', () => {
      const errors = [
        'Rate limit exceeded',
        'API key invalid',
        'Network timeout',
        'Internal server error',
      ];

      for (const error of errors) {
        expect(isContextExceededError(error)).toBe(false);
      }
    });

    it('should be case insensitive', () => {
      expect(isContextExceededError('CONTEXT EXCEEDED')).toBe(true);
      expect(isContextExceededError('context exceeded')).toBe(true);
      expect(isContextExceededError('Context Exceeded')).toBe(true);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens approximately', () => {
      const text = 'This is a sample text for token estimation.';
      const estimated = estimateTokens(text);

      // Rough estimate: 1 token ≈ 4 characters
      const expectedApprox = Math.ceil(text.length / 4);
      expect(estimated).toBeCloseTo(expectedApprox, 2);
    });

    it('should handle empty strings', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should handle very long texts', () => {
      const longText = 'word '.repeat(10000);
      const estimated = estimateTokens(longText);

      expect(estimated).toBeGreaterThan(10000);
    });
  });

  describe('wouldExceedContext', () => {
    it('should return true when text exceeds 80% of max tokens', () => {
      const text = 'a'.repeat(10000); // ~2500 tokens
      const maxTokens = 2000; // 80% = 1600 tokens

      expect(wouldExceedContext(text, maxTokens)).toBe(true);
    });

    it('should return false when text is within safe limits', () => {
      const text = 'a'.repeat(1000); // ~250 tokens
      const maxTokens = 2000; // 80% = 1600 tokens

      expect(wouldExceedContext(text, maxTokens)).toBe(false);
    });

    it('should use 80% safety margin', () => {
      const maxTokens = 1000;
      const safeLimit = maxTokens * 0.8; // 800 tokens
      const charLimit = safeLimit * 4; // ~3200 chars

      const safeText = 'a'.repeat(charLimit - 100);
      const unsafeText = 'a'.repeat(charLimit + 100);

      expect(wouldExceedContext(safeText, maxTokens)).toBe(false);
      expect(wouldExceedContext(unsafeText, maxTokens)).toBe(true);
    });
  });

  describe('integration: compactPrompt with context detection', () => {
    it('should compact a prompt that would exceed context', () => {
      const longPrompt = 'This is a very long prompt. '.repeat(1000);
      const maxTokens = 2000;

      if (wouldExceedContext(longPrompt, maxTokens)) {
        const result = compactPrompt(longPrompt, 0.6);

        expect(result.compactedLength).toBeLessThan(result.originalLength);
        expect(wouldExceedContext(result.compactedPrompt, maxTokens)).toBe(false);
      }
    });

    it('should preserve essential information after compaction', () => {
      const prompt = `
        Create authentication service.
        ${' verbose filler text that adds no value '.repeat(100)}
        Implement JWT tokens.
        ${' more unnecessary verbose explanation '.repeat(100)}
        Add input validation.
      `;

      const result = compactPrompt(prompt, 0.7);

      // Essential keywords should be preserved
      expect(result.compactedPrompt.toLowerCase()).toContain('authentication');
      expect(result.compactedPrompt.toLowerCase()).toContain('jwt');
      expect(result.compactedPrompt.toLowerCase()).toContain('validation');
    });
  });
});
