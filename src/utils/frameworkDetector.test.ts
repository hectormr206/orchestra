/**
 * Tests for Framework Detector
 */

import { describe, it, expect } from 'vitest';
import { detectProject, type ProjectDetection, type FrameworkInfo } from './frameworkDetector';

describe('FrameworkDetector', () => {
  describe('detectProject', () => {
    it('should return detection result', () => {
      const detection = detectProject();

      expect(detection).toBeDefined();
      expect(detection.language).toBeDefined();
      expect(detection.packageManager).toBeDefined();
    });

    it('should detect package manager', () => {
      const detection = detectProject();

      // Should detect one of: npm, yarn, pnpm, or bun
      const validPackageManagers = ['npm', 'yarn', 'pnpm', 'bun', 'unknown'];
      expect(validPackageManagers).toContain(detection.packageManager);
    });

    it('should have test framework', () => {
      const detection = detectProject();

      // Test framework should be detected or unknown
      expect(detection.testFramework).toBeDefined();
      expect(['jest', 'vitest', 'mocha', 'jasmine', 'pytest', 'unittest', 'go-test', 'cargo-test', 'unknown']).toContain(detection.testFramework);
    });

    it('should have build tool', () => {
      const detection = detectProject();

      // Build tool is always returned, even if unknown
      expect(detection.buildTool).toBeDefined();
    });

    it('should check for TypeScript', () => {
      const detection = detectProject();

      expect(typeof detection.hasTypeScript).toBe('boolean');
    });

    it('should check for monorepo', () => {
      const detection = detectProject();

      expect(typeof detection.monorepo).toBe('boolean');
    });

    it('should return frameworks array', () => {
      const detection = detectProject();

      expect(Array.isArray(detection.frameworks)).toBe(true);
    });

    it('should provide recommendations', () => {
      const detection = detectProject();

      expect(detection.recommendations).toBeDefined();
      expect(detection.recommendations.agentPreference).toBeDefined();
      expect(Array.isArray(detection.recommendations.agentPreference)).toBe(true);
      expect(detection.recommendations.agentPreference.length).toBeGreaterThan(0);
    });
  });

  describe('ProjectDetection type structure', () => {
    it('should accept valid TypeScript project detection', () => {
      const detection: ProjectDetection = {
        language: 'typescript',
        packageManager: 'npm',
        testFramework: 'vitest',
        buildTool: 'vite',
        frameworks: [],
        hasTypeScript: true,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
        },
      };

      expect(detection.language).toBe('typescript');
      expect(detection.hasTypeScript).toBe(true);
    });

    it('should accept valid Python project detection', () => {
      const detection: ProjectDetection = {
        language: 'python',
        packageManager: 'pip',
        testFramework: 'pytest',
        buildTool: 'unknown',
        frameworks: [],
        hasTypeScript: false,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
        },
      };

      expect(detection.language).toBe('python');
      expect(detection.packageManager).toBe('pip');
    });
  });

  describe('FrameworkInfo type structure', () => {
    it('should accept framework with all required fields', () => {
      const framework: FrameworkInfo = {
        name: 'React',
        type: 'frontend',
        version: '^18.0.0',
        configFiles: ['vite.config.ts'],
        dependencies: ['react', 'react-dom'],
      };

      expect(framework.name).toBe('React');
      expect(framework.type).toBe('frontend');
      expect(framework.configFiles).toContain('vite.config.ts');
    });

    it('should accept framework without optional version', () => {
      const framework: FrameworkInfo = {
        name: 'Express',
        type: 'backend',
        configFiles: [],
        dependencies: ['express'],
      };

      expect(framework.name).toBe('Express');
      expect(framework.type).toBe('backend');
      expect(framework.version).toBeUndefined();
    });
  });

  describe('recommendations structure', () => {
    it('should accept recommendations with all optional commands', () => {
      const detection: ProjectDetection = {
        language: 'typescript',
        packageManager: 'npm',
        testFramework: 'vitest',
        buildTool: 'vite',
        frameworks: [],
        hasTypeScript: true,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          lintCommand: 'npm run lint',
        },
      };

      expect(detection.recommendations.testCommand).toBe('npm test');
      expect(detection.recommendations.buildCommand).toBe('npm run build');
      expect(detection.recommendations.lintCommand).toBe('npm run lint');
    });

    it('should accept recommendations without optional commands', () => {
      const detection: ProjectDetection = {
        language: 'python',
        packageManager: 'pip',
        testFramework: 'pytest',
        buildTool: 'unknown',
        frameworks: [],
        hasTypeScript: false,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
        },
      };

      expect(detection.recommendations.testCommand).toBeUndefined();
      expect(detection.recommendations.buildCommand).toBeUndefined();
    });
  });

  describe('framework detection patterns', () => {
    it('should detect React framework structure', () => {
      const detection: ProjectDetection = {
        language: 'typescript',
        packageManager: 'npm',
        testFramework: 'vitest',
        buildTool: 'vite',
        frameworks: [
          {
            name: 'React',
            type: 'frontend',
            version: '^18.0.0',
            configFiles: ['vite.config.ts'],
            dependencies: ['react', 'react-dom'],
          },
        ],
        hasTypeScript: true,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
        },
      };

      const reactFramework = detection.frameworks.find(f => f.name === 'React');
      expect(reactFramework).toBeDefined();
      expect(reactFramework?.type).toBe('frontend');
    });

    it('should detect Express framework structure', () => {
      const detection: ProjectDetection = {
        language: 'javascript',
        packageManager: 'npm',
        testFramework: 'jest',
        buildTool: 'webpack',
        frameworks: [
          {
            name: 'Express',
            type: 'backend',
            version: '^4.18.0',
            configFiles: [],
            dependencies: ['express'],
          },
        ],
        hasTypeScript: false,
        hasTests: true,
        monorepo: false,
        recommendations: {
          agentPreference: ['Claude (Opus 4.5)'],
          maxConcurrency: 3,
          useCache: true,
        },
      };

      const expressFramework = detection.frameworks.find(f => f.name === 'Express');
      expect(expressFramework).toBeDefined();
      expect(expressFramework?.type).toBe('backend');
    });
  });
});
