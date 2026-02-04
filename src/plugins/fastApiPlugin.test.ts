/**
 * Tests for FastAPI Plugin
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enhancePlanForFastAPI,
  validateFastAPICode,
  suggestFastAPIBestPractices,
  configureFastAPIAuditRules,
} from '../.orchestra/plugins/fast-api/index.js';

// Mock fs
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

describe('FastAPI Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    // By default, return false (file doesn't exist)
    mockExistsSync.mockReturnValue(false);
  });

  describe('detectFastAPIProject', () => {
    it('should detect FastAPI from requirements.txt', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('requirements.txt');
      });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('requirements.txt')) {
          return 'fastapi==0.104.1\nuvicorn[standard]\n';
        }
        return '';
      });

      // Test indirectly through enhancePlanForFastAPI
      const result = await enhancePlanForFastAPI({
        sessionId: 'test-1',
        task: 'Create a route',
        metadata: {},
        config: { workingDir: '/test/project' },
      });

      // Should detect FastAPI and return framework data
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('framework', 'fastapi');
      expect(mockExistsSync).toHaveBeenCalled();
    });

    it('should detect FastAPI from pyproject.toml', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('pyproject.toml');
      });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('pyproject.toml')) {
          return `
[project]
dependencies = [
    "fastapi>=0.104.0",
]
`;
        }
        return '';
      });

      const result = await enhancePlanForFastAPI({
        sessionId: 'test-1',
        task: 'Create a route',
        metadata: {},
        config: { workingDir: '/test/project' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('framework', 'fastapi');
    });
  });

  describe('enhancePlanForFastAPI', () => {
    it('should skip if not a FastAPI project', async () => {
      // Not a FastAPI project - requirements.txt doesn't exist or doesn't have fastapi
      mockExistsSync.mockReturnValue(false);

      const result = await enhancePlanForFastAPI({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'planning',
        config: {},
        metadata: {},
      });

      expect(result.success).toBe(true);
      // When not FastAPI, data is undefined (skip)
      if (result.data) {
        expect(result.data).not.toHaveProperty('framework');
      }
    });

    it('should enhance plan for FastAPI project', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('requirements.txt');
      });
      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('requirements.txt')) {
          return 'fastapi==0.104.1\n';
        }
        return '';
      });

      const result = await enhancePlanForFastAPI({
        sessionId: 'test-1',
        task: 'Create a user authentication endpoint',
        phase: 'planning',
        config: {},
        metadata: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('framework', 'fastapi');
      expect(result.data).toHaveProperty('enhancedTask');
    });
  });

  describe('validateFastAPICode', () => {
    it('should skip validation if not FastAPI framework', async () => {
      const result = await validateFastAPICode({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'express' },
      });

      expect(result.success).toBe(true);
      // When not FastAPI, data might be undefined or empty
      if (result.data && result.data.validations) {
        expect(result.data.validations.length).toBe(0);
      }
    });

    it('should validate FastAPI code when framework is FastAPI', async () => {
      const result = await validateFastAPICode({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty('validations');
      expect(Array.isArray(result.data.validations)).toBe(true);
    });
  });

  describe('suggestFastAPIBestPractices', () => {
    it('should skip if not FastAPI framework', async () => {
      const result = await suggestFastAPIBestPractices({
        sessionId: 'test-1',
        task: 'Create a route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'django' },
      });

      expect(result.success).toBe(true);
      // When not FastAPI, data might be undefined
      if (result.data) {
        expect(result.data).not.toHaveProperty('suggestions');
      }
    });

    it('should suggest router pattern for route tasks', async () => {
      const result = await suggestFastAPIBestPractices({
        sessionId: 'test-1',
        task: 'Create a new route',
        phase: 'execution',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest dependency injection pattern for dependency tasks', async () => {
      const result = await suggestFastAPIBestPractices({
        sessionId: 'test-1',
        task: 'Create authentication dependency',
        phase: 'execution',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
    });

    it('should suggest error handling pattern for error tasks', async () => {
      const result = await suggestFastAPIBestPractices({
        sessionId: 'test-1',
        task: 'Add error handling',
        phase: 'execution',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('configureFastAPIAuditRules', () => {
    it('should skip if not FastAPI framework', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'flask' },
      });

      expect(result.success).toBe(true);
      // When not FastAPI, data might be undefined
      if (result.data) {
        expect(result.data).not.toHaveProperty('auditRules');
      }
    });

    it('should configure FastAPI audit rules', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      expect(result.success).toBe(true);
      expect(result.data.auditRules).toBeInstanceOf(Array);
      expect(result.data.auditRules.length).toBe(6);

      // Verify audit rules structure
      const ruleNames = result.data.auditRules.map((r: { name: string }) => r.name);
      expect(ruleNames).toContain('fastapi-router-structure');
      expect(ruleNames).toContain('fastapi-async-handlers');
      expect(ruleNames).toContain('fastapi-pydantic-models');
      expect(ruleNames).toContain('fastapi-dependency-injection');
      expect(ruleNames).toContain('fastapi-cors');
      expect(ruleNames).toContain('fastapi-security');
    });

    it('should have proper audit rule structure', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
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

    it('should test fastapi-router-structure rule', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      const routerRule = result.data.auditRules.find((r: { name: string }) => r.name === 'fastapi-router-structure');
      expect(routerRule).toBeDefined();

      const checkResult = routerRule.check('from fastapi import APIRouter\nrouter = APIRouter()');
      expect(checkResult.pass).toBe(true);
    });

    it('should test fastapi-pydantic-models rule', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      const pydanticRule = result.data.auditRules.find((r: { name: string }) => r.name === 'fastapi-pydantic-models');
      expect(pydanticRule).toBeDefined();

      const codeWithoutPydantic = 'from fastapi import FastAPI\napp = FastAPI()\n\n@app.post("/items/")\ndef create_item():\n    return {"item": "test"}';
      const checkResult = pydanticRule.check(codeWithoutPydantic);
      expect(checkResult.pass).toBe(false);
      expect(checkResult.message).toContain('Pydantic');
    });

    it('should test fastapi-cors rule', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      const corsRule = result.data.auditRules.find((r: { name: string }) => r.name === 'fastapi-cors');
      expect(corsRule).toBeDefined();

      const codeWithoutCORS = 'from fastapi import FastAPI\napp = FastAPI()';
      const checkResult = corsRule.check(codeWithoutCORS);
      expect(checkResult.pass).toBe(false);
      expect(checkResult.message).toContain('CORS');
    });

    it('should test fastapi-dependency-injection rule', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      const depRule = result.data.auditRules.find((r: { name: string }) => r.name === 'fastapi-dependency-injection');
      expect(depRule).toBeDefined();

      const codeWithDepends = 'from fastapi import Depends, FastAPI\napp = FastAPI()\n\n@app.get("/items/")\ndef read_items(db: Session = Depends(get_db)):\n    return {"items": []}';
      const checkResult = depRule.check(codeWithDepends);
      expect(checkResult.pass).toBe(true);
    });

    it('should test fastapi-security rule', async () => {
      const result = await configureFastAPIAuditRules({
        sessionId: 'test-1',
        task: 'Audit code',
        phase: 'auditing',
        config: {},
        metadata: { framework: 'fastapi' },
      });

      const securityRule = result.data.auditRules.find((r: { name: string }) => r.name === 'fastapi-security');
      expect(securityRule).toBeDefined();

      const codeWithSecurity = 'from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware\nfrom fastapi import FastAPI\napp = FastAPI()\napp.add_middleware(HTTPSRedirectMiddleware)';
      const checkResult = securityRule.check(codeWithSecurity);
      expect(checkResult.pass).toBe(true);
    });
  });
});
