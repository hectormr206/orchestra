/**
 * Validadores de sintaxis para múltiples lenguajes
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import type { SupportedLanguage, SyntaxValidationResult, SyntaxError } from '../types.js';

const execFileAsync = promisify(execFile);

/**
 * Detecta el lenguaje basado en la extensión del archivo
 */
export function detectLanguage(filePath: string): SupportedLanguage | null {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, SupportedLanguage> = {
    '.py': 'python',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.go': 'go',
    '.rs': 'rust',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
  };
  return langMap[ext] || null;
}

/**
 * Valida la sintaxis de un archivo
 */
export async function validateSyntax(
  filePath: string,
  content: string,
  language?: SupportedLanguage
): Promise<SyntaxValidationResult> {
  const detectedLang = language || detectLanguage(filePath);

  if (!detectedLang) {
    return {
      file: filePath,
      language: 'python', // default
      valid: true, // Skip unknown languages
      errors: [],
    };
  }

  switch (detectedLang) {
    case 'python':
      return validatePython(filePath, content);
    case 'javascript':
      return validateJavaScript(filePath, content);
    case 'typescript':
      return validateTypeScript(filePath, content);
    case 'go':
      return validateGo(filePath, content);
    case 'rust':
      return validateRust(filePath, content);
    case 'json':
      return validateJSON(filePath, content);
    case 'yaml':
      return validateYAML(filePath, content);
    default:
      return { file: filePath, language: detectedLang, valid: true, errors: [] };
  }
}

/**
 * Valida sintaxis Python usando py_compile
 */
async function validatePython(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    await execFileAsync('python3', ['-m', 'py_compile', filePath]);
    return { file: filePath, language: 'python', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    const errorMsg = error.stderr || error.message || 'Unknown syntax error';

    // Parse Python error format: File "path", line N
    const lineMatch = errorMsg.match(/line (\d+)/);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

    return {
      file: filePath,
      language: 'python',
      valid: false,
      errors: [{
        line,
        column: 1,
        message: errorMsg.split('\n').slice(-2).join(' ').trim(),
      }],
    };
  }
}

/**
 * Valida sintaxis JavaScript usando Node.js --check
 */
async function validateJavaScript(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    await execFileAsync('node', ['--check', filePath]);
    return { file: filePath, language: 'javascript', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    const errorMsg = error.stderr || error.message || 'Unknown syntax error';

    // Parse Node.js error format
    const lineMatch = errorMsg.match(/:(\d+)/);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

    return {
      file: filePath,
      language: 'javascript',
      valid: false,
      errors: [{
        line,
        column: 1,
        message: errorMsg.split('\n')[0].trim(),
      }],
    };
  }
}

/**
 * Valida sintaxis TypeScript usando tsc --noEmit
 */
async function validateTypeScript(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    // Check if tsc is available
    await execFileAsync('npx', ['tsc', '--noEmit', '--skipLibCheck', filePath], {
      timeout: 30000,
    });
    return { file: filePath, language: 'typescript', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string; message?: string };
    const errorMsg = error.stdout || error.stderr || error.message || 'Unknown syntax error';

    // Parse TypeScript error format: file(line,col): error
    const errors: SyntaxError[] = [];
    const errorLines = errorMsg.split('\n').filter(l => l.includes('error TS'));

    for (const line of errorLines) {
      const match = line.match(/\((\d+),(\d+)\):\s*error\s+\w+:\s*(.+)/);
      if (match) {
        errors.push({
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10),
          message: match[3],
        });
      }
    }

    if (errors.length === 0) {
      errors.push({ line: 1, column: 1, message: errorMsg.split('\n')[0] });
    }

    return {
      file: filePath,
      language: 'typescript',
      valid: false,
      errors,
    };
  }
}

/**
 * Valida sintaxis Go usando go build
 */
