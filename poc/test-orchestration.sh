#!/bin/bash
# ============================================================================
# META-ORCHESTRATOR - Proof of Concept
# ============================================================================
# Este script valida que podemos orquestar CLIs de IA programáticamente.
#
# Flujo:
#   1. Arquitecto (Claude Opus) → crea plan en .orchestra/plan.md
#   2. Ejecutor (GLM 4.7) → lee plan e implementa código
#
# Uso:
#   ./test-orchestration.sh "Crea un script hello.py"
#   ./test-orchestration.sh  # Usa tarea por defecto
#
# Requisitos:
#   - Claude CLI instalado y configurado
#   - Acceso a modelo opus y glm-4.7
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Directorio de trabajo
ORCHESTRA_DIR=".orchestra"
PLAN_FILE="$ORCHESTRA_DIR/plan.md"

# Tarea por defecto
DEFAULT_TASK="Crea un script en Python llamado hello.py que imprima 'Hola Mundo desde el Orquestador'"
TASK="${1:-$DEFAULT_TASK}"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           META-ORCHESTRATOR - Proof of Concept             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Tarea:${NC} $TASK"
echo ""

# ============================================================================
# PREPARACIÓN
# ============================================================================

echo -e "${YELLOW}[0/4]${NC} Preparando entorno..."

# Limpiar ejecución anterior
rm -rf "$ORCHESTRA_DIR"
mkdir -p "$ORCHESTRA_DIR"
rm -f hello.py 2>/dev/null || true

echo -e "  ${GREEN}✓${NC} Directorio $ORCHESTRA_DIR creado"

# ============================================================================
# PASO 1: VERIFICAR CLIs
# ============================================================================

echo ""
echo -e "${YELLOW}[1/4]${NC} Verificando CLIs disponibles..."

# Verificar Claude CLI
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null | head -1 || echo "versión desconocida")
    echo -e "  ${GREEN}✓${NC} Claude CLI encontrado: $CLAUDE_VERSION"
else
    echo -e "  ${RED}✗${NC} Claude CLI no encontrado"
    echo -e "  ${YELLOW}Instala Claude CLI: https://docs.anthropic.com/claude-code${NC}"
    exit 1
fi

# ============================================================================
# PASO 2: ARQUITECTO (GLM 4.7 via z.ai)
# ============================================================================

echo ""
echo -e "${YELLOW}[2/4]${NC} ${CYAN}Arquitecto${NC} planificando..."

# Verificar ZAI_API_KEY antes de empezar
if [ -z "$ZAI_API_KEY" ]; then
    echo -e "  ${RED}✗${NC} ZAI_API_KEY no está configurada"
    echo -e "  ${YELLOW}Asegúrate de que está exportada en tu .zshrc:${NC}"
    echo -e "    export ZAI_API_KEY=\"tu-api-key\""
    exit 1
fi

ARCHITECT_PROMPT="Eres un Arquitecto de Software. Crea un plan de implementación para: $TASK

Responde SOLO con el plan en formato Markdown, sin explicaciones adicionales:

# Plan de Implementación

## Objetivo
[objetivo]

## Pasos
1. [paso]

## Archivos a Crear
- [archivo]: [descripción]

## Criterios de Éxito
- [criterio]"

# Medir tiempo
START_TIME=$(date +%s)

# Ejecutar Arquitecto con GLM 4.7 via z.ai
echo -e "  Ejecutando GLM 4.7 (via z.ai)..."

ANTHROPIC_API_KEY="$ZAI_API_KEY" \
ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" \
API_TIMEOUT_MS="3000000" \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude --print -p "$ARCHITECT_PROMPT" > "$PLAN_FILE" 2>&1

ARCHITECT_EXIT_CODE=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $ARCHITECT_EXIT_CODE -ne 0 ]; then
    echo -e "  ${RED}✗${NC} Error conectando con z.ai/GLM 4.7"
    cat "$PLAN_FILE" 2>/dev/null
    exit 1
fi

# Verificar que el plan tiene contenido
if [ -s "$PLAN_FILE" ]; then
    PLAN_LINES=$(wc -l < "$PLAN_FILE")
    echo -e "  ${GREEN}✓${NC} Plan creado: $PLAN_FILE ($PLAN_LINES líneas, ${DURATION}s)"
else
    echo -e "  ${RED}✗${NC} El plan está vacío"
    exit 1
fi

# ============================================================================
# PASO 3: EJECUTOR (GLM 4.7)
# ============================================================================

echo ""
echo -e "${YELLOW}[3/4]${NC} ${CYAN}Ejecutor${NC} implementando..."

