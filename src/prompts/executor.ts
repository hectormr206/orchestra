/**
 * Prompt template para el Ejecutor
 */

export interface FileToCreate {
  path: string;
  description: string;
}

export function buildExecutorPrompt(
  planContent: string,
  targetFile: string,
  iteration: number = 1,
  customContext?: string,
): string {
  const iterationNote =
    iteration > 1
      ? `\n\nNOTA: Esta es la iteración ${iteration}. Considera el feedback previo.\n`
      : "";

  const customSection = customContext
    ? `\nCONTEXTO ADICIONAL DEL PROYECTO:\n${customContext}\n`
    : "";

  // Determinar el tipo de archivo para ejemplos específicos
  const extension = targetFile.split(".").pop()?.toLowerCase() || "";
  const examples = getExamplesForFileType(extension, targetFile);

  return `Eres un Desarrollador Senior experto. Tu tarea es generar código de producción.
${customSection}

===============================================================================
PLAN DEL PROYECTO
===============================================================================
${planContent}
${iterationNote}
===============================================================================
TU TAREA: Generar el archivo "${targetFile}"
===============================================================================

REGLAS CRITICAS DE FORMATO:
1. Tu respuesta debe comenzar DIRECTAMENTE con codigo valido para el archivo
2. La PRIMERA LINEA debe ser codigo ejecutable (import, from, class, def, function, const, #, //, etc.)
3. NO incluyas explicaciones, comentarios introductorios, ni texto narrativo
4. NO uses markdown ni bloques de codigo (\`\`\`)
5. El codigo debe estar COMPLETO - no dejes funciones sin implementar
6. Incluye TODOS los imports necesarios al inicio
7. Detecta automaticamente el lenguaje por la extension del archivo y genera codigo valido para ese lenguaje

${examples}

===============================================================================
GENERA EL CÓDIGO PARA: ${targetFile}
===============================================================================
`;
}

/**
 * Retorna ejemplos específicos según el tipo de archivo
 */
function getExamplesForFileType(extension: string, fileName: string): string {
  switch (extension) {
    case "py":
      return getPythonExamples(fileName);
    case "js":
    case "ts":
      return getJavaScriptExamples(fileName);
    case "txt":
      if (fileName.toLowerCase().includes("requirements")) {
        return getRequirementsExamples();
      }
      return "";
    case "json":
      return getJsonExamples(fileName);
    case "md":
    case "markdown":
      return getMarkdownExamples(fileName);
    default:
      return "";
  }
}

function getPythonExamples(fileName: string): string {
  if (fileName.includes("model")) {
    return `
EJEMPLO DE RESPUESTA CORRECTA PARA UN ARCHIVO DE MODELOS:
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

EJEMPLO DE RESPUESTA INCORRECTA (NO HAGAS ESTO):
---------------------------------------------------------
Aquí está el código para models.py:

\`\`\`python
from flask_sqlalchemy import SQLAlchemy
...
\`\`\`

Este código implementa el modelo User con los campos requeridos.
---------------------------------------------------------
`;
  }

  if (fileName.includes("app")) {
    return `
EJEMPLO DE RESPUESTA CORRECTA PARA UNA APLICACIÓN FLASK:
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

    if not data or not data.get('username') or not data.get('email'):
        return jsonify({'error': 'username and email are required'}), 400

    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201


@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']

    db.session.commit()
    return jsonify(user.to_dict()), 200


@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200


if __name__ == '__main__':
    app.run(debug=True)
---------------------------------------------------------

ERRORES COMUNES A EVITAR:
- NO añadas espacios antes de @app.route
- NO dejes métodos incompletos como "def to_dict(self): return {"
- NO incluyas texto como "Aquí está el código..."
- NO uses \`\`\`python al inicio
---------------------------------------------------------
`;
  }

  return `
EJEMPLO DE RESPUESTA CORRECTA PARA PYTHON:
---------------------------------------------------------
#!/usr/bin/env python3
"""
Módulo de ejemplo.
"""

import os
from typing import List, Optional


def main():
    print("Hello, World!")


if __name__ == '__main__':
    main()
---------------------------------------------------------

TU RESPUESTA DEBE COMENZAR CON: from, import, #, """, class, def, o una variable.
NO incluyas texto explicativo antes del código.
`;
}

