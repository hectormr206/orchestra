/**
 * Prompt template para el Auditor
 */

export interface AuditResult {
  status: "APPROVED" | "NEEDS_WORK";
  issues: AuditIssue[];
  summary: string;
}

export interface AuditIssue {
  file: string;
  severity: "critical" | "major" | "minor";
  description: string;
  suggestion: string;
}

/**
 * Resultado de auditoría de un solo archivo
 */
export interface SingleFileAuditResult {
  file: string;
  status: "APPROVED" | "NEEDS_WORK";
  issues: AuditIssue[];
  summary: string;
}

/**
 * Construye prompt para auditar un archivo individual
 */
export function buildSingleFileAuditorPrompt(
  planContent: string,
  file: { path: string; content: string },
  iteration?: number,
  maxIterations?: number,
): string {
  const fileType = detectFileType(file.path);

  switch (fileType) {
    case "documentation":
      return buildDocumentationAuditPrompt(planContent, file);
    case "config":
      return buildConfigAuditPrompt(planContent, file);
    case "build":
      return buildBuildFileAuditPrompt(planContent, file);
    case "data":
      return buildDataFileAuditPrompt(planContent, file);
    case "unknown":
      return buildUnknownFileAuditPrompt(planContent, file);
    case "code":
    default:
      return buildCodeAuditPrompt(planContent, file, iteration, maxIterations);
  }
}

/**
 * Detecta el tipo de archivo basado en su extensión y nombre
 */
function detectFileType(
  filePath: string,
): "documentation" | "config" | "build" | "data" | "code" | "unknown" {
  const lowerPath = filePath.toLowerCase();
  const fileName = lowerPath.split("/").pop() || lowerPath;

  // Archivos de documentación
  const docExtensions = [
    ".md",
    ".txt",
    ".rst",
    ".adoc",
    ".markdown",
    ".doc",
    ".docx",
  ];
  if (docExtensions.some((ext) => lowerPath.endsWith(ext))) {
    return "documentation";
  }

  // Archivos de configuración
  const configExtensions = [
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".env",
    ".properties",
  ];
  const configFiles = [
    "package.json",
    "tsconfig.json",
    "pyproject.toml",
    ".eslintrc",
    ".prettierrc",
  ];
  if (
    configExtensions.some((ext) => lowerPath.endsWith(ext)) ||
    configFiles.some((f) => fileName.includes(f))
  ) {
    return "config";
  }

  // Archivos de build/tooling
  const buildFiles = [
    "makefile",
    "dockerfile",
    "docker-compose",
    ".gitignore",
    ".dockerignore",
    ".editorconfig",
    ".nvmrc",
    ".node-version",
    "procfile",
    "gemfile",
  ];
  const buildExtensions = [".sh", ".bash", ".zsh", ".bat", ".cmd", ".ps1"];
  if (
    buildFiles.some((f) => fileName.includes(f)) ||
    buildExtensions.some((ext) => lowerPath.endsWith(ext))
  ) {
    return "build";
  }

  // Archivos de datos
  const dataExtensions = [".csv", ".xml", ".sql", ".graphql", ".gql"];
  if (dataExtensions.some((ext) => lowerPath.endsWith(ext))) {
    return "data";
  }

  // Extensiones de código conocidas
  const codeExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".r",
    ".lua",
    ".perl",
    ".pl",
    ".m",
    ".mm",
    ".vue",
    ".svelte",
    ".astro",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".prisma",
  ];
  if (codeExtensions.some((ext) => lowerPath.endsWith(ext))) {
    return "code";
  }

  // Archivo desconocido - dejar que el Auditor decida
  return "unknown";
}

/**
 * Prompt para archivos de código (estricto en iter 1, progresivamente permisivo)
 */
function buildCodeAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
  iteration?: number,
  maxIterations?: number,
): string {
  const isLateIteration = iteration && maxIterations && iteration >= maxIterations - 1;
  const isLastIteration = iteration && maxIterations && iteration >= maxIterations;

  const leniencyNote = isLastIteration
    ? `\n## NOTA IMPORTANTE - ULTIMA ITERACION (${iteration}/${maxIterations})
Este archivo ya fue corregido ${iteration! - 1} veces. Aplica criterio PRAGMATICO:
- Si el codigo compila y la funcionalidad PRINCIPAL esta implementada: APPROVED
- Solo rechaza si hay errores de SINTAXIS que impiden compilar o bugs CRITICOS
- Issues menores o de estilo NO son razon para rechazar en esta iteracion
- Prioriza que el codigo sea FUNCIONAL sobre que sea perfecto\n`
    : isLateIteration
    ? `\n## NOTA - ITERACION AVANZADA (${iteration}/${maxIterations})
Este archivo ya fue corregido previamente. Se mas permisivo con issues menores.
- Solo rechaza por errores criticos o funcionalidad principal faltante
- Issues de estilo o mejoras opcionales: marca como "minor" pero aprueba\n`
    : "";

  return `Eres un Auditor de Código Senior. Tu trabajo es revisar UN archivo específico.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`
${leniencyNote}
## TU TAREA

Revisa SOLO este archivo y determina si cumple con su parte del plan. Busca:

1. **Errores de sintaxis** - Código que no compilará/ejecutará
2. **Texto basura** - Explicaciones que no deberían estar en el código
3. **Funcionalidad incompleta** - Lo que este archivo debía hacer según el plan
4. **Bugs obvios** - Errores lógicos evidentes

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del archivo"
}

REGLAS:
- Si hay errores de sintaxis o texto basura: NEEDS_WORK
- Si falta funcionalidad crítica: NEEDS_WORK
- Si solo hay issues menores: puedes aprobar con APPROVED
- Responde SOLO con el JSON, nada más`;
}

/**
 * Construye prompt para auditar archivos de documentación
 */
function buildDocumentationAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
): string {
  return `Eres un Auditor de Documentación. Tu trabajo es revisar UN archivo de documentación.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

## TU TAREA

Revisa SOLO este archivo de documentación y determina si cumple con su propósito. Evalúa:

1. **Contenido relevante** - ¿El contenido aborda lo que el plan requiere?
2. **Estructura clara** - ¿Tiene encabezados, secciones, listas según corresponda?
3. **Completitud básica** - ¿Cubre los puntos principales que debería cubrir?
4. **Legibilidad** - ¿Es comprensible y no está corrupto?

## IMPORTANTE - CRITERIOS DE APROBACIÓN

- Los archivos de documentación son MÁS FLEXIBLES que el código
- Si el archivo tiene contenido relevante y está bien estructurado: APPROVED
- Solo marca NEEDS_WORK si el archivo está vacío, corrupto, o completamente fuera de tema
- NO seas excesivamente crítico con el estilo o la extensión

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del archivo"
}

REGLAS PARA DOCUMENTACIÓN:
- Si el contenido es relevante y legible: APPROVED
- Si está vacío o corrupto: NEEDS_WORK
- Si tiene estructura básica (encabezados, listas): APPROVED
- Sé permisivo - la documentación no necesita ser perfecta
- Responde SOLO con el JSON, nada más`;
}

/**
 * Prompt para archivos de configuración (permisivo)
 */
function buildConfigAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
): string {
  return `Eres un Auditor de Configuración. Tu trabajo es revisar UN archivo de configuración.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

## TU TAREA

Revisa SOLO este archivo de configuración y determina si es válido. Evalúa:

1. **Sintaxis válida** - ¿El formato es correcto para su tipo (JSON, YAML, etc.)?
2. **Estructura razonable** - ¿Tiene las claves/valores esperados?
3. **No está corrupto** - ¿Es parseable y legible?

## IMPORTANTE - CRITERIOS DE APROBACIÓN

- Los archivos de configuración son relativamente simples
- Si el archivo tiene sintaxis válida y estructura razonable: APPROVED
- Solo marca NEEDS_WORK si el archivo está corrupto o tiene errores de sintaxis obvios
- NO evalúes si los valores son "correctos" - eso depende del contexto

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del archivo"
}

