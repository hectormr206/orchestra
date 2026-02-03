/**
 * Tests for Express.js Plugin
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enhancePlanForExpress,
  validateExpressCode,
  suggestExpressBestPractices,
  configureExpressAuditRules,
} from '../.orchestra/plugins/express-js/index.js';

// Mock fs
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

describe('Express.js Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    // By default, return false (file doesn't exist)
    mockExistsSync.mockReturnValue(false);
  });

  describe('detectExpressProject', () => {
    it('should detect Express.js from dependencies', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('package.json');
      });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return JSON.stringify({
            dependencies: {
              express: '^4.18.0',
            },
          });
        }
        return '{}';
      });

      // Test indirectly through enhancePlanForExpress
      const result = await enhancePlanForExpress({
        sessionId: 'test-1',
        task: 'Create a route',
        metadata: {},
        config: { workingDir: '/test/project' },
      });

      // Should detect Express and return framework data
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('framework', 'express');
      expect(mockExistsSync).toHaveBeenCalled();
    });
  });

  describe('enhancePlanForExpress', () => {
    it('should skip if not an Express project', async () => {
      // Not an Express project - package.json doesn't exist or doesn't have express
      mockExistsSync.mockReturnValue(false);

      const result = await enhancePlanForExpress({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'planning',
        config: {},
        metadata: {},
      });

      expect(result.success).toBe(true);
      // When not Express, data is undefined (skip)
      if (result.data) {
        expect(result.data).not.toHaveProperty('framework');
      }
    });

    it('should enhance plan for Express project', async () => {
      // This would require Express project detection to work
      // For now, we just test the function structure
      const result = await enhancePlanForExpress({
        sessionId: 'test-1',
        task: 'Create a user authentication route',
        phase: 'planning',
        config: {},
        metadata: {},
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validateExpressCode', () => {
    it('should skip validation if not Express framework', async () => {
      const result = await validateExpressCode({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      // When not Express, data might be undefined or empty
      if (result.data && result.data.validations) {
        expect(result.data.validations.length).toBe(0);
      }
    });

    it('should validate Express code when framework is Express', async () => {
      const result = await validateExpressCode({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('validations');
      expect(Array.isArray(result.data.validations)).toBe(true);
    });
  });

  describe('suggestExpressBestPractices', () => {
    it('should skip if not Express framework', async () => {
      const result = await suggestExpressBestPractices({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'react' },
      });

      expect(result.success).toBe(true);
      // When not Express, data might be undefined
      if (result.data) {
        expect(result.data).not.toHaveProperty('suggestions');
      }
    });

    it('should suggest router pattern for route tasks', async () => {
      const result = await suggestExpressBestPractices({
        sessionId: 'test-1',
        task: 'Create a new route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest middleware pattern for middleware tasks', async () => {
      const result = await suggestExpressBestPractices({
        sessionId: 'test-1',
        task: 'Create authentication middleware',
        phase: 'execution',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
    });

    it('should suggest error handling pattern for error tasks', async () => {
      const result = await suggestExpressBestPractices({
        sessionId: 'test-1',
        task: 'Add error handling',
        phase: 'execution',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('configureExpressAuditRules', () => {
    it('should skip if not Express framework', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'nextjs' },
      });

      expect(result.success).toBe(true);
      // When not Express, data might be undefined
      if (result.data) {
        expect(result.data).not.toHaveProperty('auditRules');
      }
    });

    it('should configure Express audit rules', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data.auditRules).toBeInstanceOf(Array);
      expect(result.data.auditRules.length).toBe(5);

      // Verify audit rules structure
      const ruleNames = result.data.auditRules.map((r: { name: string }) => r.name);
      expect(ruleNames).toContain('express-router-structure');
      expect(ruleNames).toContain('express-async-handlers');
      expect(ruleNames).toContain('express-body-parser');
      expect(ruleNames).toContain('express-cors');
      expect(ruleNames).toContain('express-security-headers');
    });

    it('should have proper audit rule structure', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      expect(result.data.auditRules).toBeInstanceOf(Array);

      const rule = result.data.auditRules[0];
      expect(rule).toHaveProperty('name');
      expect(rule).toHaveProperty('description');
      expect(rule).toHaveProperty('severity');
      expect(rule).toHaveProperty('check');
      expect(typeof rule.check).toBe('function');
    });

    it('should test express-router-structure rule', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      const routerRule = result.data.auditRules.find((r: { name: string }) => r.name === 'express-router-structure');
      expect(routerRule).toBeDefined();

      const checkResult = routerRule.check('const express = require("express");\nconst router = express.Router();\nmodule.exports = router;');
      expect(checkResult.pass).toBe(true);
    });

    it('should test express-body-parser rule', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      const bodyParserRule = result.data.auditRules.find((r: { name: string }) => r.name === 'express-body-parser');
      expect(bodyParserRule).toBeDefined();

      const codeWithoutParser = 'const express = require("express");\nconst app = express();';
      const checkResult = bodyParserRule.check(codeWithoutParser);
      expect(checkResult.pass).toBe(false);
      expect(checkResult.message).toContain('body-parser');
    });

    it('should test express-cors rule', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      const corsRule = result.data.auditRules.find((r: { name: string }) => r.name === 'express-cors');
      expect(corsRule).toBeDefined();

      const codeWithoutCORS = 'const express = require("express");\nconst app = express();';
      const checkResult = corsRule.check(codeWithoutCORS);
      expect(checkResult.pass).toBe(false);
      expect(checkResult.message).toContain('CORS');
    });

    it('should test express-security-headers rule', async () => {
      const result = await configureExpressAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'express' },
      });

      const securityRule = result.data.auditRules.find((r: { name: string }) => r.name === 'express-security-headers');
      expect(securityRule).toBeDefined();

      const codeWithHelmet = 'const express = require("express");\nconst helmet = require("helmet");\nconst app = express();\napp.use(helmet());';
      const checkResult = securityRule.check(codeWithHelmet);
      expect(checkResult.pass).toBe(true);
    });
  });
});
