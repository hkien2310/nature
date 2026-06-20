# Monitoring Guide

> Setup monitoring cho production.
> Tối thiểu: Sentry (error tracking). Nâng cao: Prometheus + Grafana (metrics).

---

## 1. Sentry — Error Tracking (Bắt buộc)

### Setup

1. Tạo account: https://sentry.io
2. Tạo project (chọn platform: Node.js hoặc React)
3. Lấy DSN → `.env`:
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

### Node.js Backend

```bash
npm install @sentry/node
```

```typescript
// src/instrument.ts — import TRƯỚC mọi thứ khác
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
});
```

```typescript
// src/index.ts
import './instrument'; // PHẢI là import đầu tiên
import express from 'express';

const app = express();

// ... routes ...

// Sentry error handler — PHẢI đặt SAU tất cả routes
Sentry.setupExpressErrorHandler(app);
```

### React Frontend

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx — import TRƯỚC mọi thứ khác
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
});
```

### Source Maps (Production)

```bash
npm install @sentry/cli --save-dev
```

Thêm vào build script:
```json
{
  "scripts": {
    "build": "vite build",
    "sentry:sourcemaps": "sentry-cli sourcemaps inject --org [org] --project [project] ./dist && sentry-cli sourcemaps upload --org [org] --project [project] ./dist"
  }
}
```

---

## 2. Prometheus + Grafana — Metrics (Optional)

### Quick Start

```bash
docker-compose -f docker-compose.monitoring.yml up -d

# Access:
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000 (admin/admin)
```

### Node.js Metrics

```bash
npm install prom-client
```

```typescript
// src/metrics.ts
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});
```

```typescript
// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboard

1. Login Grafana → Add Data Source → Prometheus → `http://prometheus:9090`
2. Import dashboard hoặc tạo mới
3. Key panels:
   - Request rate: `rate(http_requests_total[5m])`
   - P95 latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Error rate: `rate(http_requests_total{status=~"5.."}[5m])`

---

## 3. Production Checklist

- [ ] Sentry DSN configured
- [ ] Source maps uploaded
- [ ] Alert rules set (Sentry: error spike, Grafana: latency threshold)
- [ ] Dashboard shared with team
- [ ] tracesSampleRate tuned (0.1-0.3 cho production)
