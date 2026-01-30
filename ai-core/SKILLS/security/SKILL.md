---
name: security
description: >
  Critical security patterns for any application: OWASP Top 10, authentication,
  authorization, secrets management, XSS/CSRF prevention, SQL injection prevention,
  Zero Trust, supply chain security, modern auth (FIDO2/Passkeys).
  Trigger: When implementing auth, handling user input, managing secrets, or API security.
license: Apache-2.0
metadata:
  author: ai-core
  version: "2.0"
  scope: [root]
  auto_invoke:
    - "Implementing authentication/authorization"
    - "Handling user input or forms"
    - "Managing secrets/env variables"
    - "Creating API endpoints"
    - "Implementing Zero Trust"
allowed-tools: [Read,Edit,Write,Grep,Bash]
---

## When to Use

- Implementing login/signup/password reset
- Handling file uploads
- Processing user input (forms, API, CLI)
- Storing/retrieving secrets (API keys, DB passwords)
- Creating API endpoints
- Validating data
- Generating tokens/sessions
- Implementing Zero Trust architecture
- Service-to-service authentication

---

## Critical Patterns

### > **ALWAYS**

1. **Validate input on BOTH sides**
   - Client: UX feedback
   - Server: Security enforcement (NEVER trust client)

2. **Use parameterized queries**
   ```sql
   -- WRONG
   SELECT * FROM users WHERE id = '{user_input}'

   -- RIGHT
   SELECT * FROM users WHERE id = $1
   ```

3. **Hash passwords with bcrypt/argon2**
   - NEVER MD5, SHA1, SHA256 for passwords
   - bcrypt: cost factor ≥ 12
   - argon2id: best modern choice

4. **Use HTTPS in production**
   - Redirect HTTP → HTTPS
   - HSTS headers
   - TLS 1.2+ (prefer 1.3)

5. **Implement rate limiting**
   - Auth endpoints: 5-10 req/min
   - API: 100-1000 req/min
   - Per IP + per user

6. **Sanitize output**
   - HTML escape to prevent XSS
   - Encode JSON properly

7. **Use CSRF tokens for state-changing operations**
   - POST/PUT/DELETE require token
   - Token per session

8. **Principle of least privilege**
   - DB user: only needed permissions
   - API tokens: minimal scopes
   - File system: read-only where possible

9. **Implement security headers**
   ```
   Content-Security-Policy: default-src 'self'
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   Referrer-Policy: strict-origin-when-cross-origin
   Permissions-Policy: geolocation=(), microphone=()
   ```

### > **NEVER**

1. **Commit secrets to git**
   - Use `.env` files (gitignored)
   - Use environment variables
   - Use secret managers (Vault, AWS Secrets)

2. **Trust client-side validation**
   - Always validate server-side

3. **Roll your own crypto**
   - Use established libraries
   - JWT, bcrypt, argon2, AES-GCM

4. **Expose internal IDs**
   - Use UUIDs or encoded IDs
   - `/users/507f1f77bcf86cd799439011` ✓
   - `/users/123` ✗

5. **Return raw error messages to clients**
   - Don't expose stack traces
   - Don't reveal DB schema
   - Log details, return generic message

---

## Zero Trust Architecture

### Principles

```
┌─────────────────────────────────────────────┐
│ ZERO TRUST PRINCIPLES                       │
│                                             │
│ 1. Never trust, always verify              │
│ 2. Assume breach                            │
│ 3. Verify explicitly                        │
│ 4. Use least privilege access               │
│ 5. Inspect and log all traffic              │
└─────────────────────────────────────────────┘
```

### Implementation

```python
# Every request must be authenticated AND authorized
@app.middleware("http")
async def zero_trust_middleware(request: Request, call_next):
    # 1. Verify identity (authentication)
    identity = await verify_identity(request)
    if not identity:
        return JSONResponse(status_code=401, content={"error": "Unauthenticated"})

    # 2. Verify device health (optional but recommended)
    device_trust = await verify_device(request)
    if not device_trust.is_compliant:
        return JSONResponse(status_code=403, content={"error": "Device not compliant"})

    # 3. Verify authorization for specific resource
    resource = extract_resource(request)
    if not await is_authorized(identity, resource, request.method):
        return JSONResponse(status_code=403, content={"error": "Forbidden"})

    # 4. Log the access attempt
    await audit_log(identity, resource, request)

    return await call_next(request)
```

