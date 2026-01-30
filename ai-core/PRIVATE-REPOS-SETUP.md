# Guía CORREGIDA: Configuración para Repos Privados

> **IMPORTANTE**: Usa esta guía en lugar de SYNC.md para repos privados
>
> **Correcciones**: URLs actualizadas, instrucciones mejoradas

## ⚠️ URLs CORRECTAS (¡Importante!)

| Token | URL CORRECTA ✅ | URL INCORRECTA ❌ |
|-------|----------------|------------------|
| Classic | `github.com/settings/tokens/new` | `github.com/settings/personal-access-tokens` |
| Fine-grained | `github.com/settings/personal-access-tokens` | (No usar) |

**USE SIEMPRE**: https://github.com/settings/tokens/new

---

## Resumen Rápido

```
┌─────────────────────────────────────────────────────────────┐
│  1. Crear SYNC_TOKEN (Classic)                              │
│     URL: github.com/settings/tokens/new                     │
│     → Configurar en: ai-core → SYNC_TOKEN                   │
├─────────────────────────────────────────────────────────────┤
│  2. Crear AI_CORE_PAT (Classic)                             │
│     URL: github.com/settings/tokens/new                     │
│     → Configurar en: TODOS los proyectos → AI_CORE_PAT      │
├─────────────────────────────────────────────────────────────┤
│  3. Registrar proyectos                                     │
│     Editar: ai-core/.projects-list                          │
│     Formato: owner/repo:branch (uno por línea)              │
├─────────────────────────────────────────────────────────────┤
│  4. Verificar                                               │
│     gh secret list --repo ai-core                           │
│     gh secret list --repo cada-proyecto                      │
└─────────────────────────────────────────────────────────────┘
```

---

## PASO 1: SYNC_TOKEN (permite a ai-core crear PRs en tus proyectos)

### 1.1 Crear el token

1. **Abre**: https://github.com/settings/tokens/new

2. Click: **"Generate new token"** → **"Generate new token (classic)"**

3. Configura:
   - **Note**: `ai-core-sync-token`
   - **Expiration**: `90 days` (o más)
   - **Scopes**: ✅ **repo** (Full control of private repositories)

   ⚠️ **Solo necesitas ESTE checkbox** - el scope `repo` incluye todo lo necesario

4. Click: **"Generate token"** (botón verde)

5. **COPIA EL TOKEN** ⚠️ (Solo se muestra una vez, comienza con `ghp_`)

### 1.2 Configurar en ai-core

```bash
gh secret set SYNC_TOKEN --repo hectormr206/ai-core
# Pega el token cuando te lo pida, presiona ENTER

# Verificar
gh secret list --repo hectormr206/ai-core
# Debería mostrar: SYNC_TOKEN
```

---

## PASO 2: AI_CORE_PAT (permite a tus proyectos leer ai-core)

### 2.1 Crear el token

1. **Abre**: https://github.com/settings/tokens/new

2. Click: **"Generate new token"** → **"Generate new token (classic)"**

3. Configura:
   - **Note**: `ai-core-read-token`
   - **Expiration**: `90 days` (o más)
   - **Scopes**: ✅ **repo** (Full control of private repositories)

   ⚠️ **Usamos el mismo scope `repo`** para simplificar

4. Click: **"Generate token"**

5. **COPIA EL TOKEN** ⚠️ (Solo se muestra una vez, comienza con `ghp_`)

### 2.2 Configurar en CADA proyecto

```bash
# Para pivotforge
gh secret set AI_CORE_PAT --repo hectormr206/pivotforge
# Pega el token cuando te lo pida

# Para otros proyectos que usen ai-core
gh secret set AI_CORE_PAT --repo hectormr206/otro-proyecto
# Pega el mismo token
```

---

## PASO 3: Registrar Proyectos

```bash
cd ~/personalProjects/gama/ai-core

# Editar .projects-list
cat > .projects-list << 'EOF'
# ai-core Projects Registry
# Format: owner/repo:branch
#
hectormr206/pivotforge:main
# Agrega más proyectos uno por línea
# hectormr206/otro-proyecto:main
EOF

# Verificar
cat .projects-list

# Commit
git add .projects-list
git commit -m "chore: register projects for ai-core sync"
git push origin main
```

---

## PASO 4: Instalar ai-core en los Proyectos

Para cada proyecto que aún no tenga ai-core:

```bash
cd /ruta/a/tu/proyecto

# Clonar
git clone git@github.com:hectormr206/ai-core.git ai-core
cd ai-core

# IMPORTANTE: Eliminar .git
rm -rf .git

# Ejecutar instalación
./run.sh
```

---

## PASO 5: Verificar