REGLAS PARA CONFIGURACIÓN:
- Si la sintaxis es válida: APPROVED
- Si está corrupto o no es parseable: NEEDS_WORK
- Sé permisivo con los valores - enfócate en la estructura
- Responde SOLO con el JSON, nada más`;
}

/**
 * Prompt para archivos de build/tooling (muy permisivo)
 */
function buildBuildFileAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
): string {
  return `Eres un Auditor de Archivos de Build/Tooling. Tu trabajo es revisar UN archivo de configuración de build.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

## TU TAREA

Revisa SOLO este archivo y determina si cumple su propósito básico. Evalúa:

1. **Formato válido** - ¿El archivo tiene el formato correcto para su tipo?
2. **Contenido presente** - ¿Tiene contenido relevante?
3. **No está corrupto** - ¿Es legible?

## IMPORTANTE - CRITERIOS DE APROBACIÓN

- Los archivos de build/tooling son MUY SIMPLES de evaluar
- Makefiles, Dockerfiles, .gitignore, scripts: si tienen contenido razonable, APPROVED
- Solo marca NEEDS_WORK si el archivo está completamente vacío o corrupto
- NO evalúes la "calidad" del script - solo que exista y sea legible

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del archivo"
}

REGLAS PARA BUILD FILES:
- Si tiene contenido y es legible: APPROVED
- Si está vacío o corrupto: NEEDS_WORK
- Sé MUY permisivo - estos archivos rara vez están "mal"
- Responde SOLO con el JSON, nada más`;
}

/**
 * Prompt para archivos de datos (muy permisivo)
 */
function buildDataFileAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
): string {
  return `Eres un Auditor de Archivos de Datos. Tu trabajo es revisar UN archivo de datos.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

## TU TAREA

Revisa SOLO este archivo de datos y determina si es válido. Evalúa:

1. **Formato válido** - ¿El contenido sigue el formato esperado (CSV, XML, SQL)?
2. **No está corrupto** - ¿Es parseable y legible?
3. **Tiene datos** - ¿Contiene información?

## IMPORTANTE - CRITERIOS DE APROBACIÓN

- Los archivos de datos son para almacenar información
- Si el archivo tiene formato válido y contiene datos: APPROVED
- Solo marca NEEDS_WORK si el archivo está corrupto o vacío
- NO evalúes si los datos son "correctos" - solo el formato

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del archivo"
}

REGLAS PARA DATOS:
- Si el formato es válido y tiene contenido: APPROVED
- Si está corrupto o vacío: NEEDS_WORK
- Sé permisivo con los datos específicos
- Responde SOLO con el JSON, nada más`;
}

/**
 * Prompt para archivos de tipo desconocido (inteligente)
 */
function buildUnknownFileAuditPrompt(
  planContent: string,
  file: { path: string; content: string },
): string {
  return `Eres un Auditor de Archivos Políglota. Tu trabajo es revisar UN archivo de un tipo desconocido o no estándar.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

## TU TAREA

1. **Analiza el contenido** para deducir qué tipo de archivo es (código, configuración, documentación, datos, etc.).
2. **Aplica criterios apropiados** para ese tipo de archivo:
   - Si parece **código**: Verifica sintaxis básica y estructura.
   - Si parece **configuración/datos**: Verifica formato válido (JSON, XML, Key-Value).
   - Si parece **documentación/texto**: Verifica legibilidad y relevancia.
   - Si es **binario o ininteligible**: Marca como NEEDS_WORK (corrupto).

## IMPORTANTE - CRITERIOS DE APROBACIÓN

- Ante la duda, SÉ PERMISIVO.
- El objetivo es detectar archivos rotos, vacíos o claramente incorrectos.
- No rechaces un archivo solo porque no conoces la extensión, si el contenido tiene sentido.

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "file": "${file.path}",
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "${file.path}",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema detectar",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve (incluye qué tipo de archivo crees que es)"
}