### Service-to-Service Auth (mTLS)

```yaml
# Kubernetes with Istio service mesh
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT  # Require mTLS for all service communication

---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: api-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: api
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/production/sa/frontend"]
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/v1/*"]
```

---

## Modern Authentication

### FIDO2/WebAuthn (Passkeys)

```javascript
// Registration (create credential)
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: serverChallenge,
    rp: {
      name: "My App",
      id: "myapp.com"
    },
    user: {
      id: userId,
      name: userEmail,
      displayName: userName
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },   // ES256
      { type: "public-key", alg: -257 }  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",  // Built-in (Face ID, Touch ID)
      residentKey: "required",              // Discoverable credential
      userVerification: "required"          // Biometric required
    },
    timeout: 60000
  }
});

// Authentication (get credential)
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: serverChallenge,
    rpId: "myapp.com",
    userVerification: "required",
    timeout: 60000
  }
});
```

### OAuth 2.0 + PKCE (For SPAs/Mobile)

```javascript
// 1. Generate PKCE challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return { verifier, challenge };
}

// 2. Authorization request
const { verifier, challenge } = generatePKCE();
sessionStorage.setItem('pkce_verifier', verifier);

const authUrl = new URL('https://auth.example.com/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('state', crypto.randomUUID());

window.location.href = authUrl.toString();

// 3. Token exchange (after redirect)
const tokenResponse = await fetch('https://auth.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: sessionStorage.getItem('pkce_verifier')
  })
});
```

### OAuth 2.1 Updates (Current Standard - 2024+)

OAuth 2.1 introduces security improvements over OAuth 2.0:

```javascript
// OAuth 2.1 Authorization Request (with PKCE REQUIRED)
const authUrl = new URL('https://auth.example.com/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');  // REQUIRED in 2.1
authUrl.searchParams.set('state', crypto.randomUUID());

// OAuth 2.1 REQUIRED parameters:
// - PKCE (code_challenge + code_challenge_method) is MANDATORY for all clients
// - response_type=code is REQUIRED (no implicit flow)
// - client_id MUST be validated (no public clients)
// - Authorization Code Flow with PKCE is the ONLY allowed flow

// OAuth 2.1 FORBIDDEN:
// - implicit grant (removed)
// - resource owner password credentials (removed)
// - client credentials in public clients (removed)
```

**Key OAuth 2.1 Changes:**

| Feature | OAuth 2.0 | OAuth 2.1 |
|---------|-----------|-----------|
| PKCE | Optional for public clients | **Required for ALL** |
| Implicit Grant | Allowed | **Forbidden** |
| Password Grant | Allowed | **Forbidden** |
| Refresh Token Rotation | Recommended | **Required** |
| client_id | Required | **Required + Validated** |

**Spring Boot OAuth 2.1 Client Example:**

```java
@Configuration
public class OAuth2ClientConfig {

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(
            OAuth2ClientRepository repository,
            OAuth2AuthorizedClientService service) {

        DefaultOAuth2AuthorizedClientManager manager =
            new DefaultOAuth2AuthorizedClientManager(repository, service);

        // OAuth 2.1: Set up authorization request with PKCE
        OAuth2AuthorizedClientProviderBuilder.provider()
            .authorization()
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .scopes(Arrays.asList("openid", "profile", "email"))
            .authorizationUri("https://auth.example.com/authorize")
            .tokenUri("https://auth.example.com/token")
            .authorizationCodeGrant();
            // PKCE is automatically enabled in Spring Security 6+

        return manager;
    }
}
```

### JWT Best Practices

