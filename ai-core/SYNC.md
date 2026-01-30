# AI-Core Sync System

> **Sistema de sincronización automática** para mantener ai-core actualizado en todos tus proyectos.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI-CORE (Repo Central)                      │
│                                                                  │
│  SKILLS/          ← 30 skills universales                        │
│  AGENTS.md        ← Guía maestra                                 │
│  .github/                                                        │
│    ├── sync-targets.json    ← Lista de proyectos registrados    │
│    └── workflows/                                                │
│        ├── sync-to-projects.yml  ← Push sync a proyectos        │
│        └── promote-skill.yml     ← Recibir skills de proyectos  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Push a main
                              │ (automático)
                              ▼
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Proyecto A   │     │  Proyecto B   │     │  Proyecto C   │
│               │     │               │     │               │
│  ai-core/     │     │  ai-core/     │     │  ai-core/     │
│  └── SKILLS/  │     │  └── SKILLS/  │     │  └── SKILLS/  │
│               │     │               │     │               │
│  .github/     │     │  .github/     │     │  .github/     │
│  └── receive- │     │  └── receive- │     │  └── receive- │
│      updates  │     │      updates  │     │      updates  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                                           │
        │         Nuevo skill creado                │
        └──────────────────┬────────────────────────┘
                           │
                           │ promote-skill.yml
                           │ (manual)
                           ▼
                    AI-CORE (PR)
```

---

## Setup Inicial

### 1. Configurar el Repo Central (ai-core)

```bash
# 1. Crear repositorio en GitHub
gh repo create hectormr206/ai-core --public

# 2. Subir el contenido
cd /path/to/ai-core
git remote add origin https://github.com/hectormr206/ai-core.git
git push -u origin main

# 3. Crear el token de sincronización
# Ir a: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
# Crear token con permisos:
#   - Repository access: All repositories (o seleccionar específicos)
#   - Permissions:
#     - Contents: Read and write
#     - Pull requests: Read and write
#     - Workflows: Read and write

# 4. Agregar el token como secret
# Ir a: hectormr206/ai-core → Settings → Secrets → Actions
# Crear secret: SYNC_TOKEN = <tu-token>
```

### 2. Instalar en un Proyecto Nuevo

**Opción A: Script de instalación (recomendado)**
```bash
cd /path/to/tu-proyecto

# Descargar e instalar
curl -fsSL https://raw.githubusercontent.com/hectormr206/ai-core/main/scripts/install-in-project.sh | \
  AI_CORE_REPO=hectormr206/ai-core bash
```

**Opción B: Manual**
```bash
cd /path/to/tu-proyecto

# Clonar ai-core
git clone --depth 1 https://github.com/hectormr206/ai-core.git ai-core
rm -rf ai-core/.git

# Copiar workflow de actualizaciones
mkdir -p .github/workflows
cp ai-core/.github/workflows/receive-updates.yml .github/workflows/receive-ai-core-updates.yml

# Editar el workflow para apuntar a tu repo
sed -i 's|hectormr206/ai-core|hectormr206/ai-core|g' .github/workflows/receive-ai-core-updates.yml

# Commit
git add ai-core .github/workflows/receive-ai-core-updates.yml
git commit -m "chore: add ai-core toolkit"
git push
```

### 3. Registrar Proyecto para Sync Automático

```bash
cd /path/to/ai-core

# Registrar proyecto
./scripts/register-project.sh hectormr206/tu-proyecto ai-core main

# Commit y push
git add .github/sync-targets.json
git commit -m "chore: register tu-proyecto for sync"
git push
```

---

## Flujos de Trabajo

### Flujo 1: Actualizar AI-Core → Proyectos (Automático)

```
1. Haces cambios en ai-core (nuevo skill, mejora, etc.)
2. Push a main
3. GitHub Action "sync-to-projects.yml" se ejecuta
4. Para cada proyecto registrado:
   - Clona el proyecto
   - Actualiza la carpeta ai-core
   - Crea un PR automático
5. Recibes notificación del PR
6. Revisas y mergeas cuando estés listo
```

### Flujo 2: Promover Skill de Proyecto → AI-Core (Manual)

```
1. Creas un nuevo skill en tu proyecto (ej: SKILLS/mi-skill/)
2. Validas que funciona bien
3. Vas a Actions → "Promote Skill to Central" → Run workflow
4. Completas:
   - skill_name: mi-skill
   - skill_path: SKILLS/mi-skill
   - description: "Descripción del skill"