REGLAS:
- Si el contenido parece intencional y válido: APPROVED
- Si está vacío o parece basura aleatoria: NEEDS_WORK
- Responde SOLO con el JSON, nada más`;
}

/**
 * Parsea la respuesta de auditoría de un solo archivo
 */
export function parseSingleFileAuditResponse(
  response: string,
  fileName: string,
): SingleFileAuditResult {
  let jsonStr = response;

  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      file: parsed.file || fileName,
      status: parsed.status === "APPROVED" ? "APPROVED" : "NEEDS_WORK",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || "Sin resumen",
    };
  } catch {
    return {
      file: fileName,
      status: "NEEDS_WORK",
      issues: [
        {
          file: fileName,
          severity: "major",
          description: "No se pudo parsear la respuesta del auditor",
          suggestion: "Revisar manualmente",
        },
      ],
      summary: "Error parseando respuesta",
    };
  }
}

export function buildAuditorPrompt(
  planContent: string,
  files: { path: string; content: string }[],
  iteration?: number,
  maxIterations?: number,
): string {
  const filesSection = files
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const isLastIteration = iteration && maxIterations && iteration >= maxIterations;
  const leniencyNote = isLastIteration
    ? `\n## NOTA - ULTIMA ITERACION (${iteration}/${maxIterations})
Estos archivos ya fueron corregidos multiples veces. Aplica criterio PRAGMATICO:
- Si el codigo compila y la funcionalidad principal esta implementada: APPROVED
- Solo rechaza por errores de SINTAXIS o bugs CRITICOS
- Issues menores NO son razon para rechazar\n`
    : "";

  return `Eres un Auditor de Código Senior. Tu trabajo es revisar código y verificar que cumple con el plan.

## PLAN ORIGINAL
${planContent}

## ARCHIVOS GENERADOS
${filesSection}
${leniencyNote}
## TU TAREA

Revisa el código y determina si cumple con el plan. Busca:

1. **Errores de sintaxis** - Código que no compilará/ejecutará
2. **Texto basura** - Explicaciones o comentarios que no deberían estar en el código
3. **Funcionalidad incompleta** - Features del plan que no se implementaron
4. **Bugs obvios** - Errores lógicos evidentes
5. **Malas prácticas** - Código inseguro o mal estructurado

## FORMATO DE RESPUESTA

Responde EXACTAMENTE en este formato JSON:

{
  "status": "APPROVED" | "NEEDS_WORK",
  "issues": [
    {
      "file": "nombre_archivo.py",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "suggestion": "Cómo solucionarlo"
    }
  ],
  "summary": "Resumen breve del estado del código"
}

