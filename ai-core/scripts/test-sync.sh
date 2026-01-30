#!/bin/bash
# ============================================================================
# TEST SCRIPT - Para probar el workflow de sync manualmente
# ============================================================================
# Este script simula lo que hace el workflow sync-to-projects.yml
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     TEST - Simular sync de ai-core a pivotforge                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Configuración
AI_CORE_DIR="$HOME/personalProjects/gama/ai-core"
TARGET_DIR="$HOME/personalProjects/gama/xlsx/pivotforge"
TARGET_PATH="ai-core"
TEST_BRANCH="test-sync-$(date +%s)"

echo "📂 Directorios:"
echo "  ai-core:   $AI_CORE_DIR"
echo "  pivotforge: $TARGET_DIR"
echo "  target path: $TARGET_PATH"
echo "  test branch: $TEST_BRANCH"
echo ""

# Crear rama de prueba
echo "1️⃣  Creando rama de prueba..."
cd "$TARGET_DIR" || exit 1
git checkout -b "$TEST_BRANCH" || exit 1
echo "  ✓ Rama $TEST_BRANCH creada"
echo ""

# Copiar archivos
echo "2️⃣  Copiando archivos de ai-core..."
cd "$TARGET_DIR"
rsync -av --delete \
  --exclude='.git' \
  --exclude='.github/' \
  "$AI_CORE_DIR/" "$TARGET_PATH/" > /tmp/rsync.log 2>&1
echo "  ✓ Archivos copiados"
echo ""

# Verificar archivos copiados
echo "3️⃣  Verificando copia..."
echo "  Archivos modificados:"
git status --short | head -10
echo ""

# Verificar que NO se copió .github/
echo "4️⃣ Verificando que .github/ NO existe..."
if [ -d "$TARGET_PATH/.github" ]; then
    echo "  ✗ ERROR: .github/ se copió (debería estar excluido)"
    echo ""
    echo "  Eliminando .github/..."
    rm -rf "$TARGET_PATH/.github/"
    echo "  ✓ .github/ eliminado"
else
    echo "  ✓ .github/ NO existe (correcto)"
fi
echo ""

# Preparar commit message
COMMIT_MSG="chore(ai-core): test sync from $AI_CORE_DIR

Automated test sync.

[skip ci]"

# Hacer commit
echo "5️⃣  Haciendo commit..."
git add -A || (echo "  ✗ Nada que commitear" && exit 1)

# Verificar el commit message
echo "  Commit message:"
echo "  $COMMIT_MSG"
echo ""

git commit -m "$COMMIT_MSG" || (echo "  ✗ Falló el commit" && exit 1)
echo "  ✓ Commit creado exitosamente"
echo ""

# Verificar el estado
echo "6️⃣  Estado actual:"
git status --short | head -5
echo ""

echo "✅ Test completado. El commit está listo."
echo ""
echo "Si todo está correcto, puedes:"
echo "  1. Revisar: git diff origin/main"
echo "  2. Si está bien, hacer push: git push origin $TEST_BRANCH"
echo "  3. Crear PR manualmente si lo deseas"
echo ""
echo "Para limpiar:"
echo "  git checkout main"
echo "  git branch -D $TEST_BRANCH"
