---
name: error-handling-patterns
description: "Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences."
risk: safe
source: community
date_added: "2026-02-27"
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## Use this skill when

- Implementing error handling in new features
- Designing error-resilient APIs
- Debugging production issues
- Improving application reliability
- Creating better error messages for users and developers
- Implementing retry and circuit breaker patterns
- Handling async/concurrent errors
- Building fault-tolerant distributed systems

## Core Patterns

### 1. Error Boundaries (React)
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2. Result Pattern (No Throwing)
```typescript
type Result<T, E = Error> = 
  | { ok: true; value: T } 
  | { ok: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.users.findById(id);
    if (!user) return { ok: false, error: new Error('User not found') };
    return { ok: true, value: user };
  } catch (err) {
    return { ok: false, error: err as Error };
  }
}
```

### 3. Centralized Error Handler (Express)
```typescript
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  
  logger.error({ err, req: { method: req.method, url: req.url } });
  
  res.status(status).json({
    success: false,
    error: { message, code: err.code }
  });
};
```

### 4. Retry with Exponential Backoff
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries) throw err;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
}
```

## Anti-Patterns
❌ Swallowing errors silently (`catch (e) {}`)
❌ Using generic error messages
❌ Throwing strings instead of Error objects
❌ No error logging/monitoring
❌ Mixing operational and programmer errors

## When to Use
This skill is applicable to execute the workflow or actions described in the overview.
