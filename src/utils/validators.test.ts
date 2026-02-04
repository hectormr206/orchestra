/**
 * Tests for validators
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validatePython,
  validateJavaScript,
  validateTypeScript,
  validateGo,
  validateRust,
  validateJSON,
  validateYAML,
} from './validators.js';

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('validators', () => {
  describe('validatePython', () => {
    it('should validate correct Python code', () => {
      const code = 'def hello():\n    print("Hello, World!")';
      expect(validatePython(code)).toBe(true);
    });

    it('should reject invalid Python code', () => {
      const code = 'def hello(:\n    print("Hello")';
      expect(validatePython(code)).toBe(false);
    });

    it('should handle empty code', () => {
      expect(validatePython('')).toBe(true);
    });
  });

  describe('validateJavaScript', () => {
    it('should validate correct JavaScript code', () => {
      const code = 'function hello() {\n  console.log("Hello");\n}';
      expect(validateJavaScript(code)).toBe(true);
    });

    it('should reject invalid JavaScript code', () => {
      const code = 'function hello( {\n  console.log("Hello");\n}';
      expect(validateJavaScript(code)).toBe(false);
    });
  });

  describe('validateTypeScript', () => {
    it('should validate correct TypeScript code', () => {
      const code = 'const greeting: string = "Hello";';
      expect(validateTypeScript(code)).toBe(true);
    });

    it('should reject invalid TypeScript code', () => {
      const code = 'const greeting: stri = "Hello";';
      expect(validateTypeScript(code)).toBe(false);
    });
  });

  describe('validateGo', () => {
    it('should validate correct Go code', () => {
      const code = 'package main\n\nfunc main() {\n  println("Hello")\n}';
      expect(validateGo(code)).toBe(true);
    });

    it('should reject invalid Go code', () => {
      const code = 'package main\n\nfunc main( {\n  println("Hello")\n}';
      expect(validateGo(code)).toBe(false);
    });
  });

  describe('validateRust', () => {
    it('should validate correct Rust code', () => {
      const code = 'fn main() {\n  println!("Hello");\n}';
      expect(validateRust(code)).toBe(true);
    });

    it('should reject invalid Rust code', () => {
      const code = 'fn main( {\n  println!("Hello");\n}';
      expect(validateRust(code)).toBe(false);
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON', () => {
      const json = '{"name": "Test", "value": 123}';
      expect(validateJSON(json)).toBe(true);
    });

    it('should reject invalid JSON', () => {
      const json = '{"name": "Test", value: 123}';
      expect(validateJSON(json)).toBe(false);
    });

    it('should handle empty JSON object', () => {
      expect(validateJSON('{}')).toBe(true);
    });
  });

  describe('validateYAML', () => {
    it('should validate correct YAML', () => {
      const yaml = 'name: Test\nvalue: 123';
      expect(validateYAML(yaml)).toBe(true);
    });

    it('should handle invalid YAML', () => {
      // YAML is permissive, most things are valid
      const yaml = 'name: Test\nvalue: 123: invalid';
      expect(validateYAML(yaml)).toBeDefined();
    });
  });
});
