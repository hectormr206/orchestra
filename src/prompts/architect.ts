/**
 * Prompt template para el Arquitecto
 */

export function buildArchitectPrompt(
  task: string,
  skills: string[] = [],
  customContext?: string
): string {
  const skillsSection = skills.length > 0
    ? `\nANTES DE PLANIFICAR, considera estos skills de ai-core:\n${skills.map(s => `- ${s}`).join('\n')}\n`
    : '';

  const customSection = customContext
    ? `\nCONTEXTO ADICIONAL DEL PROYECTO:\n${customContext}\n`
    : '';

  return `Eres un Arquitecto de Software Senior.
${customSection}

TAREA DEL USUARIO:
${task}
${skillsSection}
Crea un plan de implementación detallado. Responde SOLO con el plan en formato Markdown:

# Plan de Implementación

## Objetivo
[Descripción clara del objetivo]

## Análisis
[Breve análisis de la tarea y consideraciones]

## Pasos de Implementación
1. [Paso detallado]
2. [Paso detallado]
...

## Archivos a Crear/Modificar
- \`[ruta/archivo]\`: [descripción de qué hace]

## Dependencias
- [Si se necesitan instalar paquetes, listarlos aquí]

## Criterios de Éxito
- [ ] [Criterio verificable 1]
- [ ] [Criterio verificable 2]

## Notas Técnicas
[Consideraciones importantes para el implementador]

IMPORTANTE:
- Sé específico en los pasos
- Incluye nombres de archivos exactos
- El Ejecutor seguirá este plan literalmente`;
}
