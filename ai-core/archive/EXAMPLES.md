# AI-Core Examples

> Casos de uso reales y ejemplos prácticos

## 🎯 Contenido

1. [Agregar Autenticación](#ejemplo-1-autenticación)
2. [Crear API REST](#ejemplo-2-api-rest)
3. [Implementar Tests](#ejemplo-3-tests)
4. [Configurar CI/CD](#ejemplo-4-cicd)
5. [Optimizar Base de Datos](#ejemplo-5-database)

---

## Ejemplo 1: Autenticación

**Prompt:** "Agregar autenticación con OAuth2 y Google login"

**Lo que hace Claude:**
1. Lee skill `security`
2. Diseña flujo OAuth2
3. Crea endpoints backend
4. Implementa login UI
5. Agrega tests

**Resultado:**
- ✅ OAuth2 funcionando
- ✅ Best practices de seguridad
- ✅ Tests completos
- ✅ Documentación actualizada

---

## Ejemplo 2: API REST

**Prompt:** "Crear API REST para gestión de usuarios"

**Lo que hace Claude:**
1. Usa skill `api-design`
2. Diseña endpoints RESTful
3. Implementa validación
4. Agrega documentación OpenAPI

**Resultado:**
```yaml
Endpoints creados:
- GET    /users
- GET    /users/:id
- POST   /users
- PATCH  /users/:id
- DELETE /users/:id
```

---

## Ejemplo 3: Tests

**Prompt:** "Crear tests para el endpoint de login"

**Lo que hace Claude:**
1. Aplica skill `testing`
2. Sigue Test Pyramid
3. Crea tests unitarios
4. Agrega tests de integración

**Resultado:**
- ✅ 95%+ coverage
- ✅ Tests rápidos y confiables
- ✅ CI/CD integrado

---

## Ejemplo 4: CI/CD

**Prompt:** "Configurar pipeline de CI/CD con GitHub Actions"

**Lo que hace Claude:**
1. Usa skill `ci-cd`
2. Crea workflows
3. Configura tests automáticos
4. Implementa deploy

**Resultado:**
- ✅ Linting automático
- ✅ Tests en cada PR
- ✅ Deploy automático a producción
- ✅ Notificaciones de Slack

---

## Ejemplo 5: Database

**Prompt:** "Optimizar consultas lentas"

**Lo que hace Claude:**
1. Usa skill `database`
2. Analiza queries
3. Agrega índices
4. Optimiza joins

**Resultado:**
- ✅ Queries 100x más rápidas
- ✅ Índices apropiados
- ✅ Sin N+1 problems

---

## 💡 Tips

1. **Sé específico**: Mejor "Crear API REST con autenticación" que solo "Crear API"
2. **Menciona el tech stack**: "Usando FastAPI y PostgreSQL"
3. **Pide detalles**: "Incluye manejo de errores y validación"

---

## 📚 Más Recursos

- `TUTORIAL.md` - Tutorial paso a paso
- `README.md` - Documentación principal
- `SKILLS/` - Skills universales