async function validateGo(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    // Use go vet for syntax checking without building
    await execFileAsync('go', ['vet', filePath], { timeout: 30000 });
    return { file: filePath, language: 'go', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    const errorMsg = error.stderr || error.message || 'Unknown syntax error';

    // Parse Go error format: file:line:col: message
    const errors: SyntaxError[] = [];
    const errorLines = errorMsg.split('\n').filter(l => l.includes(':'));

    for (const line of errorLines) {
      const match = line.match(/:(\d+):(\d+):\s*(.+)/);
      if (match) {
        errors.push({
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10),
          message: match[3],
        });
      }
    }

    if (errors.length === 0) {
      errors.push({ line: 1, column: 1, message: errorMsg.split('\n')[0] });
    }

    return {
      file: filePath,
      language: 'go',
      valid: false,
      errors,
    };
  }
}

/**
 * Valida sintaxis Rust usando rustc --emit=metadata
 */
async function validateRust(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    // Use cargo check if in a cargo project, otherwise rustc
    const tempOutput = `/tmp/rust_check_${Date.now()}`;
    await execFileAsync('rustc', ['--emit=metadata', '-o', tempOutput, filePath], {
      timeout: 30000,
    });
    // Clean up
    try { await unlink(tempOutput); } catch { /* ignore */ }
    return { file: filePath, language: 'rust', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    const errorMsg = error.stderr || error.message || 'Unknown syntax error';

    // Parse Rust error format
    const errors: SyntaxError[] = [];
    const errorLines = errorMsg.split('\n').filter(l => l.includes('error'));

    for (const line of errorLines) {
      const match = line.match(/:(\d+):(\d+)/);
      if (match) {
        errors.push({
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10),
          message: line.replace(/^.*error/, 'error').trim(),
        });
      }
    }

    if (errors.length === 0) {
      errors.push({ line: 1, column: 1, message: errorMsg.split('\n')[0] });
    }

    return {
      file: filePath,
      language: 'rust',
      valid: false,
      errors,
    };
  }
}

/**
 * Valida sintaxis JSON
 */
async function validateJSON(filePath: string, content: string): Promise<SyntaxValidationResult> {
  try {
    JSON.parse(content);
    return { file: filePath, language: 'json', valid: true, errors: [] };
  } catch (err: unknown) {
    const error = err as Error;

    // Parse JSON error to get position
    const posMatch = error.message.match(/position (\d+)/);
    let line = 1;
    let column = 1;

    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const lines = content.substring(0, pos).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    return {
      file: filePath,
      language: 'json',
      valid: false,
      errors: [{
        line,
        column,
        message: error.message,
      }],
    };
  }
}

/**
 * Valida sintaxis YAML (basic validation)
 */
async function validateYAML(filePath: string, content: string): Promise<SyntaxValidationResult> {
  // Basic YAML validation - check for common syntax errors
  const errors: SyntaxError[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for tabs (YAML doesn't allow tabs for indentation)
    if (line.match(/^\t/)) {
      errors.push({
        line: i + 1,
        column: 1,
        message: 'YAML does not allow tabs for indentation',
      });
    }

    // Check for inconsistent indentation
    const indent = line.match(/^(\s*)/)?.[1].length || 0;
    if (indent % 2 !== 0 && line.trim().length > 0) {
      errors.push({
        line: i + 1,
        column: 1,
        message: 'Inconsistent indentation (should be multiple of 2)',
      });
    }
  }

  return {
    file: filePath,
    language: 'yaml',
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida múltiples archivos en paralelo
 */
export async function validateFiles(
  files: { path: string; content: string }[],
  languages?: SupportedLanguage[]
): Promise<SyntaxValidationResult[]> {
  const results = await Promise.all(
    files.map(file => {
      const lang = detectLanguage(file.path);
      // Skip if language filter is set and doesn't match
      if (languages && languages.length > 0 && lang && !languages.includes(lang)) {
        return Promise.resolve({
          file: file.path,
          language: lang,
          valid: true,
          errors: [],
        } as SyntaxValidationResult);
      }
      return validateSyntax(file.path, file.content);
    })
  );
  return results;
}
