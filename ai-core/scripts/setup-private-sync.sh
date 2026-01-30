#!/bin/bash
# ============================================================================
# AI-CORE - CONFIGURACIÓN PARA REPOS PRIVADOS
# ============================================================================
# Este script te guía en la configuración de tokens y secrets
# ============================================================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     AI-CORE - Configuración para Repositorios Privados      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# PASO 1: Verificar proyectos instalados
# ============================================================================

echo -e "${BLUE}PASO 1: Detectando proyectos con ai-core...${NC}"
echo ""

FOUND_PROJECTS=()

# Buscar proyectos con ai-core instalado
PROJECT_DIRS=(
    "$HOME/personalProjects/gama/xlsx/pivotforge"
    "$HOME/personalProjects/gama"
    # Agrega más rutas aquí si es necesario
)

for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir/ai-core" ] && [ -f "$dir/ai-core/.version" ]; then
        PROJECT_NAME=$(basename "$dir")
        FOUND_PROJECTS+=("$dir|$PROJECT_NAME")
        echo -e "  ✓ ${GREEN}$PROJECT_NAME${NC} ($dir)"
    fi
done

if [ ${#FOUND_PROJECTS[@]} -eq 0 ]; then
    echo -e "${RED}✗ No se encontraron proyectos con ai-core instalado${NC}"
    echo ""
    echo "Instala ai-core primero en tus proyectos:"
    echo "  cd /ruta/a/tu/proyecto"
    echo "  git clone git@github.com:hectormr206/ai-core.git ai-core"
    echo "  cd ai-core && rm -rf .git && ./run.sh"
    exit 1
fi

echo ""
echo -e "${CYAN}Se encontraron ${#FOUND_PROJECTS[@]} proyecto(s) con ai-core${NC}"
echo ""

# ============================================================================
# PASO 2: Crear SYNC_TOKEN para ai-core
# ============================================================================

echo -e "${BLUE}PASO 2: Configurar SYNC_TOKEN en ai-core${NC}"
echo ""
echo -e "${YELLOW}Este token permite a ai-core crear PRs en tus proyectos${NC}"
echo ""
echo "Necesitas crear un Personal Access Token con:"
echo "  - Repository access:Seleccionar todos tus proyectos"
echo "  - Permissions:"
echo "    • Contents: Read and Write"
echo "    • Pull Requests: Read and Write"
echo "    • Workflows: Read and Write"
echo ""
echo -e "${CYAN}Opciones:${NC}"
echo "  1. Crear token ahora en GitHub web"
echo "  2. Usar gh CLI para crear token"
echo "  3. Ya tengo un token"
echo ""
read -p "Elige opción (1/2/3): " -r TOKEN_OPTION
echo ""

if [ "$TOKEN_OPTION" = "2" ]; then
    echo -e "${CYAN}Abre este enlace en tu navegador (CLASSIC TOKEN - IMPORTANTE):${NC}"
    echo -e "${YELLOW}  https://github.com/settings/tokens/new${NC}"
    echo ""
    echo "Luego:"
    echo "  1. Click en 'Generate new token' → 'Generate new token (classic)'"
    echo "  2. Configura:"
    echo "     - Note: ai-core-sync-token"
    echo "     - Expiration: 90 days"
    echo "     - Scopes (check these boxes):"
    for project in "${FOUND_PROJECTS[@]}"; do
        echo "       ✅ repo (Full control of private repositories)"
    done
    echo "       Esto dará acceso a: ai-core, $(echo "${FOUND_PROJECTS[@]}" | wc -w) proyectos"
    echo ""
    echo "  3. Click 'Generate token'"
    echo -e "${RED}  4. COPIA EL TOKEN AHORA (solo se muestra una vez)${NC}"
    echo ""
    read -p "Presiona ENTER cuando hayas copiado el token..." -r
    echo ""

elif [ "$TOKEN_OPTION" = "1" ]; then
    echo -e "${YELLOW}⚠️  Opción NO disponible:${NC}"
    echo "  gh CLI genera tokens pero NO los muestra en pantalla"
    echo "  No puedes copiarlos, así que esta opción NO funciona"
    echo ""
    echo "Por favor usa la opción 2 (manual en navegador)"
    echo ""
    TOKEN_OPTION="2"
    read -p "Presiona ENTER para continuar con la opción manual..." -r
    echo ""

    echo -e "${CYAN}Abre este enlace en tu navegador (CLASSIC TOKEN):${NC}"
    echo -e "${YELLOW}  https://github.com/settings/tokens/new${NC}"
    echo ""
    echo "Sigue las instrucciones que aparecerán..."
    echo ""
    read -p "Presiona ENTER cuando hayas copiado el token..." -r
    echo ""
fi

echo -e "${YELLOW}Pega el SYNC_TOKEN aquí (o presiona ENTER si ya lo configuraste):${NC}"
read -s SYNC_TOKEN
echo ""

if [ -n "$SYNC_TOKEN" ]; then
    echo "Configurando SYNC_TOKEN en ai-core..."
    echo "$SYNC_TOKEN" | gh secret set SYNC_TOKEN --repo hectormr206/ai-core
    echo -e "${GREEN}✓ SYNC_TOKEN configurado${NC}"
else
    echo -e "${YELLOW}Omitiendo configuración de SYNC_TOKEN${NC}"
fi

echo ""

# ============================================================================
# PASO 3: Crear AI_CORE_PAT para cada proyecto
# ============================================================================

echo -e "${BLUE}PASO 3: Configurar AI_CORE_PAT (Token de Lectura)${NC}"
echo ""
echo -e "${YELLOW}Este token permite a TUS PROYECTOS leer ai-core (que es privado)${NC}"
echo ""
echo "Vamos a crear UN SOLO TOKEN y usarlo en todos tus proyectos:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}INSTRUCCIONES DETALLADAS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abre en tu navegador:"
echo -e "   ${YELLOW}https://github.com/settings/tokens/new${NC}"
echo ""
echo "2. Click en 'Generate new token' → 'Generate new token (classic)'"
echo ""
echo "3. Configura el token:"
echo "   - Note: ${CYAN}ai-core-read-token${NC}"
echo "   - Expiration: ${CYAN}90 days${NC} (o más)"
echo ""
echo "4. Scopes (check these boxes):"
echo "   ${GREEN}☑ repo${NC} ${YELLOW}(Full control of private repositories)${NC}"
echo ""
echo "   ${CYAN}IMPORTANTE: Solo necesitas ESTE checkbox${NC}"
echo "   Esto dará acceso de lectura a ai-core desde tus proyectos"
echo ""
echo "5. Click en 'Generate token' (botón verde)"
echo ""
echo -e "${RED}6. COPIA EL TOKEN AHORA${NC} - Solo se muestra UNA VEZ"
echo "   ${YELLOW}→ Es una cadena larga que comienza con ghp_...${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "¿Ya tienes creado y copiado el AI_CORE_PAT? (y/N): " -r HAS_PAT
echo ""

if [[ ! "$HAS_PAT" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Abre el navegador y crea el token siguiendo las instrucciones arriba${NC}"
    echo ""
    read -p "Presiona ENTER cuando hayas copiado el token..." -r
    echo ""
fi

echo -e "${CYAN}Pega aquí el AI_CORE_PAT (comienza con ghp_...):${NC}"
read -s AI_CORE_PAT
echo ""

if [ -z "$AI_CORE_PAT" ]; then
    echo -e "${RED}✗ No ingresaste el token${NC}"
    echo -e "${YELLOW}Omitiendo configuración de AI_CORE_PAT${NC}"
    echo -e "${YELLOW}Puedes configurarlo más tarde manualmente en cada proyecto${NC}"
else
    # Verificar que el token parece válido
    if [[ ! "$AI_CORE_PAT" =~ ^ghp_ ]]; then
        echo -e "${YELLOW}⚠️  Advertencia: El token no comienza con 'ghp_'${NC}"
        echo -e "${YELLOW}   Verifica que hayas copiado el token completo${NC}"
        read -p "¿Continuar de todas formas? (y/N): " -r CONTINUAR
        if [[ ! "$CONTINUAR" =~ ^[Yy]$ ]]; then
            AI_CORE_PAT=""
        fi
    fi
fi

if [ -n "$AI_CORE_PAT" ]; then
    for project in "${FOUND_PROJECTS[@]}"; do
        PROJECT_NAME=$(echo "$project" | cut -d'|' -f2)
        echo "Configurando AI_CORE_PAT en $PROJECT_NAME..."
        echo "$AI_CORE_PAT" | gh secret set AI_CORE_PAT --repo "hectormr206/$PROJECT_NAME"
        echo -e "${GREEN}✓ $PROJECT_NAME configurado${NC}"
    done
else
    echo -e "${YELLOW}Omitiendo configuración de AI_CORE_PAT${NC}"
fi

echo ""

# ============================================================================
# PASO 4: Registrar proyectos en ai-core
# ============================================================================

echo -e "${BLUE}PASO 4: Registrar proyectos en ai-core${NC}"
echo ""

for project in "${FOUND_PROJECTS[@]}"; do
    PROJECT_NAME=$(echo "$project" | cut -d'|' -f2)
    PROJECT_ENTRY="hectormr206/$PROJECT_NAME:main"

    # Verificar si ya está registrado
    if grep -q "^$PROJECT_ENTRY" .projects-list 2>/dev/null; then
        echo -e "  ${YELLOW}⚠️  $PROJECT_NAME ya está registrado${NC}"
    else
        echo "$PROJECT_ENTRY" >> .projects-list
        echo -e "  ${GREEN}✓ $PROJECT_NAME registrado${NC}"
    fi
done

echo ""
echo "Proyectos registrados:"
cat .projects-list | grep -v "^#" | grep -v "^$" | sed 's/^/  /' || echo "  (vacío)"
echo ""

# ============================================================================
# PASO 5: Verificar configuración
# ============================================================================

echo -e "${BLUE}PASO 5: Verificar configuración${NC}"
echo ""

echo "Secrets en ai-core:"
gh secret list --repo hectormr206/ai-core 2>&1 | sed 's/^/  /' || echo "  (No se puede acceder)"
echo ""

for project in "${FOUND_PROJECTS[@]}"; do
    PROJECT_NAME=$(echo "$project" | cut -d'|' -f2)
    echo "Secrets en $PROJECT_NAME:"
    gh secret list --repo "hectormr206/$PROJECT_NAME" 2>&1 | sed 's/^/  /' || echo "  (No se puede acceder)"
    echo ""
done

# ============================================================================
# PASO 6: Commit cambios
# ============================================================================

echo -e "${BLUE}PASO 6: Guardar cambios${NC}"
echo ""

if git diff --quiet .projects-list 2>/dev/null; then
    echo -e "${YELLOW}No hay cambios en .projects-list${NC}"
else
    echo "Se han modificado .projects-list"
    read -p "¿Hacer commit de los cambios? (y/N): " -r COMMIT
    echo ""

    if [[ "$COMMIT" =~ ^[Yy]$ ]]; then
        git add .projects-list
        git commit -m "chore: register projects for ai-core sync

- Registered projects:
$(cat .projects-list | grep -v "^#" | grep -v "^$" | sed 's/^/- /')

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
        echo -e "${GREEN}✓ Commit creado${NC}"
        echo ""
        read -p "¿Hacer push de los cambios? (y/N): " -r PUSH
        echo ""

        if [[ "$PUSH" =~ ^[Yy]$ ]]; then
            git push origin main
            echo -e "${GREEN}✓ Push completado${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ CONFIGURACIÓN COMPLETADA                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Próximos pasos:${NC}"
echo "  1. Haz un cambio en ai-core para probar el sync:"
echo "     echo '# Test' >> TEST.md"
echo "     git add TEST.md && git commit -m 'test: trigger sync'"
echo "     git push origin main"
echo ""
echo "  2. Verifica que se crean PRs en tus proyectos"
echo ""
echo "  3. Para trigger manual en un proyecto:"
echo "     gh workflow run receive-ai-core-updates.yml --repo hectormr206/pivotforge"
echo ""
