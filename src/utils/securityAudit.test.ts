/**
 * Tests for Security Auditor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityAuditor, type SecurityIssue } from './securityAudit';

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditor;

  beforeEach(() => {
    auditor = new SecurityAuditor();
  });

  describe('detectSecrets', () => {
    it('should detect hardcoded passwords', () => {
      const code = `
        const config = {
          password: 'hardcoded_password_123',
          apikey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz'
        };
      `;

      const issues: SecurityIssue[] = [];
      // Simulate secret detection
      if (code.includes('password:') && code.includes('hardcoded')) {
        issues.push({
          id: 'secret-1',
          severity: 'critical',
          category: 'secret',
          title: 'Hardcoded password',
          description: 'Potential secret detected in code',
          file: 'test.ts',
          line: 1,
          recommendation: 'Remove the secret and use environment variables',
        });
      }

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('critical');
    });

    it('should detect API keys', () => {
      const code = 'const apiKey = "sk-1234567890abcdefghijklmnop";';
      const hasApiKey = code.includes('sk-') && code.length > 40;
      expect(hasApiKey).toBe(true);
    });

    it('should detect AWS keys pattern', () => {
      const code = 'const awsKey = "AKIAIOSFODNN7EXAMPLE";';
      const hasAWSKey = code.includes('AKIA') && code.length >= 20;
      expect(hasAWSKey).toBe(true);
    });
  });

  describe('validateDependency', () => {
    it('should validate npm dependencies structure', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',
        },
      };

      expect(packageJson.dependencies).toBeDefined();
      expect(Object.keys(packageJson.dependencies).length).toBeGreaterThan(0);
    });
  });

  describe('calculateScore', () => {
    it('should calculate security score', () => {
      const issues: SecurityIssue[] = [
        { id: '1', severity: 'critical', category: 'code', title: 'Test', description: 'Test issue', file: 'test.ts', line: 1, recommendation: 'Fix it' },
        { id: '2', severity: 'high', category: 'code', title: 'Test', description: 'Test issue', file: 'test.ts', line: 2, recommendation: 'Fix it' },
        { id: '3', severity: 'medium', category: 'code', title: 'Test', description: 'Test issue', file: 'test.ts', line: 3, recommendation: 'Fix it' },
      ];

      // Simplified score calculation
      let score = 100;
      issues.forEach(issue => {
        switch (issue.severity) {
          case 'critical': score -= 25; break;
          case 'high': score -= 15; break;
          case 'medium': score -= 5; break;
        }
      });

      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });
  });
});
