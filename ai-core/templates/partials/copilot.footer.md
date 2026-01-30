---

## Reglas de ai-core (Siempre Aplicar)

### Seguridad

- Validar inputs en servidor (nunca confiar en cliente)
- Usar queries parametrizadas (prevenir SQL injection)
- Hash passwords con bcrypt/argon2
- Nunca commitear secretos

### Calidad

- Usar TypeScript con tipos estrictos
- Escribir tests para funcionalidad crítica
- Usar conventional commits: `feat:`, `fix:`, `docs:`

### APIs

- Métodos HTTP correctos: GET, POST, PUT, DELETE
- Estructura de respuesta consistente
- Paginación para listas

Para reglas completas, ver: **`ai-core/SUBAGENTS/AGENTS.md`**
