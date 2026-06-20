# Scope Breakdown — Dependency-Driven Layers

> Hướng dẫn cách phân tích scope → chia thành Dependency-Driven Layers.
> AI đọc file này khi cần tạo layers mới trong Phase 0.

---

## Concept

Thay vì 1 danh sách task dài, chia tasks theo **dependency graph**:

- **Layer 0 (Foundation):** Tasks không phụ thuộc vào nhau (DB setup, base API, auth, UI components)
- **Layer 1:** Tasks phụ thuộc vào Layer 0
- **Layer 2:** Tasks phụ thuộc vào Layer 1
- **Layer N:** Tạo tùy scope

```
Layer 0: [DB Setup] [Auth Setup] [UI Components] [Config]
              ↓           ↓            ↓
Layer 1: [User CRUD] [Auth Middleware] [Layout Components]
              ↓           ↓                  ↓
Layer 2: [Dashboard Page] [Profile Page] [Settings Page]
              ↓
Layer 3: [Analytics] [Export] [Notifications]
```

---

## Quy trình phân tích

### Bước 1: List tất cả features
Từ design spec (`docs/specs/`), liệt kê tất cả features/tasks cần implement.

### Bước 2: Map dependencies
Với mỗi feature, hỏi: "Feature này CẦN gì đã sẵn sàng trước?"

```
Feature: User Dashboard
  Needs: User CRUD API ✅ → Layer 1
  Needs: Auth middleware ✅ → Layer 1  
  Needs: Layout components ✅ → Layer 1
  → Dashboard thuộc Layer 2
```

### Bước 3: Group thành Layers

| Layer | Đặc điểm | Ví dụ |
|-------|----------|-------|
| **Layer 0** | Không dependency, foundation | DB schema, env config, base components |
| **Layer 1** | Depends on Layer 0 | CRUD APIs, auth, reusable UI |
| **Layer 2** | Depends on Layer 1 | Pages, workflows |
| **Layer 3+** | Depends on Layer 2+ | Advanced features, integrations |

### Bước 4: Tạo layer files
- `tasks/layer-0-todo.md` → `tasks/layer-1-todo.md` → ...
- Mỗi file chứa tasks **độc lập trong cùng layer**
- Xem format mẫu tại `tasks/layer-0-todo.md`

---

## Quy tắc vàng

- ✅ Số layer **phụ thuộc vào scope** — không cố định (2-6 layers là phổ biến)
- ✅ Tasks trong cùng layer **có thể làm parallel** (không depend nhau)
- ✅ Layer N xong **100%** → mới bắt đầu Layer N+1
- ✅ Mỗi task xong → commit ngay, update status
- ❌ **KHÔNG** nhảy cóc layer — dù task có vẻ đơn giản
- ❌ **KHÔNG** tạo quá nhiều layer — keep simple

---

## Ví dụ: Typical Web App

```
Layer 0 — Foundation (5 tasks, parallel)
  ├── 0.1 Database schema + migrations
  ├── 0.2 Express/Fastify server setup
  ├── 0.3 React project setup + routing
  ├── 0.4 Auth provider setup (Firebase/Clerk/custom)
  └── 0.5 Environment config + .env

Layer 1 — Core APIs + Components (6 tasks, parallel)
  ├── 1.1 User CRUD API
  ├── 1.2 Auth middleware + protected routes
  ├── 1.3 Base UI components (Button, Input, Card, Modal)
  ├── 1.4 Layout component (Header, Sidebar, Footer)
  ├── 1.5 API client setup (Axios/fetch wrapper)
  └── 1.6 Form validation (Zod/Yup schemas)

Layer 2 — Features (4 tasks, parallel)
  ├── 2.1 Dashboard page
  ├── 2.2 Profile page + settings
  ├── 2.3 [Feature-specific page 1]
  └── 2.4 [Feature-specific page 2]

Layer 3 — Polish + Integration (3 tasks, parallel)
  ├── 3.1 E2E tests
  ├── 3.2 Error boundaries + loading states
  └── 3.3 Performance optimization
```
