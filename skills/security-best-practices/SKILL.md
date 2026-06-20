---
name: security-best-practices
description: "Security checklist: OWASP Top 10, auth patterns, CORS/CSRF, secrets management, XSS prevention."
---

# Security Best Practices

> AI đọc trước khi implement auth, API, form handling, hoặc deploy production.

## Security Checklist (Review trước deploy)

- [ ] Secrets trong `.env`, KHÔNG trong code
- [ ] CORS configured đúng (không dùng `*` cho production)
- [ ] Input validation ở cả client + server
- [ ] SQL injection prevention (parameterized queries / ORM)
- [ ] XSS prevention (escape output, CSP headers)
- [ ] CSRF protection (token hoặc SameSite cookies)
- [ ] Rate limiting trên API endpoints
- [ ] HTTPS only (redirect HTTP → HTTPS)
- [ ] Auth tokens có expiry
- [ ] Sensitive data không log ra console/file

## Secrets Management

```bash
# ✅ Đúng
DATABASE_URL=postgresql://... # trong .env
process.env.DATABASE_URL      # trong code

# ❌ Sai
const DB_URL = "postgresql://user:password@host/db"  # hard-coded
```

**Quy tắc:**
- Tất cả secrets → `.env` (gitignored)
- `.env.example` → chứa key names, KHÔNG chứa values
- Production secrets → environment variables hoặc secret manager (Vault, AWS SSM)

## Authentication Patterns

| Pattern | Khi nào | Lưu ý |
|---------|---------|-------|
| **JWT** | API stateless, SPA | Ngắn expiry (15m), dùng refresh token |
| **Session** | Server-rendered, traditional | HttpOnly + Secure cookies |
| **OAuth 2.0** | Third-party login | Dùng PKCE cho SPA |
| **API Keys** | Server-to-server | Hash keys, không log |

### JWT Best Practices
```typescript
// ✅ Đúng
const token = jwt.sign(payload, secret, { 
  expiresIn: '15m',
  algorithm: 'HS256'
});

// ❌ Sai
const token = jwt.sign(payload, secret); // Không expiry!
```

## Input Validation

```typescript
// ✅ Validate ở SERVER (không chỉ client)
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150),
});

// Trong route handler
const result = createUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: result.error.issues });
}
```

## CORS Configuration

```typescript
// ✅ Production
app.use(cors({
  origin: ['https://myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ❌ KHÔNG dùng cho production
app.use(cors({ origin: '*' }));
```

## HTTP Security Headers

```typescript
import helmet from 'helmet';
app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options, CSP, HSTS, etc.
```

## OWASP Top 10 Quick Reference

| # | Threat | Mitigation |
|---|--------|-----------|
| 1 | Broken Access Control | RBAC, check permissions per endpoint |
| 2 | Cryptographic Failures | HTTPS, bcrypt for passwords, no MD5/SHA1 |
| 3 | Injection | Parameterized queries, input validation |
| 4 | Insecure Design | Threat modeling, security reviews |
| 5 | Security Misconfiguration | Helmet, disable debug in prod |
| 6 | Vulnerable Components | `npm audit`, update dependencies |
| 7 | Auth Failures | MFA, rate limit login, secure tokens |
| 8 | Data Integrity Failures | Verify dependencies, signed updates |
| 9 | Logging Failures | Log security events, don't log secrets |
| 10 | SSRF | Validate URLs, whitelist domains |

## Anti-Patterns

❌ Hard-code secrets, API keys, passwords
❌ Trust client-side validation alone
❌ Use `*` CORS in production
❌ Store passwords as plaintext or MD5
❌ Log sensitive data (tokens, passwords, PII)
❌ Disable HTTPS "for testing" and forget to re-enable