```python
import jwt
from datetime import datetime, timedelta

# Token generation
def create_tokens(user_id: str, roles: list[str]) -> dict:
    now = datetime.utcnow()

    # Short-lived access token (15 min)
    access_token = jwt.encode({
        "sub": user_id,
        "roles": roles,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=15),
        "jti": str(uuid.uuid4())  # Unique ID for revocation
    }, ACCESS_SECRET, algorithm="RS256")  # Use RS256 for asymmetric

    # Long-lived refresh token (7 days)
    refresh_token = jwt.encode({
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=7),
        "jti": str(uuid.uuid4())
    }, REFRESH_SECRET, algorithm="RS256")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900
    }

# Token validation
def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            ACCESS_PUBLIC_KEY,
            algorithms=["RS256"],
            options={
                "require": ["sub", "exp", "iat", "jti"],
                "verify_exp": True
            }
        )

        # Check if token is revoked
        if is_token_revoked(payload["jti"]):
            raise jwt.InvalidTokenError("Token revoked")

        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token expired")
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {e}")
```

---

## Secrets Management

### Secret Rotation

```python
# Automatic secret rotation with AWS Secrets Manager
import boto3
from datetime import datetime

class SecretRotator:
    def __init__(self):
        self.client = boto3.client('secretsmanager')

    async def rotate_db_password(self, secret_id: str):
        # 1. Create new password
        new_password = self.generate_secure_password()

        # 2. Update database with new password
        await self.update_db_password(new_password)

        # 3. Store new secret version
        self.client.put_secret_value(
            SecretId=secret_id,
            SecretString=json.dumps({
                "password": new_password,
                "rotated_at": datetime.utcnow().isoformat()
            }),
            VersionStages=['AWSCURRENT']
        )

        # 4. Mark old version as previous
        # AWS handles this automatically

    def generate_secure_password(self, length=32):
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
```

### HashiCorp Vault Integration

```python
import hvac

class VaultClient:
    def __init__(self):
        self.client = hvac.Client(
            url=os.environ['VAULT_ADDR'],
            token=os.environ['VAULT_TOKEN']
        )

    def get_secret(self, path: str) -> dict:
        """Get secret from Vault KV v2"""
        response = self.client.secrets.kv.v2.read_secret_version(
            path=path,
            mount_point='secret'
        )
        return response['data']['data']

    def get_database_credentials(self) -> dict:
        """Get dynamic database credentials"""
        response = self.client.secrets.database.generate_credentials(
            name='my-role',
            mount_point='database'
        )
        return {
            'username': response['data']['username'],
            'password': response['data']['password'],
            'lease_id': response['lease_id'],
            'lease_duration': response['lease_duration']
        }
```

---

## OWASP Top 10 (2021)

| # | Risk | Prevention |
|---|------|------------|
| 1 | **Broken Access Control** | Verify ownership on every request, deny by default |
| 2 | **Cryptographic Failures** | Hash passwords, encrypt data at rest, TLS 1.3 |
| 3 | **Injection** | Parameterized queries, input validation, ORM |
| 4 | **Insecure Design** | Threat modeling, secure by design, abuse cases |
| 5 | **Security Misconfiguration** | Remove defaults, harden configs, automate |
| 6 | **Vulnerable Components** | SBOM, scan dependencies, update regularly |
| 7 | **Auth Failures** | MFA, strong passwords, account lockout, Passkeys |
| 8 | **Data Integrity Failures** | Code signing, SBOM, integrity checks |
| 9 | **Logging Failures** | Log auth attempts, monitor, alert (no secrets) |
| 10 | **SSRF** | Validate URLs, allowlist, deny internal IPs |

---

## OWASP API Security Top 10 (2023)

APIs have unique security challenges. The OWASP API Security Top 10 addresses these:

| # | Risk | Prevention |
|---|------|------------|
| 1 | **Broken Object Level Authorization** | Verify ownership of EVERY object access (BOLA) |
| 2 | **Broken Authentication** | Never expose API keys in URLs, use JWT/OAuth |
| 3 | **Broken Object Property Level Authorization** | Validate ALL properties in read/update operations |
| 4 | **Unrestricted Resource Consumption** | Rate limiting, pagination, max results caps |
| 5 | **Broken Function Level Authorization** | Group permissions, deny by default, audit |
| 6 | **Unrestricted Access to Sensitive Business Flows** | Validate workflow steps, force time delays |
| 7 | **Server Side Request Forgery (SSRF)** | URL allowlists, block internal IPs, network segmentation |
| 8 | **Security Misconfiguration** | Remove debug endpoints, proper CORS, secure defaults |
| 9 | **Improper Inventory Management** | Document all APIs, version properly, deprecate old versions |
| 10 | **Unsafe Consumption of APIs** | Validate responses from upstream APIs, rate limit integrations |

### API Security Best Practices

```python
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()
security = HTTPBearer()

# 1. BOLA (Broken Object Level Authorization) Prevention
@app.get("/api/users/{user_id}/documents/{doc_id}")
async def get_document(
    user_id: str,
    doc_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify: Does the authenticated user own this document?
    current_user_id = get_user_from_token(credentials.credentials)
    document = await db.get_document(doc_id)

    if document.owner_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return document

# 2. Rate Limiting for APIs (API4:2019 #4)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/search")
@limiter.limit("10/minute")  # Max 10 requests per minute per IP
async def search_api(query: str):
    return await search_service.search(query)

# 3. SSRF Prevention (API10:2023 #7)
import ipaddress
from urllib.parse import urlparse

ALLOWED_DOMAINS = {"api.example.com", "api.trustedpartner.com"}

async def fetch_from_url(url: str):
    # Validate URL
    parsed = urlparse(url)

    # Check against allowlist
    if parsed.netloc not in ALLOWED_DOMAINS:
        raise HTTPException(status_code=400, detail="Domain not allowed")

    # Block internal IPs
    try:
        ip = ipaddress.ip_address(parsed.netloc)
        if ip.is_private or ip.is_loopback:
            raise HTTPException(status_code=400, detail="Internal IPs not allowed")
    except ValueError:
        pass  # Not an IP, continue

    # Make request with timeout
    async with httpx.AsyncClient(timeout=5.0) as client:
        return await client.get(url)
```

### GraphQL API Security

```graphql
# GraphQL-specific security patterns
type Query {
  # Field-level authorization
  "User profile (requires own user ID)"
  userProfile(id: ID!): User @hasPermission(field: "user.profile", id: "$id")

  # Rate limited field
  "Search results (limited to 10 requests/minute)"
  search(query: String!): [SearchResult] @rateLimit(limit: 10, window: 60)
}

# Input validation
type Mutation {
  createUser(input: CreateUserInput!): UserPayload
    @validateInput(schema: "CreateUserInput")
    @throttle(maxAttempts: 3, window: 60)
}
```

---

## Input Validation

### Schema Validation (Zod - TypeScript)

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .max(255)
    .transform(s => s.toLowerCase().trim()),

  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),

  age: z.number()
    .int()
    .min(13, "Must be at least 13 years old")
    .max(150),

  role: z.enum(["user", "admin", "moderator"]),

  metadata: z.record(z.string()).optional()
});

// Usage
const result = UserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten() });
}
const validatedUser = result.data;
```

### File Upload Security

```python
import magic
from pathlib import Path

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf'}
ALLOWED_MIMETYPES = {'image/jpeg', 'image/png', 'image/gif', 'application/pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def secure_file_upload(file: UploadFile) -> str:
    # 1. Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValidationError("File too large")

    # 2. Verify extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("File type not allowed")

    # 3. Verify MIME type (magic bytes, not Content-Type header)
    mime = magic.from_buffer(content, mime=True)
    if mime not in ALLOWED_MIMETYPES:
        raise ValidationError("File content type not allowed")

    # 4. Generate safe filename (never trust user input)
    safe_filename = f"{uuid.uuid4()}{ext}"

    # 5. Store outside web root
    storage_path = Path("/secure-storage") / safe_filename
    storage_path.write_bytes(content)

    return safe_filename
```

---

## Examples

### Password Hashing (Python)

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed)
```

### JWT Validation (Node.js)

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = decoded;
    next();
  });
}
```

### Security Headers Middleware (Node.js)

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Spring Security Examples

### Method Security

```java
import org.springframework.security.access.prepost.*;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api")
public class SecureController {