```bash
# Verificar secrets en ai-core
echo "=== Secrets en ai-core ==="
gh secret list --repo hectormr206/ai-core
echo ""

# Verificar secrets en cada proyecto
echo "=== Secrets en pivotforge ==="
gh secret list --repo hectormr206/pivotforge
echo ""

# Verificar proyectos registrados
echo "=== Proyectos registrados ==="
cat ~/personalProjects/gama/ai-core/.projects-list
echo ""

# Verificar workflows instalados
echo "=== Workflows instalados ==="
ls -1 ~/personalProjects/gama/xlsx/pivotforge/.github/workflows/*ai-core* 2>/dev/null || echo "pivotforge: No encontrado"
# Para otros proyectos, agrega líneas similares aquí
```

**Salida esperada:**
```
=== Secrets en ai-core ===
SYNC_TOKEN   Updated

=== Secrets en pivotforge ===
AI_CORE_PAT  Updated

=== Proyectos registrados ===
hectormr206/pivotforge:main
# (más proyectos si los agregas)

=== Workflows instalados ===
.../pivotforge/.github/workflows/receive-ai-core-updates.yml
# (más workflows si agregas más proyectos)
```

---

## PASO 6: Probar

```bash
cd ~/personalProjects/gama/ai-core

# Hacer un cambio trivial
echo "# Test sync $(date)" > TEST-SYNC.md

# Commit y push
git add TEST-SYNC.md
git commit -m "test: trigger sync"
git push origin main
```

**Luego verifica:**
1. https://github.com/hectormr206/ai-core/actions
   - Busca "Sync AI-Core to Projects"
   - Verifica que se ejecutó ✅

2. En tus proyectos:
   ```bash
   gh pr list --repo hectormr206/pivotforge
   # Agrega más proyectos si es necesario
   ```
   - Deberías ver un PR: **"🔄 AI-Core Sync Update"** (o auto-mergeado)

---

## Diferencia: Classic vs Fine-grained Tokens

| Aspecto | Classic Tokens ✅ | Fine-grained Tokens ❌ |
|---------|------------------|------------------------|
| **URL** | `github.com/settings/tokens/new` | `github.com/settings/personal-access-tokens` |
| **Permisos** | Scopes (checkboxes) | Permisos granulares por repo |
| **Simplicidad** | ✅ Simple (1 checkbox = todo) | ❌ Complejo |
| **Uso** | **Automatización** | Casos específicos |
| **Formato** | `ghp_...` | `github_pat_...` |

**SIEMPRE usa Classic tokens** para ai-core sync.

---

## Troubleshooting

### "No veo la opción de Generate new token (classic)"

**Solución**:
1. Ve a: https://github.com/settings/tokens/new
2. Click en **"Generate new token"** (botón arriba a la derecha)
3. Aparece un dropdown con 2 opciones:
   - **"Generate new token (classic)"** ← Selecciona ESTA
   - "Generate new fine-grained token"

### "gh secret set" me pide el token pero no puedo pegar

**Solución**:
- `gh secret set` debería permitir pegar
- Si no funciona, usa GitHub web:
  1. Ve a: https://github.com/hectormr206/ai-core/settings/secrets/actions
  2. Click "New repository secret"
  3. Name: `SYNC_TOKEN`
  4. Value: <pegar token>
  5. Click "Add secret"

### "Resource not accessible by integration"

**Causa**: Token no tiene permisos suficientes

**Solución**:
1. Verificar que el token es **Classic** (comienza con `ghp_`)
2. Verificar que tiene scope **repo** checkeado
3. Regenerar token si es necesario

### "Repository or Ref not found"

**Causa**: AI_CORE_PAT no puede acceder a ai-core

**Solución**:
1. Verificar que AI_CORE_PAT es **Classic**
2. Verificar que tiene scope **repo**
3. Verificar que ai-core es privado y el token tiene acceso

---

## Script Interactivo

Para facilitar la configuración, usa el script actualizado:

```bash
cd ~/personalProjects/gama/ai-core
./scripts/setup-private-sync.sh
```

**Correcciones en el script**:
- ✅ URL correcta: `tokens/new` (Classic tokens)
- ✅ Instrucciones detalladas paso a paso
- ✅ Explicación clara de AI_CORE_PAT
- ❌ Eliminada opción de gh CLI (no funciona para copiar tokens)

---

## Checklist

- [ ] SYNC_TOKEN creado (Classic, comienza con `ghp_`)
- [ ] SYNC_TOKEN configurado en ai-core
- [ ] AI_CORE_PAT creado (Classic, comienza con `ghp_`)
- [ ] AI_CORE_PAT configurado en pivotforge
- [ ] AI_CORE_PAT configurado en gama
- [ ] Proyectos registrados en .projects-list
- [ ] .projects-list commiteado y pusheado
- [ ] ai-core instalado en todos los proyectos
- [ ] Workflows receive-ai-core-updates.yml existen
- [ ] Prueba de sync exitosa
- [ ] PRs creados en proyectos

---

**EOF**
