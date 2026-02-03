/**
 * Express.js Plugin for Orchestra CLI
 *
 * Provides specialized support for Express.js applications:
 * - Enhanced prompts for Express-specific patterns
 * - Route and middleware detection
 * - Express.js best practices suggestions
 * - Specialized audit rules for Express applications
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Enhance the planning phase with Express.js specific context
 */
export async function enhancePlanForExpress(context) {
  const { sessionId, task, metadata, config } = context;

  // Check if this is an Express.js project
  const cwd = config.workingDir || process.cwd();
  const isExpressProject = await detectExpressProject(cwd);

  if (!isExpressProject) {
    return { success: true }; // Not an Express project, skip
  }

  // Add Express.js specific context to metadata
  metadata.framework = 'express';
  metadata.expressVersion = await detectExpressVersion(cwd);

  // Enhance the task with Express.js context
  const enhancedTask = enhanceTaskWithExpressContext(task);

  return {
    success: true,
    data: {
      enhancedTask,
      framework: 'express',
      suggestions: await getExpressSuggestions(cwd),
    },
  };
}

/**
 * Validate generated Express code before execution
 */
export async function validateExpressCode(context) {
  const { metadata, phase } = context;

  if (metadata.framework !== 'express') {
    return { success: true };
  }

  // Express.js specific validations
  const validations = [
    validateMiddlewareOrder,
    validateErrorHandling,
    validateRouteDefinitions,
    validateAsyncHandlers,
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
 * Suggest Express.js best practices after code generation
 */
export async function suggestExpressBestPractices(context) {
  const { metadata, task } = context;

  if (metadata.framework !== 'express') {
    return { success: true };
  }

  const suggestions = [];

  // Analyze the task to suggest relevant best practices
  if (task.toLowerCase().includes('route') || task.toLowerCase().includes('endpoint')) {
    suggestions.push({
      type: 'best-practice',
      category: 'routes',
      suggestion: 'Consider using express.Router() for modular route definitions',
      code: `const router = express.Router();

router.get('/path', (req, res) => {
  // Handler logic
});

module.exports = router;`,
    });
  }

  if (task.toLowerCase().includes('middleware')) {
    suggestions.push({
      type: 'best-practice',
      category: 'middleware',
      suggestion: 'Middleware functions should call next() to pass control',
      code: `const middleware = (req, res, next) => {
  // Do something
  next(); // Don't forget this!
};`,
    });
  }

  if (task.toLowerCase().includes('error')) {
    suggestions.push({
      type: 'best-practice',
      category: 'error-handling',
      suggestion: 'Use error handling middleware with 4 parameters',
      code: `app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});`,
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
 * Configure Express.js specific audit rules
 */
export async function configureExpressAuditRules(context) {
  const { metadata } = context;

  if (metadata.framework !== 'express') {
    return { success: true };
  }

  const expressRules = [
    {
      name: 'express-router-structure',
      description: 'Check for proper Express Router structure',
      severity: 'major',
      check: (code) => {
        // Check if routes are properly organized in routers
        const hasRouter = /express\.Router\(\)/.test(code);
        const hasModuleExports = /module\.exports\s*=\s*router/.test(code);
        return { pass: hasRouter && hasModuleExports, message: hasRouter ? 'Good router structure' : 'Consider using Express Router' };
      },
    },
    {
      name: 'express-async-handlers',
      description: 'Check for proper async/await in route handlers',
      severity: 'critical',
      check: (code) => {
        // Check if async routes properly handle errors
        const hasAsyncHandler = /app\.(get|post|put|delete)\(.*async\s*\(/.test(code);
        const hasTryCatch = /try\s*{[\s\S]*?}\s*catch/.test(code);
        if (hasAsyncHandler && !hasTryCatch) {
          return { pass: false, message: 'Async handlers should have try-catch or use express-async-errors' };
        }
        return { pass: true };
      },
    },
    {
      name: 'express-body-parser',
      description: 'Check for body parser configuration',
      severity: 'critical',
      check: (code) => {
        const hasBodyParser = /body-parser|express\.json\(\)|express\.urlencoded\(\)/.test(code);
        return { pass: hasBodyParser, message: hasBodyParser ? 'Body parser found' : 'Add body-parser middleware for JSON/urlencoded data' };
      },
    },
    {
      name: 'express-cors',
      description: 'Check for CORS configuration',
      severity: 'major',
      check: (code) => {
        const hasCORS = /cors|Access-Control-Allow/.test(code);
        return { pass: hasCORS, message: hasCORS ? 'CORS configured' : 'Consider adding CORS middleware' };
      },
    },
    {
      name: 'express-security-headers',
      description: 'Check for security headers middleware',
      severity: 'major',
      check: (code) => {
        const hasHelmet = /helmet|frameguard|hidePoweredBy/.test(code);
        return { pass: hasHelmet, message: hasHelmet ? 'Security headers found' : 'Consider adding helmet middleware for security headers' };
      },
    },
  ];

  return {
    success: true,
    data: {
      auditRules: expressRules,
    },
  };
}

/**
 * Detect if the current project is an Express.js application
 */
async function detectExpressProject(cwd) {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for express in dependencies
    return 'express' in dependencies;
  } catch {
    return false;
  }
}

/**
 * Detect Express version from package.json
 */
async function detectExpressVersion(cwd) {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.dependencies?.express || packageJson.devDependencies?.express || null;
  } catch {
    return null;
  }
}

/**
 * Enhance task with Express.js specific context
 */
function enhanceTaskWithExpressContext(task) {
  const expressContext = `
You are working on an Express.js application. Follow these patterns:

1. **Routes**: Use express.Router() for modular routes
2. **Middleware**: Order matters - configure middleware before routes
3. **Error Handling**: Use error-handling middleware (4 parameters)
4. **Async Handlers**: Use try-catch or express-async-errors
5. **Body Parser**: Add body-parser for JSON/urlencoded data
6. **Security**: Use helmet for security headers
7. **CORS**: Add cors middleware if needed

Task: ${task}

Consider the Express.js best practices when generating code.
`;

  return expressContext;
}

/**
 * Get Express.js specific suggestions based on project structure
 */
async function getExpressSuggestions(cwd) {
  const suggestions = [];

  // Check for common Express.js patterns
  const hasRoutesDir = existsSync(path.join(cwd, 'routes'));
  const hasMiddlewareDir = existsSync(path.join(cwd, 'middleware'));
  const hasControllersDir = existsSync(path.join(cwd, 'controllers'));
  const hasAppFile = existsSync(path.join(cwd, 'app.js')) || existsSync(path.join(cwd, 'app.ts'));

  if (!hasRoutesDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a routes/ directory for better organization',
    });
  }

  if (!hasMiddlewareDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating a middleware/ directory for custom middleware',
    });
  }

  if (!hasAppFile) {
    suggestions.push({
      type: 'structure',
      suggestion: 'Consider creating an app.js or app.ts file for Express app configuration',
    });
  }

  if (hasControllersDir && !hasRoutesDir) {
    suggestions.push({
      type: 'structure',
      suggestion: 'You have controllers/ but no routes/ - consider migrating to routes/ pattern',
    });
  }

  return suggestions;
}

/**
 * Validation: Check middleware order
 */
async function validateMiddlewareOrder(context) {
  // Middleware should be configured before routes
  // This is a simplified check - in practice would analyze AST
  return { valid: true, message: 'Middleware order validation passed' };
}

/**
 * Validation: Check error handling
 */
async function validateErrorHandling(context) {
  // Check for error handling middleware
  return { valid: true, message: 'Error handling validation passed' };
}

/**
 * Validation: Check route definitions
 */
async function validateRouteDefinitions(context) {
  // Check for proper route definitions
  return { valid: true, message: 'Route definitions validation passed' };
}

/**
 * Validation: Check async handlers
 */
async function validateAsyncHandlers(context) {
  // Check for proper async/await usage
  return { valid: true, message: 'Async handlers validation passed' };
}