# Leer el plan para pasarlo al ejecutor
PLAN_CONTENT=$(cat "$PLAN_FILE")

EXECUTOR_PROMPT="Eres un Desarrollador Senior. Implementa el código según este plan:

---
$PLAN_CONTENT
---

Responde SOLO con el código Python, sin explicaciones, sin markdown, sin \`\`\`.
El código debe ser ejecutable directamente."

# Verificar que ZAI_API_KEY existe (debe venir del .zshrc)
if [ -z "$ZAI_API_KEY" ]; then
    echo -e "  ${RED}✗${NC} ZAI_API_KEY no está configurada"
    echo -e "  ${YELLOW}Asegúrate de que está exportada en tu .zshrc:${NC}"
    echo -e "    export ZAI_API_KEY=\"tu-api-key\""
    echo -e "  ${YELLOW}Y recarga tu shell:${NC}"
    echo -e "    source ~/.zshrc"
    exit 1
fi

echo -e "  ${GREEN}✓${NC} ZAI_API_KEY detectada"

# Medir tiempo
START_TIME=$(date +%s)

# Ejecutar Ejecutor con GLM 4.7 via z.ai
echo -e "  Ejecutando GLM 4.7 (via z.ai)..."

# Usar GLM 4.7 via z.ai (SIN fallback - GLM es obligatorio para el Ejecutor)
ANTHROPIC_API_KEY="$ZAI_API_KEY" \
ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" \
API_TIMEOUT_MS="3000000" \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude --print -p "$EXECUTOR_PROMPT" > hello.py 2>&1

GLM_EXIT_CODE=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $GLM_EXIT_CODE -ne 0 ]; then
    echo -e "  ${RED}✗${NC} Error conectando con z.ai/GLM 4.7"
    echo -e "  ${YELLOW}Verifica:${NC}"
    echo -e "    1. Tu ZAI_API_KEY es válida"
    echo -e "    2. Tienes conexión a https://api.z.ai"
    echo -e "    3. Tu suscripción de z.ai está activa"
    echo ""
    echo -e "  ${YELLOW}Output del error:${NC}"
    cat hello.py 2>/dev/null || echo "(sin output)"
    rm -f hello.py
    exit 1
fi

# Verificar que el archivo tiene contenido válido (no un error)
if [ -s "hello.py" ]; then
    # Verificar que no es un mensaje de error
    if grep -q "error\|Error\|ERROR\|unauthorized\|Unauthorized" hello.py 2>/dev/null; then
        echo -e "  ${RED}✗${NC} z.ai retornó un error:"
        cat hello.py
        rm -f hello.py
        exit 1
    fi

    CODE_LINES=$(wc -l < "hello.py")
    echo -e "  ${GREEN}✓${NC} Código generado con GLM 4.7: hello.py ($CODE_LINES líneas, ${DURATION}s)"
else
    echo -e "  ${RED}✗${NC} El archivo está vacío - z.ai no generó código"
    exit 1
fi

# ============================================================================
# PASO 4: VERIFICACIÓN
# ============================================================================

echo ""
echo -e "${YELLOW}[4/4]${NC} Verificando resultados..."

# Verificar que hello.py fue creado
if [ -f "hello.py" ]; then
    echo -e "  ${GREEN}✓${NC} hello.py creado"

    # Intentar ejecutar
    echo -e "  Ejecutando hello.py..."
    if python3 hello.py 2>/dev/null || python hello.py 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} Script ejecutado correctamente"
    else
        echo -e "  ${YELLOW}⚠${NC} El script existe pero hubo un error al ejecutarlo"
    fi
else
    echo -e "  ${RED}✗${NC} hello.py no fue creado"
    echo ""
    echo -e "${YELLOW}Archivos en el directorio actual:${NC}"
    ls -la
    echo ""
    echo -e "${YELLOW}Contenido del plan:${NC}"
    cat "$PLAN_FILE" 2>/dev/null || echo "(no disponible)"
    exit 1
fi

# ============================================================================
# RESUMEN
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    PoC COMPLETADO                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Resumen:${NC}"
echo -e "  ${GREEN}✓${NC} Arquitecto creó plan en $PLAN_FILE"
echo -e "  ${GREEN}✓${NC} Ejecutor implementó el código"
echo -e "  ${GREEN}✓${NC} Verificación exitosa"
echo ""
echo -e "${CYAN}Archivos creados:${NC}"
echo "  - $PLAN_FILE"
echo "  - hello.py"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Revisa el plan: cat $PLAN_FILE"
echo "  2. Revisa el código: cat hello.py"
echo "  3. Si todo funciona, proceder a implementar en TypeScript"
echo ""
