# 🚀 Onboarding — Đọc File Này Trước

> Dù bạn là human developer hay AI agent, file này cho bạn biết đọc gì, ở đâu, theo thứ tự nào.

---

## Cho Human Developers

### Bước 1: Hiểu project (10 phút)
1. **`docs/BRIEF.md`** — Project là gì, giải quyết vấn đề gì, user là ai
2. **`docs/ARCHITECTURE.md`** — Kiến trúc kỹ thuật, tech stack, data flow
3. **`docs/decisions/`** — Tại sao chọn tech stack này (đọc lướt)

### Bước 2: Hiểu context hiện tại (5 phút)
4. **`docs/knowledge/INDEX.md`** — Team đã học được gì, tránh lỗi gì
5. **`tasks/todo.md`** — Đang ở phase nào, task nào cần làm

### Bước 3: Setup local (10 phút)
6. Copy `.env.example` → `.env` và điền values
7. `npm install` → `npm run dev`
8. Pick task từ `tasks/todo.md`

### Bước 4: Bắt đầu contribute
- Đọc `AGENTS.md` → "Coding Rules" section
- Làm theo task format trong `tasks/todo.md`
- Commit: `feat/fix/test/chore: [mô tả]`

---

## Cho AI Agents

AI agents tự động đọc file config tương ứng:
- **Claude Code / Opencode:** `CLAUDE.md` → `AGENTS.md`
- **Cursor:** `.cursorrules` → `AGENTS.md`
- **Windsurf:** `.windsurfrules` → `AGENTS.md`
- **Codex:** `AGENTS.md` (trực tiếp)
- **GitHub Copilot:** `.github/copilot-instructions.md` → `AGENTS.md`

Nếu AI chưa đọc, prompt: **"Đọc AGENTS.md và follow instructions."**



## Project Structure Overview

```
├── AGENTS.md              ← AI đọc đầu tiên
├── docs/
│   ├── BRIEF.md           ← Project là gì
│   ├── ARCHITECTURE.md    ← Xây thế nào
│   ├── decisions/         ← Tại sao chọn X
│   ├── knowledge/         ← Lessons learned
│   ├── specs/             ← Design docs
│   └── phases/            ← Phase definitions
├── tasks/                 ← Task tracking
├── memory/                ← Private session logs
├── src/                   ← Source code
└── tests/                 ← Test suites
```
