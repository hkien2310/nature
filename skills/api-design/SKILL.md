---
name: api-design
description: "API design principles: REST vs GraphQL vs tRPC, response formats, versioning, pagination, error handling."
---

# API Design

> AI đọc trước khi thiết kế API endpoints, response format, hoặc integration layer.
> **Learn to THINK, not copy fixed patterns.**

## Decision Checklist

- [ ] Xác định API consumers (web app, mobile, third-party)?
- [ ] Chọn API style phù hợp (REST/GraphQL/tRPC)?
- [ ] Định nghĩa response format nhất quán?
- [ ] Planned versioning strategy?
- [ ] Rate limiting configured?

## API Style Selection

| Style | Best For | Avoid When |
|-------|----------|------------|
| **REST** | CRUD APIs, public APIs, simple services | Complex nested data, real-time |
| **GraphQL** | Complex data graphs, mobile apps, multiple clients | Simple CRUD, small teams |
| **tRPC** | TypeScript monorepo, full-stack type safety | Multi-language, public APIs |

> **Default:** REST — unless project has specific needs for GraphQL/tRPC.

## REST Best Practices

### URL Convention
```
GET    /api/v1/users          → List users
GET    /api/v1/users/:id      → Get user
POST   /api/v1/users          → Create user
PUT    /api/v1/users/:id      → Update user (full)
PATCH  /api/v1/users/:id      → Update user (partial)
DELETE /api/v1/users/:id      → Delete user
```

### Response Format (nhất quán)
```json
// Success
{
  "success": true,
  "data": { "id": 1, "name": "John" },
  "meta": { "page": 1, "total": 100, "limit": 20 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [{ "field": "email", "message": "Required" }]
  }
}
```

### Status Codes
| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET, PUT, PATCH success |
| 201 | Created | POST success |
| 204 | No Content | DELETE success |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token, no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error (log, don't expose) |

### Pagination
```
# Cursor-based (recommended cho large datasets)
GET /api/v1/users?cursor=abc123&limit=20

# Offset-based (simple, OK cho small datasets)
GET /api/v1/users?page=1&limit=20
```

### Versioning
```
# URL versioning (recommended)
/api/v1/users
/api/v2/users

# Header versioning (alternative)
Accept: application/vnd.myapp.v1+json
```

## Error Handling Pattern

```typescript
// Centralized error class
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Usage
throw new AppError(404, 'USER_NOT_FOUND', 'User does not exist');

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  // Unknown error — log + generic response
  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});
```

## Anti-Patterns

❌ Default REST cho mọi thứ — cân nhắc context
❌ Dùng verbs trong URL (`/getUsers`, `/deleteUser`)
❌ Response format không nhất quán giữa endpoints
❌ Expose internal errors (stack trace) cho client
❌ Skip rate limiting
❌ Không versioning API
