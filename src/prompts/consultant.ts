/**
 * Prompt templates para el Consultor (Codex)
 *
 * El Consultor ayuda con:
 * - Problemas algorítmicos complejos
 * - Debugging de errores de sintaxis
 * - Optimización de código
 * - Corrección de código incompleto
 */

export interface ConsultantRequest {
  type: 'syntax_error' | 'incomplete_code' | 'algorithm' | 'optimization';
  fileName: string;
  code: string;
  error?: string;
  context?: string;
}

/**
 * Genera prompt para que el Consultor corrija errores de sintaxis
 */
export function buildSyntaxFixPrompt(
  fileName: string,
  code: string,
  syntaxError: string
): string {
  return `Fix the Python syntax error in this file.

FILE: ${fileName}

ERROR:
${syntaxError}

CODE:
${code}

INSTRUCTIONS:
1. Fix the syntax error
2. Keep all existing functionality
3. Return ONLY the corrected Python code
4. No explanations, no markdown

OUTPUT THE CORRECTED CODE:`;
}

/**
 * Genera prompt para completar código truncado
 */
export function buildCompleteCodePrompt(
  fileName: string,
  code: string,
  context?: string
): string {
  return `Complete this truncated Python code.

FILE: ${fileName}

${context ? `CONTEXT:\n${context}\n` : ''}

INCOMPLETE CODE:
${code}

INSTRUCTIONS:
1. The code appears to be cut off or incomplete
2. Complete ALL functions and methods
3. Ensure all brackets, braces, and parentheses are closed
4. Return the COMPLETE Python code
5. No explanations, no markdown

OUTPUT THE COMPLETE CODE:`;
}

/**
 * Genera prompt para resolver problemas algorítmicos
 */
export function buildAlgorithmPrompt(
  problem: string,
  language: string = 'python'
): string {
  return `Solve this algorithmic problem.

PROBLEM:
${problem}

LANGUAGE: ${language}

INSTRUCTIONS:
1. Implement an efficient solution
2. Include proper error handling
3. Return ONLY the code
4. No explanations, no markdown

OUTPUT THE CODE:`;
}

/**
 * Detecta si el código Python está incompleto
 */
export function detectIncompleteCode(code: string): {
  isIncomplete: boolean;
  reason?: string;
} {
  const lines = code.trim().split('\n');
  if (lines.length === 0) {
    return { isIncomplete: true, reason: 'Empty file' };
  }

  const lastLine = lines[lines.length - 1].trim();

  // Detectar funciones/métodos incompletos
  if (lastLine.endsWith(':')) {
    return { isIncomplete: true, reason: 'Function or block without body' };
  }

  // Detectar diccionarios/listas incompletos
  if (lastLine === '{' || lastLine === '[' || lastLine === '(') {
    return { isIncomplete: true, reason: 'Unclosed bracket' };
  }

  if (lastLine === 'return {' || lastLine === 'return [' || lastLine === 'return (') {
    return { isIncomplete: true, reason: 'Incomplete return statement' };
  }

  // Contar brackets
  const openBrackets = (code.match(/[{(\[]/g) || []).length;
  const closeBrackets = (code.match(/[})\]]/g) || []).length;

  if (openBrackets > closeBrackets) {
    return {
      isIncomplete: true,
      reason: `Unclosed brackets: ${openBrackets - closeBrackets} missing`,
    };
  }

  // Detectar strings incompletos (comillas sin cerrar)
  const singleQuotes = (code.match(/'/g) || []).length;
  const doubleQuotes = (code.match(/"/g) || []).length;
  const tripleQuotes = (code.match(/"""/g) || []).length;

  if (singleQuotes % 2 !== 0 && tripleQuotes === 0) {
    return { isIncomplete: true, reason: 'Unclosed string' };
  }

  return { isIncomplete: false };
}

/**
 * Parsea la respuesta del Consultor
 */
export function parseConsultantResponse(response: string): string {
  let code = response.trim();

  // Remover bloques de código markdown si existen
  const codeBlockMatch = code.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1];
  }

  // Buscar la primera línea de código Python válido
  const lines = code.split('\n');
  let startIndex = 0;

  const codePatterns = [
    /^(from|import)\s+/,
    /^(class|def)\s+/,
    /^#/,
    /^"""/,
    /^'''/,
    /^[a-zA-Z_][a-zA-Z0-9_]*\s*=/,
    /^@/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && codePatterns.some((pattern) => pattern.test(line))) {
      startIndex = i;
      break;
    }
  }

  if (startIndex > 0) {
    code = lines.slice(startIndex).join('\n');
  }

  return code.trim();
}
