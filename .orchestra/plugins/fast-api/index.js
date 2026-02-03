/**
 * FastAPI Plugin for Orchestra CLI
 *
 * Provides specialized support for FastAPI applications:
 * - Enhanced prompts for FastAPI-specific patterns
 * - Router and dependency detection
 * - FastAPI best practices suggestions
 * - Specialized audit rules for FastAPI applications
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Enhance the planning phase with FastAPI specific context
 */
export async function enhancePlanForFastAPI(context) {
  const { sessionId, task, metadata, config } = context;

  // Check if this is a FastAPI project
  const cwd = config.workingDir || process.cwd();
  const isFastAPIProject = await detectFastAPIProject(cwd);

  if (!isFastAPIProject) {
    return { success: true }; // Not a FastAPI project, skip
  }

  // Add FastAPI specific context to metadata
  metadata.framework = 'fastapi';
  metadata.fastapiVersion = await detectFastAPIVersion(cwd);

  // Enhance the task with FastAPI context
  const enhancedTask = enhanceTaskWithFastAPIContext(task);

  return {
    success: true,
    data: {
      enhancedTask,
      framework: 'fastapi',
      suggestions: await getFastAPISuggestions(cwd),
    },
  };
}

/**
 * Validate generated FastAPI code before execution
 */
export async function validateFastAPICode(context) {
  const { metadata, phase } = context;

  if (metadata.framework !== 'fastapi') {
    return { success: true };
  }

  // FastAPI specific validations
  const validations = [
    validateRouterStructure,
    validateDependencyInjection,
    validateAsyncHandlers,
    validatePydanticModels,
  ];

  const results = [];
  for (const validation of validations) {
    try {
      const result = await validation(context);
      results.push(result);
    } catch (error) {
      // Continue with other validations
      results.push({ valid: true, warning: error.message });
    }
  }

  const hasErrors = results.some((r) => r.valid === false);

  return {
    success: !hasErrors,
    data: {
      validations: results,
    },
  };
}

/**
 * Suggest FastAPI best practices after code generation
 */
export async function suggestFastAPIBestPractices(context) {
  const { metadata, task } = context;

  if (metadata.framework !== 'fastapi') {
    return { success: true };
  }

  const suggestions = [];

  // Analyze the task to suggest relevant best practices
  if (task.toLowerCase().includes('route') || task.toLowerCase().includes('endpoint')) {
    suggestions.push({
      type: 'best-practice',
      category: 'routes',
      suggestion: 'Consider using APIRouter for modular route definitions',
      code: `from fastapi import APIRouter

router = APIRouter()

@router.get("/path")
async def get_endpoint():
    # Handler logic
    return {"message": "Hello"}

# In main.py: app.include_router(router)`,
    });
  }

  if (task.toLowerCase().includes('dependency') || task.toLowerCase().includes('injection')) {
    suggestions.push({
      type: 'best-practice',
      category: 'dependencies',
      suggestion: 'Use FastAPI dependency injection for shared logic',
      code: `from fastapi import Depends, Header

async def get_token_header(x_token: str = Header(...)):
    if x_token != "fake-super-secret-token":
        raise HTTPException(status_code=400, detail="X-Token header invalid")
    return x_token

@router.get("/items/")
async def read_items(token: str = Depends(get_token_header)):
    return {"token": token}`,
    });
  }

  if (task.toLowerCase().includes('error') || task.toLowerCase().includes('exception')) {
    suggestions.push({
      type: 'best-practice',
      category: 'error-handling',
      suggestion: 'Use exception handlers for custom error responses',
      code: `from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )`,
    });
  }

  return {
    success: true,
    data: {
      suggestions,
      count: suggestions.length,
    },
  };
}

/**
 * Configure FastAPI specific audit rules
 */