REGLAS:
- Si hay errores de sintaxis o texto basura: NEEDS_WORK
- Si falta funcionalidad crítica del plan: NEEDS_WORK
- Si solo hay issues menores: puedes aprobar con APPROVED
- Sé estricto pero justo
- Responde SOLO con el JSON, nada más`;
}

/**
 * Parsea la respuesta del Auditor
 */
export function parseAuditResponse(response: string): AuditResult {
  // Intentar extraer JSON de la respuesta
  let jsonStr = response;

  // Si viene envuelto en bloques de código, extraerlo
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Intentar encontrar el objeto JSON
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      status: parsed.status === "APPROVED" ? "APPROVED" : "NEEDS_WORK",
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || "Sin resumen",
    };
  } catch {
    // Si no podemos parsear, asumir que necesita trabajo
    return {
      status: "NEEDS_WORK",
      issues: [
        {
          file: "unknown",
          severity: "major",
          description: "No se pudo parsear la respuesta del auditor",
          suggestion: "Revisar manualmente",
        },
      ],
      summary: "Error parseando respuesta del auditor",
    };
  }
}

/**
 * Verifica si el código es válido (empieza con sintaxis válida para cualquier lenguaje)
 */
export function isValidCode(code: string, fileName?: string): boolean {
  const lines = code.trim().split("\n");
  if (lines.length === 0) return false;

  const firstLine = lines[0].trim();
  const extension = fileName?.split(".").pop()?.toLowerCase() || "";

  // Python-specific patterns
  const pythonStarts = [
    /^#/, /^from\s+/, /^import\s+/, /^class\s+/, /^def\s+/,
    /^@/, /^"""/, /^'''/, /^[a-z_][a-z0-9_]*\s*=/i,
  ];

  // JS/TS/JSX/TSX patterns
  const jsStarts = [
    /^import\s+/, /^export\s+/, /^const\s+/, /^let\s+/, /^var\s+/,
    /^function\s+/, /^class\s+/, /^\/\//, /^\/\*/, /^"use /, /^'use /,
    /^type\s+/, /^interface\s+/, /^enum\s+/, /^async\s+/, /^declare\s+/,
    /^module\.exports/, /^require\(/, /^@/, // decorators
  ];

  // Go patterns
  const goStarts = [
    /^package\s+/, /^import\s+/, /^func\s+/, /^type\s+/, /^var\s+/,
    /^const\s+/, /^\/\//, /^\/\*/,
  ];

  // Rust patterns
  const rustStarts = [
    /^use\s+/, /^mod\s+/, /^fn\s+/, /^pub\s+/, /^struct\s+/,
    /^enum\s+/, /^impl\s+/, /^trait\s+/, /^#\[/, /^\/\//,
    /^extern\s+/, /^const\s+/, /^let\s+/, /^static\s+/,
  ];

  // HTML/CSS/SCSS patterns
  const markupStarts = [
    /^<!DOCTYPE/i, /^<html/i, /^<\?xml/, /^<[a-z]/i,
    /^@import/, /^@charset/, /^@media/, /^[.#a-z]/i, /^:root/,
    /^\*\s*\{/, /^body\s*\{/, /^html\s*\{/,
  ];

  // Select patterns based on extension
  if (["py"].includes(extension)) {
    return pythonStarts.some((p) => p.test(firstLine));
  }
  if (["js", "ts", "jsx", "tsx", "mjs", "cjs", "mts", "cts"].includes(extension)) {
    return jsStarts.some((p) => p.test(firstLine));
  }
  if (["go"].includes(extension)) {
    return goStarts.some((p) => p.test(firstLine));
  }
  if (["rs"].includes(extension)) {
    return rustStarts.some((p) => p.test(firstLine));
  }
  if (["html", "htm", "css", "scss", "sass", "less", "vue", "svelte"].includes(extension)) {
    return markupStarts.some((p) => p.test(firstLine));
  }

  // For unknown extensions, check against ALL patterns
  const allStarts = [...pythonStarts, ...jsStarts, ...goStarts, ...rustStarts, ...markupStarts];
  return allStarts.some((p) => p.test(firstLine));
}

/**
 * @deprecated Use isValidCode instead
 */
export function isValidPythonCode(code: string): boolean {
  return isValidCode(code, "file.py");
}

/**
 * Genera prompt para el Ejecutor basado en feedback del Auditor
 */
export function buildFixPrompt(
  originalCode: string,
  fileName: string,
  issues: AuditIssue[],
  planContext?: string,
  iteration?: number,
  maxIterations?: number,
): string {
  const issuesText = issues
    .filter((i) => i.file === fileName || i.file === "unknown")
    .map(
      (i) =>
        `- [${i.severity}] ${i.description}\n  Sugerencia: ${i.suggestion}`,
    )
    .join("\n");

  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const examples = getFixExamples(extension, fileName);

  const iterationContext = iteration && maxIterations
    ? `\nITERACION: ${iteration} de ${maxIterations}. ${iteration >= maxIterations ? "ULTIMO INTENTO - corrige SOLO los problemas listados, no cambies nada mas." : ""}\n`
    : "";

  // Si el código original no es válido, generar desde cero
  if (!isValidCode(originalCode, fileName)) {
    return `===============================================================================
TAREA: REGENERAR ARCHIVO DESDE CERO
===============================================================================
${iterationContext}
El archivo "${fileName}" no contiene código válido y debe ser completamente reescrito.

PROBLEMAS DETECTADOS POR EL AUDITOR:
${issuesText}

${planContext ? `CONTEXTO DEL PLAN:\n${planContext}\n` : ""}

${examples}