    // Role-based authorization
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminEndpoint() {
        return ResponseEntity.ok("Admin access granted");
    }

    // Custom authorization logic
    @GetMapping("/resource/{id}")
    @PreAuthorize("@securityService.canAccessResource(#id, authentication)")
    public ResponseEntity<?> getResource(@PathVariable Long id) {
        return ResponseEntity.ok("Resource access granted");
    }

    // Multiple conditions
    @PostMapping("/sensitive")
    @PreAuthorize("hasRole('USER') and @securityService.isVerified(authentication)")
    public ResponseEntity<?> sensitiveOperation() {
        return ResponseEntity.ok("Operation allowed");
    }
}
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. CSRF protection (required for state-changing operations)
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/public/**")  // Disable for public APIs
            )

            // 2. CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 3. Authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/user/**").hasRole("USER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )

            // 4. Session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 5. Security headers
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'"))
                .frameOptions().deny()
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000))
            )

            // 6. Exception handling
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Unauthorized\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden\"}");
                })
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12);
    }
}
```

### JWT Authentication with Spring Security

```java
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Service
public class JwtTokenProvider {

    private final String jwtSecret = "your-256-bit-secret";  // Use environment variable
    private final int jwtExpirationMs = 900000;  // 15 minutes

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(jwtSecret)
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Log error
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return Long.parseLong(claims.getSubject());
    }
}

// JWT Authentication Filter
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String jwt = getJwtFromRequest(request);

        if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
            Long userId = tokenProvider.getUserIdFromToken(jwt);
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### Custom Security Service

```java
@Service
public class SecurityService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    // Object-level authorization check
    public boolean canAccessResource(Long resourceId, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Document document = documentRepository.findById(resourceId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        // Check ownership or admin role
        return document.getOwner().getId().equals(user.getId())
            || authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
    }

    // Verified user check
    public boolean isVerified(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return user.isEmailVerified()
            && user.isPhoneVerified();
    }
}
```

### Data JPA Security (Row-Level Security)

```java
// Entity-level filtering
@Entity
@Table(name = "documents")
@FilterDef(name = "ownerFilter", parameters = {@ParamDef(name = "ownerId", type = "long")})
@Filter(name = "ownerFilter", condition = "owner_id = :ownerId")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id")
    private Long ownerId;

    // ... other fields
}

// Repository with filtering
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Only return documents owned by current user
    @Query("SELECT d FROM Document d WHERE d.ownerId = :ownerId")
    List<Document> findByOwner(@Param("ownerId") Long ownerId);

    // Apply filter automatically
    @Override
    List<Document> findAll();
}
```

---

## Commands

```bash
# Check for committed secrets
git log --all --full-history --source -- "*password*" "*secret*" "*key*"
gitleaks detect --source .

# Scan dependencies for vulnerabilities
npm audit
pip-audit
safety check
snyk test
trivy fs .

# Find hardcoded secrets
grep -r "password\|api_key\|secret" --include="*.py" --include="*.js"

# Security headers test
curl -I https://example.com | grep -E "(Content-Security|Strict-Transport|X-Frame)"

# SSL/TLS test
openssl s_client -connect example.com:443 -tls1_3
```

---

## Resources

- **OWASP Cheat Sheets**: [owasp.org](https://cheatsheetseries.owasp.org)
- **OWASP Top 10**: [owasp.org/Top10](https://owasp.org/www-project-top-ten/)
- **OWASP ASVS**: [owasp.org/asvs](https://owasp.org/www-project-application-security-verification-standard/)
- **NIST Guidelines**: [nvlpubs.nist.gov](https://csrc.nist.gov/)
- **Zero Trust**: [nist.gov/publications/zero-trust-architecture](https://www.nist.gov/publications/zero-trust-architecture)
- **WebAuthn**: [webauthn.guide](https://webauthn.guide/)
