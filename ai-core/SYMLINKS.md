# Symlinks de Desarrollo en ai-core

## ¿Qué son los Symlinks?

Los **symlinks** (enlaces simbólicos) son punteros que hacen que una carpeta parezca estar en dos lugares al mismo tiempo.

## Estructura en ai-core

ai-core tiene **DOS niveles de symlinks** para facilitar el desarrollo:

### 1. Carpetas Ocultas (Automáticas)

Las carpetas que empiezan con `.` son ocultas. Los LLMs las leen automáticamente:

```
.claude/        ← Claude Code busca aquí automáticamente
.gemini/        ← Gemini CLI busca aquí automáticamente
```

### 2. Carpetas Visibles (Para Usuarios)

Además, hay carpetas **visibles** para que puedas explorar fácilmente:

```
claude/         ← Puedes ver y abrir en tu editor
gemini/         ← Puedes ver y abrir en tu editor
```

## Mapa Completo de Symlinks

```
.claude/skills  →  SKILLS/          (oculto, automático)
.claude/agents  →  SUBAGENTS/       (oculto, automático)
.gemini/skills  →  SKILLS/          (oculto, automático)

claude/skills   →  .claude/skills/  (VISIBLE, para ti)
claude/agents   →  .claude/agents/  (VISIBLE, para ti)
gemini/skills   →  .gemini/skills/  (VISIBLE, para ti)
```

## ¿Cómo verlos en tu editor?

### En VS Code / Cursor:

1. Abre el explorador de archivos
2. **Opción A - Carpetas visibles (RECOMENDADO):**
   - Abre `claude/` o `gemini/`
   - Verás: `skills/` y `agents/`
   - Contenido: Todos los 35 skills y 7 subagentes

3. **Opción B - Carpetas ocultas:**
   - En VS Code: Ctrl+Shift+. (Windows/Linux) o Cmd+Shift+. (Mac)
   - Esto muestra archivos ocultos
   - Navega a `.claude/` o `.gemini/`

### En la Terminal:

```bash
# Ver todas las carpetas (incluyendo ocultas)
ls -la

# Ver solo symlinks
ls -la | grep "^l"

# Output esperado:
# lrwxrwxrwx 1 user user   7 Jan 23 11:56 claude -> .claude
# lrwxrwxrwx 1 user user   7 Jan 23 11:56 gemini -> .gemini

# Ver contenido de carpetas visibles
ls -la claude/

# Output esperado:
# lrwxrwxrwx agents -> .claude/agents
# lrwxrwxrwx skills -> .claude/skills
```

La **"l"** al inicio de los permisos (`lrwxrwxrwx`) indica que es un symlink.

## Verificación

Ejecuta el script de verificación:

```bash
./verify-symlinks.sh
```

Verás algo como:

```
╔════════════════════════════════════════════════════════════════╗
║        VERIFICACIÓN DE SYMLINKS EN AI-CORE                     ║
╚════════════════════════════════════════════════════════════════╝

Symlinks para Claude Code:
  ✓ .claude/skills → /home/.../ai-core/SKILLS
     Contiene: 35 skills
  ✓ .claude/agents → /home/.../ai-core/SUBAGENTS
     Contiene: 7 subagentes

Symlinks para Gemini:
  ✓ .gemini/skills → /home/.../ai-core/SKILLS
     Contiene: 35 skills
```

## Acceso desde Claude Code

Claude Code puede leer los skills y subagentes a través de estos symlinks:

**Desde carpetas ocultas (automático):**
- ✅ `.claude/skills/security/SKILL.md` → Lee `SKILLS/security/SKILL.md`
- ✅ `.claude/agents/AGENTS.md` → Lee `SUBAGENTS/AGENTS.md`
- ✅ `.gemini/skills/testing/SKILL.md` → Lee `SKILLS/testing/SKILL.md`

**Desde carpetas visibles (si las necesitas):**
- ✅ `claude/skills/security/SKILL.md` → Lee lo mismo que `.claude/skills/...`
- ✅ `gemini/skills/frontend/SKILL.md` → Lee lo mismo que `.gemini/skills/...`

## Ejemplo Práctico

```bash
# Ver skills desde carpeta visible
ls claude/skills/
# Output: accessibility/, ai-ml/, api-design/, ... (35 skills)

# Leer un skill específico
cat claude/skills/security/SKILL.md
# Output: Contenido completo del skill de seguridad

# Ver subagentes
ls claude/agents/
# Output: AGENTS.md, PLATFORMS.md, README.md, ROADMAP.md, templates/
```

## Importante

- ✅ **Los symlinks están en `.gitignore`** - No se commitán al repositorio
- ✅ **Funcionan en Linux/macOS/WSL** - En Windows se usan copias automáticas
- ✅ **Son transparentes para las aplicaciones** - Se leen como carpetas normales
- ✅ **Carpetas visibles facilitan exploración** - No necesitas recordar comandos para ver archivos ocultos

## ¿Por qué dos niveles?

1. **Carpetas ocultas (`.`)**: Son el estándar que los LLMs buscan automáticamente. No interfieren con tu exploración normal del proyecto.

2. **Carpetas visibles**: Para que puedas ver y explorar los skills fácilmente sin recordar comandos especiales o configurar tu editor.

¡Lo mejor de ambos mundos! 🎯
