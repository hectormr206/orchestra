# Express.js Plugin for Orchestra CLI

Official plugin for enhanced Express.js development support in Orchestra CLI.

## Features

### 🔍 Automatic Detection
Automatically detects Express.js projects by checking for `express` in `package.json` dependencies.

### 📝 Enhanced Prompts
Provides Express.js-specific context and best practices during the planning phase:
- Router pattern guidance
- Middleware configuration
- Error handling patterns
- Async/await best practices
- Security recommendations

### ✅ Validation
Validates generated Express.js code for:
- Proper Router structure
- Async handler error handling
- Body parser configuration
- CORS setup
- Security headers (helmet)

### 💡 Best Practices Suggestions
Suggests improvements based on:
- Project structure (routes/, middleware/, controllers/)
- Task context (routes, middleware, errors)
- Common Express.js patterns

## Installation

The plugin is included with Orchestra CLI. Simply ensure your project has Express.js installed:

```bash
npm install express
```

Orchestra will automatically detect and activate the plugin.

## Usage

The plugin automatically hooks into the Orchestra workflow:

### Planning Phase
```bash
orchestra start "Add user authentication with JWT"
```

The plugin will:
1. Detect Express.js in your project
2. Enhance the prompt with Express.js context
3. Suggest proper patterns for authentication in Express

### Code Generation
```bash
orchestra start "Create a REST API for products"
```

The plugin will:
1. Generate code following Express.js best practices
2. Suggest using Router for modular routes
3. Recommend proper middleware configuration

### Auditing
```bash
orchestra start "Audit my Express application"
```

The plugin will:
1. Run Express.js-specific audit rules
2. Check for security issues
3. Validate middleware order
4. Suggest improvements

## Audit Rules

The plugin includes 5 Express.js-specific audit rules:

| Rule | Severity | Description |
|------|----------|-------------|
| `express-router-structure` | Major | Validates proper Express Router usage |
| `express-async-handlers` | Critical | Ensures async handlers have error handling |
| `express-body-parser` | Critical | Checks for body-parser configuration |
| `express-cors` | Major | Validates CORS middleware setup |
| `express-security-headers` | Major | Checks for helmet/security headers |

## Configuration

The plugin can be configured via `.orchestrarc.json`:

```json
{
  "plugins": {
    "express-js": {
      "enabled": true,
      "config": {
        "detectRoutes": true,
        "detectMiddleware": true,
        "suggestPatterns": true
      }
    }
  }
}
```

## Best Practices Enforced

### 1. Router Pattern
```javascript
const router = express.Router();

router.get('/users', (req, res) => {
  res.json({ users: [] });
});

module.exports = router;
```

### 2. Middleware Pattern
```javascript
const middleware = (req, res, next) => {
  // Do something
  next(); // Don't forget this!
};
```

### 3. Error Handling
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

### 4. Async Handlers
```javascript
router.get('/async', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

## Example Output

When working on an Express.js project, Orchestra will provide enhanced prompts:

```
You are working on an Express.js application. Follow these patterns:

1. **Routes**: Use express.Router() for modular routes
2. **Middleware**: Order matters - configure middleware before routes
3. **Error Handling**: Use error-handling middleware (4 parameters)
4. **Async Handlers**: Use try-catch or express-async-errors
5. **Body Parser**: Add body-parser for JSON/urlencoded data
6. **Security**: Use helmet for security headers
7. **CORS**: Add cors middleware if needed

Task: Add user authentication with JWT

Consider the Express.js best practices when generating code.
```

## Development

To test the plugin:

```bash
npm test -- expressJsPlugin.test.ts
```

## License

MIT

## Author

Orchestra Team

## Version

0.1.0