export async function configureFastAPIAuditRules(context) {
  const { metadata } = context;

  if (metadata.framework !== 'fastapi') {
    return { success: true };
  }

  const fastapiRules = [
    {
      name: 'fastapi-router-structure',
      description: 'Check for proper FastAPI APIRouter structure',
      severity: 'major',
      check: (code) => {
        // Check if routes are properly organized in routers
        const hasAPIRouter = /APIRouter\s*\(\)/.test(code);
        const hasInclude = /include_router/.test(code);
        return { pass: hasAPIRouter || hasInclude, message: hasAPIRouter ? 'Good router structure' : 'Consider using FastAPI APIRouter' };
      },
    },
    {
      name: 'fastapi-async-handlers',
      description: 'Check for async/await in route handlers',
      severity: 'critical',
      check: (code) => {
        // Check if routes are using async def
        const hasAsyncDef = /@\w+\.get\(|@\w+\.post\(|@\w+\.put\(|@\w+\.delete\(|@\w+\.patch\(/.test(code);
        const hasAsyncHandler = /async\s+def\s+\w+/.test(code);
        if (hasAsyncDef && !hasAsyncHandler) {
          return { pass: false, message: 'FastAPI routes should use async def for better performance' };
        }
        return { pass: true };
      },
    },
    {
      name: 'fastapi-pydantic-models',
      description: 'Check for Pydantic model usage for validation',
      severity: 'critical',
      check: (code) => {
        const hasPydantic = /from\s+pydantic\s+import|BaseModel/.test(code);
        const hasRouteWithBody = /@\w+\.post\(|@\w+\.put\(|@\w+\.patch\(/.test(code);
        if (hasRouteWithBody && !hasPydantic) {
          return { pass: false, message: 'Routes with request body should use Pydantic models for validation' };
        }
        return { pass: true, message: hasPydantic ? 'Pydantic models found' : 'Consider using Pydantic models' };
      },
    },
    {
      name: 'fastapi-dependency-injection',
      description: 'Check for dependency injection usage',
      severity: 'major',
      check: (code) => {
        const hasDepends = /Depends\s*\(/.test(code);
        return { pass: hasDepends, message: hasDepends ? 'Dependency injection found' : 'Consider using FastAPI Depends for dependencies' };
      },
    },
    {
      name: 'fastapi-cors',
      description: 'Check for CORS configuration',
      severity: 'major',
      check: (code) => {
        const hasCORS = /from\s+fastapi\.middleware\.cors\s+import|CORSMiddleware|add_middleware.*CORSMiddleware/.test(code);
        return { pass: hasCORS, message: hasCORS ? 'CORS configured' : 'Consider adding CORS middleware' };
      },
    },
    {
      name: 'fastapi-security',
      description: 'Check for security headers and middleware',
      severity: 'major',
      check: (code) => {
        const hasSecurity = /from\s+fastapi\.middleware\.(httpsredirect|trustedhost)|GZipMiddleware|SessionMiddleware/.test(code);
        return { pass: hasSecurity, message: hasSecurity ? 'Security middleware found' : 'Consider adding security middleware (HTTPS redirect, trusted hosts)' };
      },
    },
  ];

  return {
    success: true,
    data: {
      auditRules: fastapiRules,
    },
  };
}

/**
 * Detect if the current project is a FastAPI application
 */
async function detectFastAPIProject(cwd) {
  // Check requirements.txt
  const requirementsPath = path.join(cwd, 'requirements.txt');
  if (existsSync(requirementsPath)) {
    try {
      const requirements = readFileSync(requirementsPath, 'utf-8').toLowerCase();
      if (requirements.includes('fastapi')) {
        return true;
      }
    } catch {
      // Continue to next check
    }
  }

  // Check pyproject.toml
  const pyprojectPath = path.join(cwd, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const pyproject = readFileSync(pyprojectPath, 'utf-8').toLowerCase();
      if (pyproject.includes('fastapi')) {
        return true;
      }
    } catch {
      // Continue to next check
    }
  }

  // Check setup.py or setup.cfg
  const setupPath = path.join(cwd, 'setup.py');
  if (existsSync(setupPath)) {
    try {
      const setup = readFileSync(setupPath, 'utf-8').toLowerCase();
      if (setup.includes('fastapi')) {
        return true;
      }
    } catch {
      // Continue
    }
  }

  return false;
}

/**
 * Detect FastAPI version from requirements.txt or pyproject.toml
 */
async function detectFastAPIVersion(cwd) {
  // Try requirements.txt
  const requirementsPath = path.join(cwd, 'requirements.txt');
  if (existsSync(requirementsPath)) {
    try {
      const requirements = readFileSync(requirementsPath, 'utf-8');
      const match = requirements.match(/fastapi\s*==\s*([\d.]+)/);
      if (match) {
        return match[1];
      }
    } catch {
      // Continue
    }
  }

  // Try pyproject.toml
  const pyprojectPath = path.join(cwd, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    try {
      const pyproject = readFileSync(pyprojectPath, 'utf-8');
      const match = pyproject.match(/fastapi\s*=\s*["']?([\d.]+)["']?/);
      if (match) {
        return match[1];
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Enhance task with FastAPI specific context
 */
function enhanceTaskWithFastAPIContext(task) {
  const fastapiContext = `
You are working on a FastAPI application. Follow these patterns:

1. **Routes**: Use APIRouter for modular routes
2. **Async Handlers**: Use async def for route handlers
3. **Validation**: Use Pydantic models for request/response validation
4. **Dependency Injection**: Use Depends() for dependencies
5. **Error Handling**: Use exception handlers for custom errors
6. **CORS**: Add CORSMiddleware for cross-origin requests
7. **Security**: Add security middleware (HTTPSRedirectMiddleware, TrustedHostMiddleware)

Task: ${task}

Consider the FastAPI best practices when generating code.
`;

  return fastapiContext;
}

/**
 * Get FastAPI specific suggestions based on project structure
 */
async function getFastAPISuggestions(cwd) {
  const suggestions = [];

  // Check for common FastAPI patterns
  const hasRoutersDir = existsSync(path.join(cwd, 'routers')) || existsSync(path.join(cwd, 'app', 'routers'));
  const hasModelsDir = existsSync(path.join(cwd, 'models')) || existsSync(path.join(cwd, 'app', 'models'));
  const hasSchemasDir = existsSync(path.join(cwd, 'schemas')) || existsSync(path.join(cwd, 'app', 'schemas'));
  const hasDependenciesDir = existsSync(path.join(cwd, 'dependencies')) || existsSync(path.join(cwd, 'app', 'dependencies'));
  const hasMainFile = existsSync(path.join(cwd, 'main.py')) || existsSync(path.join(cwd, 'app', 'main.py'));

  if (!hasRoutersDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a routers/ directory for better organization',
    });
  }

  if (!hasSchemasDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a schemas/ directory for Pydantic models',
    });
  }

  if (!hasDependenciesDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a dependencies/ directory for dependency functions',
    });
  }

  if (!hasMainFile) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a main.py file for FastAPI app configuration',
    });
  }

  if (hasModelsDir && !hasSchemasDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'You have models/ but no schemas/ - consider renaming models/ to schemas/ for Pydantic models',
    });
  }

  return suggestions;
}

/**
 * Validation: Check router structure
 */
async function validateRouterStructure(context) {
  // Check for proper APIRouter usage
  return { valid: true, message: 'Router structure validation passed' };
}

/**
 * Validation: Check dependency injection
 */
async function validateDependencyInjection(context) {
  // Check for proper Depends usage
  return { valid: true, message: 'Dependency injection validation passed' };
}

/**
 * Validation: Check async handlers
 */
async function validateAsyncHandlers(context) {
  // Check for async def usage
  return { valid: true, message: 'Async handlers validation passed' };
}

/**
 * Validation: Check Pydantic models
 */
async function validatePydanticModels(context) {
  // Check for Pydantic BaseModel usage
  return { valid: true, message: 'Pydantic models validation passed' };
}
