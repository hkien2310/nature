---
name: database-design
description: "Database design principles: schema design, indexing strategy, ORM selection, migrations, query optimization."
---

# Database Design

> AI đọc trước khi thiết kế schema, chọn database, hoặc viết queries.
> **Learn to THINK, not copy SQL patterns.**

## Decision Checklist

- [ ] Hỏi user về database preference?
- [ ] Chọn database phù hợp context?
- [ ] Xem xét deployment environment?
- [ ] Planned index strategy?
- [ ] Defined relationship types?

## Database Selection

| Database | Best For | Avoid When |
|----------|----------|------------|
| **PostgreSQL** | Complex queries, ACID, relations | Simple key-value, embedded apps |
| **MongoDB** | Flexible schema, documents, rapid prototyping | Complex joins, strict ACID |
| **SQLite** | Embedded, dev/test, small apps, edge | High concurrency, multi-server |
| **Neon/PlanetScale** | Serverless, auto-scaling, hobby | Self-hosted preference |

> **Default:** PostgreSQL — trừ khi project nhỏ (SQLite) hoặc cần flexible schema (MongoDB).

## ORM Selection

| ORM | Best For | Trade-off |
|-----|----------|-----------|
| **Prisma** | TypeScript, type-safety, migrations | Heavier, less raw SQL control |
| **Drizzle** | Lightweight, SQL-like, edge runtime | Newer ecosystem |
| **TypeORM** | Enterprise patterns, decorators | Complex config |
| **Knex** | Query builder, raw SQL flexibility | No type generation |

## Schema Design Principles

### Naming Convention
```sql
-- Table: plural, snake_case
CREATE TABLE users (...);
CREATE TABLE order_items (...);

-- Column: snake_case
user_id, created_at, is_active

-- Index: idx_{table}_{columns}
CREATE INDEX idx_users_email ON users(email);
```

### Required Columns (mọi table)
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
```

### Relationships
```
1:1  → Foreign key trên bảng "child"
1:N  → Foreign key trên bảng "many"  
M:N  → Junction table (user_roles, order_products)
```

## Indexing Strategy

```sql
-- ✅ Index foreign keys (BẮT BUỘC)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ✅ Index columns dùng trong WHERE/ORDER BY thường xuyên
CREATE INDEX idx_users_email ON users(email);

-- ✅ Composite index cho queries dùng nhiều columns
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- ❌ KHÔNG index columns ít khi query
-- ❌ KHÔNG index columns có quá ít distinct values (boolean)
```

## Migration Best Practices

```bash
# Tạo migration
npx prisma migrate dev --name add_user_roles

# Rules:
# - 1 migration = 1 logical change
# - Migration name mô tả rõ: add_user_roles, remove_legacy_column
# - KHÔNG sửa migration đã chạy trên production
# - Backup trước khi migrate production
```

## Query Optimization

```typescript
// ❌ N+1 Problem
const users = await db.user.findMany();
for (const user of users) {
  const orders = await db.order.findMany({ where: { userId: user.id } });
}

// ✅ Eager loading
const users = await db.user.findMany({
  include: { orders: true },
});

// ✅ Select only needed fields
const users = await db.user.findMany({
  select: { id: true, name: true, email: true },
});
```

## Anti-Patterns

❌ Default PostgreSQL cho simple apps (SQLite có thể đủ)
❌ Skip indexing cho foreign keys
❌ Dùng `SELECT *` trong production
❌ Store JSON khi structured data phù hợp hơn
❌ Ignore N+1 queries
❌ Sửa migration đã chạy trên production
❌ Không có `created_at` / `updated_at`