function getRequirementsExamples(): string {
  return `
EJEMPLO DE RESPUESTA CORRECTA PARA requirements.txt:
---------------------------------------------------------
Flask==3.0.0
Flask-SQLAlchemy>=3.1.0
python-dotenv>=1.0.0
gunicorn>=21.0.0
---------------------------------------------------------

IMPORTANTE:
- Una dependencia por línea
- Sin comentarios ni explicaciones
- Incluye TODAS las dependencias del plan
`;
}

function getJavaScriptExamples(fileName: string): string {
  return `
EJEMPLO DE RESPUESTA CORRECTA PARA JAVASCRIPT/TYPESCRIPT:
---------------------------------------------------------
import express from 'express';
import { Router } from 'express';

const app = express();
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

export default app;
---------------------------------------------------------

TU RESPUESTA DEBE COMENZAR CON: import, export, const, let, var, function, class, o //
`;
}

function getJsonExamples(fileName: string): string {
  if (fileName.includes("package")) {
    return `
EJEMPLO DE RESPUESTA CORRECTA PARA package.json:
---------------------------------------------------------
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
---------------------------------------------------------

IMPORTANTE: JSON válido, sin comentarios, sin trailing commas.
`;
  }
  return "";
}

/**
 * Retorna ejemplos específicos para archivos Markdown
 */
function getMarkdownExamples(fileName: string): string {
  const lowerName = fileName.toLowerCase();

  // Ejemplos específicos para ROADMAP
  if (lowerName.includes("roadmap")) {
    return `
ADVERTENCIA CRITICA PARA ARCHIVOS MARKDOWN
---------------------------------------------------------
NO generes una META-DESCRIPCIÓN del archivo.
GENERA el CONTENIDO REAL y COMPLETO.
---------------------------------------------------------

INCORRECTO (NO HAGAS ESTO):
---------------------------------------------------------
# ROADMAP

Este documento debería contener la visión del proyecto,
las fases de desarrollo planificadas, y los objetivos
a largo plazo...
---------------------------------------------------------

CORRECTO (HAZ ESTO):
---------------------------------------------------------
# ROADMAP

## Vision

Orchestra será la herramienta de referencia para orquestación
de agentes IA en desarrollo de software.

## Fase 1: Consolidacion (Q1 2025)
- [ ] Mejorar estabilidad del TUI
- [ ] Optimizar Recovery Mode
- [ ] Añadir más tests unitarios

## Fase 2: Expansion (Q2 2025)
- [ ] Integrar Llama 3
- [ ] Añadir sistema de plugins
- [ ] Soporte para proyectos monorepo

## Fase 3: Inteligencia (Q3 2025)
- [ ] Auto-mejora de prompts
- [ ] Aprendizaje de sesiones previas
- [ ] Análisis de código estático
---------------------------------------------------------

REGLAS PARA ROADMAP:
1. Tu respuesta debe comenzar con # (encabezado Markdown)
2. Incluye secciones REALES con CONTENIDO REAL
3. Usa listas con checkboxes [ ] para tareas
4. NO describas lo que "debería contener" - ESCRÍBELO
5. Sé específico con fechas, versiones y features
`;
  }

  // Ejemplos para README
  if (lowerName.includes("readme")) {
    return `
ADVERTENCIA CRITICA PARA ARCHIVOS MARKDOWN
---------------------------------------------------------
NO generes una META-DESCRIPCIÓN. GENERA el CONTENIDO REAL.
---------------------------------------------------------

CORRECTO PARA README.md:
---------------------------------------------------------
# Nombre del Proyecto

Descripción breve pero completa del proyecto.

## Instalacion

\`\`\`bash
npm install
npm run build
\`\`\`

## Uso

\`\`\`bash
npx my-command start "mi tarea"
\`\`\`

## Configuracion

Crea un archivo \`.env\` con las siguientes variables:

\`\`\`
API_KEY=tu_api_key
DEBUG=true
\`\`\`

## Licencia

MIT
---------------------------------------------------------

REGLAS PARA README:
1. Comienza con # y el nombre del proyecto
2. Incluye secciones de instalación, uso y configuración REALES
3. Usa bloques de código con ejemplos reales
4. NO digas "esta sección debería contener..." - ESCRÍBELO
`;
  }

  // Ejemplos genéricos para otros archivos .md
  return `
ADVERTENCIA CRITICA PARA ARCHIVOS MARKDOWN
---------------------------------------------------------
NO generes una META-DESCRIPCIÓN del archivo.
GENERA el CONTENIDO REAL y COMPLETO.
---------------------------------------------------------

INCORRECTO: "Este archivo debería contener..."
INCORRECTO: "Aquí se describirá..."
INCORRECTO: "El contenido incluirá..."

CORRECTO: Escribe el contenido REAL directamente
CORRECTO: Comienza con # seguido del título del documento
CORRECTO: Incluye secciones completas con información real

REGLAS PARA MARKDOWN:
1. Tu respuesta debe comenzar con # (encabezado)
2. Escribe contenido REAL, no descripciones del contenido
3. Usa formato Markdown apropiado (##, -, *, \`\`\`, etc.)
4. Sé específico y detallado
5. NO uses bloques de código \`\`\`markdown al inicio
`;
}

