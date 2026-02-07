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
  type: "syntax_error" | "incomplete_code" | "algorithm" | "optimization";
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
  syntaxError: string,
): string {
  return `===============================================================================
TAREA: CORREGIR ERROR DE SINTAXIS
===============================================================================

ARCHIVO: ${fileName}

ERROR DETECTADO:
-------------------------------------------------------------------------------
${syntaxError}
-------------------------------------------------------------------------------

CÓDIGO CON ERROR:
-------------------------------------------------------------------------------
${code}
-------------------------------------------------------------------------------

===============================================================================
INSTRUCCIONES
===============================================================================
1. Identifica y corrige el error de sintaxis
2. Mantén TODA la funcionalidad existente
3. Asegúrate de que los imports estén completos
4. Verifica que los brackets estén balanceados

REGLAS DE FORMATO DE RESPUESTA:
-------------------------------------------------------------------------------
- Tu respuesta debe comenzar DIRECTAMENTE con código
- La primera linea debe ser codigo ejecutable (import, from, class, def, function, const, #, //, etc.)
- NO incluyas explicaciones de texto
- NO uses bloques markdown (\`\`\`)
- Solo código limpio y funcional
-------------------------------------------------------------------------------

===============================================================================
GENERA EL CÓDIGO CORREGIDO:
===============================================================================`;
}

/**
 * Genera prompt para completar código truncado
 */
export function buildCompleteCodePrompt(
  fileName: string,
  code: string,
  context?: string,
): string {
  return `===============================================================================
TAREA: COMPLETAR CÓDIGO TRUNCADO
===============================================================================

ARCHIVO: ${fileName}

${context ? `CONTEXTO:\n${context}\n` : ""}

CÓDIGO INCOMPLETO:
-------------------------------------------------------------------------------
${code}
-------------------------------------------------------------------------------

===============================================================================
PROBLEMAS TÍPICOS A RESOLVER
===============================================================================
- Funciones/métodos sin cuerpo (terminan en colon sin código)
- Diccionarios/listas sin cerrar (falta }, ] o ))
- Strings sin cerrar (comillas sin emparejar)
- Return statements incompletos
- Clases sin métodos implementados

===============================================================================
INSTRUCCIONES
===============================================================================
1. Identifica dónde está truncado el código
2. COMPLETA todas las funciones y métodos
3. Asegúrate de que todos los brackets estén cerrados
4. Verifica que los strings estén completos
5. Incluye todos los imports necesarios

REGLAS DE FORMATO DE RESPUESTA:
-------------------------------------------------------------------------------
- Tu respuesta debe comenzar DIRECTAMENTE con código
- La primera linea debe ser codigo ejecutable (import, from, class, def, function, const, #, //, etc.)
- NO incluyas explicaciones de texto
- NO uses bloques markdown (\`\`\`)
- INCLUYE el código existente + la parte que falta
-------------------------------------------------------------------------------

EJEMPLO DE LO QUE SE ESPERA:
-------------------------------------------------------------------------------
# Si el código incompleto es:
def calculate_total(items):
    return {

# Tu respuesta debe ser el código COMPLETO:
def calculate_total(items):
    return {
        'total': sum(item.price for item in items),
        'count': len(items)
    }
-------------------------------------------------------------------------------

===============================================================================
GENERA EL CÓDIGO COMPLETO:
===============================================================================`;
}

/**
 * Genera prompt para resolver problemas algorítmicos
 */
export function buildAlgorithmPrompt(
  problem: string,
  language: string = "python",
): string {
  return `===============================================================================
TAREA: RESOLVER PROBLEMA ALGORÍTMICO
===============================================================================

PROBLEMA:
-------------------------------------------------------------------------------
${problem}
-------------------------------------------------------------------------------

LENGUAJE: ${language}

===============================================================================
REQUISITOS
===============================================================================
1. Implementa una solución eficiente (O(n) o O(n log n) preferido sobre O(n²))
2. Incluye manejo de errores para edge cases
3. Usa nombres de variables descriptivos
4. Añade docstrings/comentarios breves si la lógica es compleja

REGLAS DE FORMATO DE RESPUESTA:
-------------------------------------------------------------------------------
- Tu respuesta debe comenzar DIRECTAMENTE con código
- NO incluyas explicaciones de texto antes o después
- NO uses bloques markdown (\`\`\`)
- Solo código limpio, funcional y bien estructurado
-------------------------------------------------------------------------------

===============================================================================
GENERA EL CÓDIGO:
===============================================================================`;
}

/**
 * Detecta si el código Python está incompleto
 */
export function detectIncompleteCode(code: string): {
  isIncomplete: boolean;
  reason?: string;
} {
  const lines = code.trim().split("\n");
  if (lines.length === 0) {
    return { isIncomplete: true, reason: "Empty file" };
  }

  const lastLine = lines[lines.length - 1].trim();

  // Detectar funciones/métodos incompletos
  if (lastLine.endsWith(":")) {
    return { isIncomplete: true, reason: "Function or block without body" };
  }

  // Detectar diccionarios/listas incompletos
  if (lastLine === "{" || lastLine === "[" || lastLine === "(") {
    return { isIncomplete: true, reason: "Unclosed bracket" };
  }

  if (
    lastLine === "return {" ||
    lastLine === "return [" ||
    lastLine === "return ("
  ) {
    return { isIncomplete: true, reason: "Incomplete return statement" };
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
    return { isIncomplete: true, reason: "Unclosed string" };
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
  const lines = code.split("\n");
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
    code = lines.slice(startIndex).join("\n");
  }

  return code.trim();
}
