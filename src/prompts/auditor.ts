/**
 * Prompt template para el Auditor
 */

export interface AuditResult {
  status: 'APPROVED' | 'NEEDS_WORK';
  issues: AuditIssue[];
  summary: string;
}

export interface AuditIssue {
  file: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  suggestion: string;
}

/**
 * Resultado de auditoría de un solo archivo
 */
export interface SingleFileAuditResult {
  file: string;
  status: 'APPROVED' | 'NEEDS_WORK';
  issues: AuditIssue[];
  summary: string;
}

/**
 * Construye prompt para auditar un archivo individual
 */
export function buildSingleFileAuditorPrompt(
  planContent: string,
  file: { path: string; content: string }
): string {
  return `Eres un Auditor de Código Senior. Tu trabajo es revisar UN archivo específico.

## PLAN ORIGINAL (contexto)
${planContent}

## ARCHIVO A REVISAR: ${file.path}
\`\`\`
${file.content}
\`\`\`

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
 * Parsea la respuesta de auditoría de un solo archivo
 */
export function parseSingleFileAuditResponse(response: string, fileName: string): SingleFileAuditResult {
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
      status: parsed.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_WORK',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || 'Sin resumen',
    };
  } catch {
    return {
      file: fileName,
      status: 'NEEDS_WORK',
      issues: [{
        file: fileName,
        severity: 'major',
        description: 'No se pudo parsear la respuesta del auditor',
        suggestion: 'Revisar manualmente',
      }],
      summary: 'Error parseando respuesta',
    };
  }
}

export function buildAuditorPrompt(
  planContent: string,
  files: { path: string; content: string }[]
): string {
  const filesSection = files
    .map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n');

  return `Eres un Auditor de Código Senior. Tu trabajo es revisar código y verificar que cumple con el plan.

## PLAN ORIGINAL
${planContent}

## ARCHIVOS GENERADOS
${filesSection}

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
      status: parsed.status === 'APPROVED' ? 'APPROVED' : 'NEEDS_WORK',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      summary: parsed.summary || 'Sin resumen',
    };
  } catch {
    // Si no podemos parsear, asumir que necesita trabajo
    return {
      status: 'NEEDS_WORK',
      issues: [{
        file: 'unknown',
        severity: 'major',
        description: 'No se pudo parsear la respuesta del auditor',
        suggestion: 'Revisar manualmente',
      }],
      summary: 'Error parseando respuesta del auditor',
    };
  }
}

/**
 * Verifica si el código es válido (empieza con sintaxis Python válida)
 */
export function isValidPythonCode(code: string): boolean {
  const lines = code.trim().split('\n');
  if (lines.length === 0) return false;

  const firstLine = lines[0].trim();
  const validStarts = [
    /^#/,                              // Comment or shebang
    /^from\s+/,                        // from import
    /^import\s+/,                      // import
    /^class\s+/,                       // class definition
    /^def\s+/,                         // function definition
    /^@/,                              // decorator
    /^"""/ ,                           // docstring
    /^'''/,                            // docstring
    /^[a-z_][a-z0-9_]*\s*=/i,          // assignment
  ];

  return validStarts.some(pattern => pattern.test(firstLine));
}

/**
 * Genera prompt para el Ejecutor basado en feedback del Auditor
 */
export function buildFixPrompt(
  originalCode: string,
  fileName: string,
  issues: AuditIssue[],
  planContext?: string
): string {
  const issuesText = issues
    .filter(i => i.file === fileName || i.file === 'unknown')
    .map(i => `- [${i.severity}] ${i.description}\n  Sugerencia: ${i.suggestion}`)
    .join('\n');

  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const examples = getFixExamples(extension, fileName);

  // Si el código original no es válido, generar desde cero
  if (!isValidPythonCode(originalCode)) {
    return `═══════════════════════════════════════════════════════════════════════════════
TAREA: REGENERAR ARCHIVO DESDE CERO
═══════════════════════════════════════════════════════════════════════════════

El archivo "${fileName}" no contiene código válido y debe ser completamente reescrito.

PROBLEMAS DETECTADOS POR EL AUDITOR:
${issuesText}

${planContext ? `CONTEXTO DEL PLAN:\n${planContext}\n` : ''}

${examples}

═══════════════════════════════════════════════════════════════════════════════
REGLAS CRÍTICAS DE FORMATO:
═══════════════════════════════════════════════════════════════════════════════
1. Tu respuesta debe comenzar DIRECTAMENTE con código válido
2. La PRIMERA LÍNEA debe ser: from, import, class, def, # o """
3. NO incluyas explicaciones ni texto introductorio
4. NO uses markdown ni \`\`\`
5. El código debe estar COMPLETO - todas las funciones implementadas
6. Incluye TODOS los imports necesarios

═══════════════════════════════════════════════════════════════════════════════
GENERA EL CÓDIGO COMPLETO PARA: ${fileName}
═══════════════════════════════════════════════════════════════════════════════
`;
  }

  return `═══════════════════════════════════════════════════════════════════════════════
TAREA: CORREGIR CÓDIGO EXISTENTE
═══════════════════════════════════════════════════════════════════════════════

CÓDIGO ACTUAL DE ${fileName}:
─────────────────────────────────────────────────────────
${originalCode}
─────────────────────────────────────────────────────────

PROBLEMAS DETECTADOS POR EL AUDITOR:
${issuesText}

${examples}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCCIONES:
═══════════════════════════════════════════════════════════════════════════════
1. Corrige TODOS los problemas listados arriba
2. Mantén la funcionalidad existente que funciona
3. Asegúrate de que el código esté COMPLETO (sin funciones truncadas)
4. Verifica que todos los imports estén presentes

REGLAS DE FORMATO:
- Tu respuesta debe comenzar DIRECTAMENTE con código
- La PRIMERA LÍNEA debe ser: from, import, class, def, # o """
- NO incluyas texto explicativo
- NO uses markdown ni \`\`\`
- Solo código limpio y funcional

═══════════════════════════════════════════════════════════════════════════════
GENERA EL CÓDIGO CORREGIDO:
═══════════════════════════════════════════════════════════════════════════════
`;
}

/**
 * Retorna ejemplos específicos para el prompt de corrección
 */
function getFixExamples(extension: string, fileName: string): string {
  if (extension === 'py') {
    if (fileName.includes('model')) {
      return `
EJEMPLO DE CÓDIGO CORRECTO PARA MODELOS:
─────────────────────────────────────────────────────────
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
─────────────────────────────────────────────────────────
NOTA: El método to_dict() debe estar COMPLETO con el return y el diccionario cerrado.
`;
    }

    if (fileName.includes('app')) {
      return `
EJEMPLO DE CÓDIGO CORRECTO PARA APP FLASK:
─────────────────────────────────────────────────────────
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
─────────────────────────────────────────────────────────
NOTA: Los decoradores @app.route NO deben tener espacios al inicio de la línea.
`;
    }
  }

  if (extension === 'txt' && fileName.includes('requirements')) {
    return `
EJEMPLO DE requirements.txt CORRECTO:
─────────────────────────────────────────────────────────
Flask==3.0.0
Flask-SQLAlchemy>=3.1.0
python-dotenv>=1.0.0
─────────────────────────────────────────────────────────
NOTA: Una dependencia por línea, sin texto adicional.
`;
  }

  return '';
}