===============================================================================
REGLAS CRITICAS DE FORMATO:
===============================================================================
1. Tu respuesta debe comenzar DIRECTAMENTE con código válido
2. La PRIMERA LINEA debe ser codigo ejecutable (import, from, class, def, function, const, #, //, etc.)
3. NO incluyas explicaciones ni texto introductorio
4. NO uses markdown ni \`\`\`
5. El código debe estar COMPLETO - todas las funciones implementadas
6. Incluye TODOS los imports necesarios

===============================================================================
GENERA EL CÓDIGO COMPLETO PARA: ${fileName}
===============================================================================
`;
  }

  return `===============================================================================
TAREA: CORREGIR CÓDIGO EXISTENTE
===============================================================================
${iterationContext}
CÓDIGO ACTUAL DE ${fileName}:
---------------------------------------------------------
${originalCode}
---------------------------------------------------------

PROBLEMAS DETECTADOS POR EL AUDITOR:
${issuesText}

${examples}

===============================================================================
INSTRUCCIONES:
===============================================================================
1. Corrige TODOS los problemas listados arriba
2. Mantén la funcionalidad existente que funciona - NO reescribas desde cero
3. Asegúrate de que el código esté COMPLETO (sin funciones truncadas)
4. Verifica que todos los imports estén presentes
5. Cambia SOLO lo necesario para resolver los problemas

REGLAS DE FORMATO:
- Tu respuesta debe comenzar DIRECTAMENTE con código
- La PRIMERA LINEA debe ser codigo ejecutable (import, from, class, def, function, const, #, //, etc.)
- NO incluyas texto explicativo
- NO uses markdown ni \`\`\`
- Solo código limpio y funcional

===============================================================================
GENERA EL CÓDIGO CORREGIDO:
===============================================================================
`;
}

/**
 * Retorna ejemplos específicos para el prompt de corrección
 */
function getFixExamples(extension: string, fileName: string): string {
  if (extension === "py") {
    if (fileName.includes("model")) {
      return `
EJEMPLO DE CÓDIGO CORRECTO PARA MODELOS:
---------------------------------------------------------
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
---------------------------------------------------------
NOTA: El método to_dict() debe estar COMPLETO con el return y el diccionario cerrado.
`;
    }

    if (fileName.includes("app")) {
      return `
EJEMPLO DE CÓDIGO CORRECTO PARA APP FLASK:
---------------------------------------------------------
from flask import Flask, request, jsonify
from models import db, User

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user = User(username=data.get('username'), email=data.get('email'))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


if __name__ == '__main__':
    app.run(debug=True)
---------------------------------------------------------
NOTA: Los decoradores @app.route NO deben tener espacios al inicio de la línea.
`;
    }
  }

  if (extension === "tsx" || extension === "jsx") {
    return `
EJEMPLO DE CÓDIGO CORRECTO PARA COMPONENTE REACT (${extension.toUpperCase()}):
---------------------------------------------------------
"use client"

import React from "react"

interface Props {
  title: string
}

export default function Page({ title }: Props) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}
---------------------------------------------------------
NOTA: La primera linea debe ser un import, directiva "use client", o export. NO texto explicativo.
`;
  }

  if (extension === "ts" || extension === "js") {
    return `
EJEMPLO DE CÓDIGO CORRECTO PARA MODULO (${extension.toUpperCase()}):
---------------------------------------------------------
import { readFile } from "fs/promises"

export interface Config {
  name: string
  port: number
}

export async function loadConfig(path: string): Promise<Config> {
  const content = await readFile(path, "utf-8")
  return JSON.parse(content)
}
---------------------------------------------------------
NOTA: La primera linea debe ser import, export, const, function, o comentario. NO texto explicativo.
`;
  }

  if (extension === "txt" && fileName.includes("requirements")) {
    return `
EJEMPLO DE requirements.txt CORRECTO:
---------------------------------------------------------
Flask==3.0.0
Flask-SQLAlchemy>=3.1.0
python-dotenv>=1.0.0
---------------------------------------------------------
NOTA: Una dependencia por línea, sin texto adicional.
`;
  }

  return "";
}