/**
 * Extrae archivos a crear del plan
 */
export function extractFilesFromPlan(planContent: string): FileToCreate[] {
  const files: FileToCreate[] = [];

  // Buscar sección "Archivos a Crear"
  const match = planContent.match(
    /## Archivos a Crear[\/Modificar]*\n([\s\S]*?)(?=\n##|$)/i,
  );

  if (match) {
    const section = match[1];

    // Patrones para diferentes formatos:
    // - `archivo.py`: descripción
    // - **`archivo.py`**: descripción
    // - archivo.py: descripción
    // - `/ruta/archivo.py`: descripción
    const patterns = [
      /[-*]\s+\*\*[`]?([^`*:\n]+)[`]?\*\*:\s*(.+)/g, // **`file`**: desc
      /[-*]\s+[`]([^`:\n]+)[`]:\s*(.+)/g, // `file`: desc
      /[-*]\s+([^\s:]+\.\w+):\s*(.+)/g, // file.ext: desc
    ];

    for (const pattern of patterns) {
      let fileMatch;
      while ((fileMatch = pattern.exec(section)) !== null) {
        let filePath = fileMatch[1].trim();
        const description = fileMatch[2].trim();

        // Limpiar el path (remover backticks, asteriscos)
        filePath = filePath.replace(/[`*]/g, "");

        // Extraer solo el nombre del archivo (no rutas absolutas)
        const fileName = filePath.split("/").pop() || filePath;

        // Solo agregar si parece un archivo (tiene extensión)
        if (fileName.includes(".") && !files.some((f) => f.path === fileName)) {
          files.push({ path: fileName, description });
        }
      }
    }
  }

  // Si no encontramos archivos con el parsing, buscar patrón simple
  if (files.length === 0) {
    // Buscar cualquier mención de archivo.ext en el plan
    const simplePattern =
      /[`*]*([a-zA-Z_][a-zA-Z0-9_]*\.(py|js|ts|tsx|jsx|md|json|yaml|yml|sh|html|css))[`*]*/g;
    const matches = planContent.matchAll(simplePattern);
    const seen = new Set<string>();

    for (const m of matches) {
      const fileName = m[1];
      if (!seen.has(fileName)) {
        seen.add(fileName);
        files.push({ path: fileName, description: "Extraído del plan" });
      }
    }
  }

  return files;
}

export function buildContinuePrompt(solutionContent: string): string {
  return `El Consultor ha proporcionado una solución para tu problema:

SOLUCIÓN:
---
${solutionContent}
---

Continúa con la implementación usando esta solución. Completa los pasos restantes del plan.`;
}