5. Se crea un PR en ai-core
6. Revisas y mergeas
7. El skill se sincroniza a todos los proyectos
```

### Flujo 3: Verificar Actualizaciones (Programado)

```
- Cada lunes a las 9am (configurable)
- El workflow "receive-ai-core-updates.yml" se ejecuta
- Compara versiones
- Si hay actualización, crea PR
```

---

## Configuración Avanzada

### Personalizar sync-targets.json

```json
[
  {
    "repo": "hectormr206/proyecto-frontend",
    "path": "ai-core",           // Carpeta destino
    "base_branch": "main",       // Branch para el PR
    "enabled": true              // Activar/desactivar
  },
  {
    "repo": "tu-org/proyecto-backend",
    "path": ".ai-core",          // Carpeta oculta
    "base_branch": "develop",    // PR va a develop
    "enabled": true
  }
]
```

### Personalizar receive-updates.yml

```yaml
env:
  # Cambiar estos valores en cada proyecto
  AI_CORE_REPO: 'hectormr206/ai-core'
  AI_CORE_REF: 'main'            # o 'v1.0.0' para versión específica
  AI_CORE_PATH: 'ai-core'        # o '.ai-core', 'tools/ai-core', etc.

on:
  schedule:
    - cron: '0 9 * * 1'          # Cada lunes 9am
    # - cron: '0 0 * * *'        # Diario a medianoche
    # - cron: '0 */6 * * *'      # Cada 6 horas
```

### Excluir Archivos del Sync

En `sync-to-projects.yml`:
```yaml
- name: Sync ai-core folder
  run: |
    rsync -av --delete \
      --exclude='.git' \
      --exclude='.github/workflows/sync-to-projects.yml' \
      --exclude='.github/sync-targets.json' \
      --exclude='mi-archivo-local.md' \  # Agregar exclusiones
      ai-core-source/ "target-project/$TARGET_PATH/"
```

---

## Comandos Útiles

```bash
# Ver proyectos registrados
cat .github/sync-targets.json | jq

# Registrar nuevo proyecto
./scripts/register-project.sh owner/repo

# Instalar en proyecto (desde el proyecto)
curl -fsSL https://raw.githubusercontent.com/hectormr206/ai-core/main/scripts/install-in-project.sh | bash

# Trigger sync manual (desde ai-core)
gh workflow run sync-to-projects.yml

# Trigger sync a un proyecto específico
gh workflow run sync-to-projects.yml -f target_repo=owner/repo

# Ver versión instalada (desde proyecto)
cat ai-core/.version

# Verificar actualizaciones manualmente (desde proyecto)
gh workflow run receive-ai-core-updates.yml
```

---

## Troubleshooting

### "Resource not accessible by integration"

El token SYNC_TOKEN no tiene permisos suficientes.

**Solución:**
1. Crear un nuevo Fine-grained token con permisos correctos
2. O usar un Classic token con scope `repo` y `workflow`

### "Pull request already exists"

Ya hay un PR de sync abierto.

**Solución:**
1. Mergear o cerrar el PR existente
2. Ejecutar sync nuevamente

### "Permission denied" en scripts

```bash
chmod +x scripts/*.sh
```

### Sync no detecta cambios

El workflow solo sincroniza si hay cambios en:
- `SKILLS/**`
- `AGENTS.md`
- `AI_MANIFEST.md`
- `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`

Para forzar sync:
```bash
gh workflow run sync-to-projects.yml -f force=true
```

---

## Seguridad

### Tokens Requeridos

| Secret | Ubicación | Permisos |
|--------|-----------|----------|
| `SYNC_TOKEN` | ai-core repo | `repo`, `workflow` |

### Mejores Prácticas

1. **Usa Fine-grained tokens** cuando sea posible
2. **Limita el acceso** solo a los repos necesarios
3. **Rota tokens** cada 90 días
4. **Revisa PRs** antes de mergear (no auto-merge)

---

## Roadmap

- [ ] Soporte para auto-merge de PRs (con aprobación)
- [ ] Dashboard de estado de sincronización
- [ ] Notificaciones por Slack/Discord
- [ ] Versionado semántico (v1.0.0, v1.1.0)
- [ ] Changelog automático

---

**EOF**
