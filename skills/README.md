# Skills Directory

> Chứa các AI Skills — bộ quy tắc chuyên biệt mà AI tự động kích hoạt khi gặp task phù hợp.

## Quy tắc ưu tiên (QUAN TRỌNG)

```
Template Skills (./skills/) > Global Skills (~/.gemini/antigravity/skills/)
```

- Nếu cùng 1 skill tồn tại ở cả template lẫn global → **dùng bản trong template**.
- Template skills đã được tuỳ chỉnh cho project cụ thể, không dùng bản global.

---

## Skills có sẵn trong Template

| Skill | Mục đích | Khi nào dùng |
|-------|----------|-------------|
| `brainstorming` | Biến ý tưởng mơ hồ thành thiết kế cụ thể | Trước khi code feature mới, thiết kế architecture |
| `concise-planning` | Tạo checklist hành động rõ ràng | Khi user yêu cầu lên kế hoạch cho task |
| `error-handling-patterns` | Xử lý lỗi chuyên nghiệp | Khi viết async functions, API calls, database operations |
| `testing-patterns` | Jest patterns, TDD workflow | Khi viết unit tests, integration tests |
| `documentation-templates` | README, API docs, code comments | Khi viết documentation cho project |
| `ui-ux-pro-max` | Design system generator (161 industries, 67 styles) | Khi build UI/UX: landing pages, dashboards, apps |
| `git-workflow` | Conventional commits, branching, PR process | Khi commit, tạo branch, merge, PR |
| `security-best-practices` | OWASP Top 10, auth, CORS, secrets | Khi viết auth, input validation, deploy production |
| `api-design` | REST/GraphQL/tRPC, response formats, pagination | Khi thiết kế API endpoints, integration layer |
| `database-design` | Schema design, indexing, ORM, migrations | Khi thiết kế schema, chọn database, viết queries |

## Thêm skill mới

Tạo folder mới trong `skills/` với cấu trúc:
```
skills/
  my-skill/
    SKILL.md          # (bắt buộc) Instructions
    scripts/           # (tuỳ chọn) Helper scripts
    data/              # (tuỳ chọn) Reference data
```

File `SKILL.md` cần có YAML frontmatter:
```yaml
---
name: my-skill
description: "Mô tả ngắn gọn"
---
```
