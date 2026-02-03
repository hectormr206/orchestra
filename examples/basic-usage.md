# Basic Usage Examples

Simple everyday tasks using Orchestra.

## Generate Code

### Create a React Component

```bash
orchestra start "Create a React component for a product card with:
- Product image
- Title and description
- Price display
- Add to cart button
- TypeScript types
- CSS modules"
```

### Create an Express Route

```bash
orchestra start "Create an Express.js route for user registration with:
- Email validation
- Password hashing with bcrypt
- Error handling
- Input sanitization
- HTTP status codes"
```

### Add Unit Tests

```bash
orchestra start "Add unit tests for the auth module using Vitest with:
- Test cases for login
- Test cases for registration
- Mocked dependencies
- Coverage for happy path and error cases"
```

## Debugging

### Fix a Bug

```bash
# Describe the bug
orchestra start "Fix the bug where login fails when email contains uppercase letters:
- Problem: User cannot login with Email@Example.com
- Expected: Should login successfully
- Files: src/auth/login.ts"

# Orchestra will:
# 1. Analyze the code
# 2. Identify the issue
# 3. Implement the fix
# 4. Add tests to prevent regression
```

## Refactoring

### Convert to TypeScript

```bash
orchestra start "Convert the utils/string.js file to TypeScript:
- Add proper type definitions
- Convert all functions
- Add JSDoc comments
- Ensure type safety"
```

### Add Error Handling

```bash
orchestra start "Add comprehensive error handling to the API layer:
- Try-catch blocks
- Error logging
- User-friendly error messages
- Proper HTTP status codes"
```

## Documentation

### Generate API Documentation

```bash
orchestra start "Generate JSDoc comments for all API routes:
- Describe parameters
- Describe return values
- Add usage examples
- Include type information"
```

## Quick Tips

### Be Specific

```bash
# Too vague
orchestra start "Fix the auth"

# Better
orchestra start "Fix the authentication bug where JWT tokens expire too early"
```

### Specify Requirements

```bash
orchestra start "Create a contact form with:
- Name, email, message fields
- Client-side validation
- Server-side validation
- Email sending with Nodemailer
- Rate limiting to prevent spam"
```

### Use Context

```bash
orchestra start "Add a checkout button to the product page (src/pages/Product.tsx):
- Button should be primary color
- Open checkout modal on click
- Disable if product is out of stock
- Show loading spinner during checkout"
```

## Common Patterns

### CRUD Operations

```bash
# Create
orchestra start "Create a CRUD interface for blog posts:
- Create, Read, Update, Delete operations
- REST API endpoints
- Frontend UI components
- Validation and error handling"

# Update
orchestra start "Update the blog CRUD to use PostgreSQL instead of in-memory storage"

# Delete
orchestra start "Remove the deprecated comment feature from the blog CRUD"
```

### Authentication

```bash
orchestra start "Add password reset functionality:
- Generate reset token
- Send email with reset link
- Validate token
- Allow password update
- Token expiration handling"
```

### Data Validation

```bash
orchestra start "Add input validation to the user registration form:
- Email format validation
- Password strength requirements
- Username availability check
- Phone number format validation
- Sanitize all inputs"
```

## Running Examples

Try these examples in your project:

```bash
# 1. Simple component
orchestra start "Create a footer component with:
- Copyright notice
- Links to social media
- Newsletter signup
- Responsive design"

# 2. Form validation
orchestra start "Add form validation to the contact form:
- Required field indicators
- Real-time validation feedback
- Error messages
- Success notification"

# 3. API endpoint
orchestra start "Create an endpoint to get user profile by ID:
- GET /api/users/:id
- Return 404 if not found
- Include user posts count
- Format response as JSON"
```

## See Also

- [Web Development Examples](./web-development.md)
- [API Development Examples](./api-development.md)
- [Testing Examples](./testing.md)
- [Refactoring Examples](./refactoring.md)
