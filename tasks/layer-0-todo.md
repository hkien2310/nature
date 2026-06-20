# Layer 0 — Foundation

> Tasks không phụ thuộc vào nhau. Có thể làm **parallel**.
> Chỉ khi Layer 0 hoàn toàn xong → mới tạo và bắt đầu Layer 1.

---

## Quy tắc

- ✅ Tất cả tasks trong layer này **độc lập** — không phụ thuộc nhau
- ✅ Có thể làm **song song** (parallel) nếu muốn
- ✅ Mỗi task xong → commit ngay: `feat/fix/test/chore: [mô tả]`
- ✅ Khi **TẤT CẢ** tasks Done → tạo `tasks/layer-1-todo.md` cho layer tiếp theo
- ❌ KHÔNG được bắt đầu Layer 1 khi Layer 0 chưa xong 100%

---

## Tasks

| ID | Task | Status | Commit |
|----|------|--------|--------|
| 0.1 | [Điền sau Phase 0] | ⬜ | - |

<!-- 
Status: ⬜ Todo | 🔄 In Progress | ✅ Done
Thêm task: copy row, tăng ID

Khi tất cả tasks Done:
1. Move tasks sang tasks/done.md (dưới "## Layer 0")
2. Tạo tasks/layer-1-todo.md (copy format này, đổi header)
3. Update AGENTS.md → Current Layer = 1
-->

---

## Tạo Layer Tiếp Theo

Khi tất cả tasks ở trên đều ✅ Done:

1. **Move completed tasks** → `tasks/done.md` (section Layer 0)
2. **Phân tích dependency** cho features tiếp theo (xem `docs/SCOPE_BREAKDOWN.md`)
3. **Tạo file mới:** `tasks/layer-1-todo.md` — copy format này, thay header
4. **Update `AGENTS.md`** → Current Layer = 1
5. **Commit:** `chore: complete layer 0, start layer 1`
