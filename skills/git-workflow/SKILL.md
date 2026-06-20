---
name: git-workflow
description: "Git best practices: conventional commits, branch naming, PR process, merge strategies."
---

# Git Workflow

> Quy tắc git cho project. AI đọc trước khi commit, tạo branch, hoặc review PR.

## Conventional Commits (BẮT BUỘC)

```
<type>: <description>

type = feat | fix | test | chore | docs | refactor | style | perf
```

**Ví dụ:**
```
feat: add user login API
fix: resolve null pointer in dashboard
test: add unit tests for auth middleware
chore: update dependencies
docs: add API documentation
refactor: extract validation logic to service
```

**Quy tắc:**
- Viết bằng tiếng Anh, lowercase
- Không kết thúc bằng dấu chấm
- Tối đa 72 ký tự
- 1 commit = 1 task/change — không gộp nhiều thay đổi

## Branch Naming

```
<type>/<short-description>

Ví dụ:
feat/user-authentication
fix/dashboard-crash
chore/update-deps
```

## Branch Strategy

```
main          ← Production (protected)
  └── develop ← Integration
       ├── feat/user-auth
       ├── fix/login-bug
       └── chore/update-deps
```

- **main:** Production-ready, chỉ merge từ develop qua PR
- **develop:** Integration branch, merge features vào đây
- **feature/fix branches:** Tạo từ develop, merge lại develop

> Nếu project nhỏ (1 dev): có thể commit thẳng vào main. Tạo develop khi cần.

## PR Process

1. Tạo branch từ develop
2. Code + test + commit
3. Push + tạo PR vào develop
4. CI checks pass → review → merge
5. Delete branch sau khi merge

## Merge Strategies

| Strategy | Khi nào |
|----------|---------|
| **Squash merge** | Feature branches → develop (gộp commits) |
| **Merge commit** | develop → main (giữ history) |
| **Rebase** | Update feature branch với develop mới nhất |

## Anti-Patterns

❌ Commit message mơ hồ: "fix bug", "update", "wip"
❌ Commit quá nhiều thay đổi trong 1 commit
❌ Push trực tiếp vào main (trừ project nhỏ)
❌ Merge conflict tự resolve không hỏi team
❌ Để branch sống quá lâu (> 3 ngày)
