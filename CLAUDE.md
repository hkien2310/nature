# Claude Code / Opencode Instructions

> **Regular tasks:** Chạy `./scripts/ai-preflight.sh` → đọc `.ai-context.md` → bắt đầu.
> **Phase 0 / architecture:** Đọc `AGENTS.md` đầy đủ.
> File này chỉ chứa Claude-specific notes.

## How To Start
1. Chạy `./scripts/ai-preflight.sh` → Quick Context
2. Đọc `.ai-context.md` → Compact rules (51 dòng)
3. Đọc `tasks/layer-N-todo.md` → Task hiện tại
4. Nếu Phase 0 hoặc architecture → đọc thêm `AGENTS.md`

## Claude-Specific Notes
- Ưu tiên Sonnet cho regular tasks (feature, bugfix, test)
- Dùng Opus cho architecture decisions, complex refactors (>5 files)
- Dùng `ultrathink` hoặc extended thinking khi cần reasoning sâu
- Sub-directory `CLAUDE.md` cho rules cụ thể từng folder nếu cần
- Commit message: `feat/fix/test/chore: [mô tả ngắn]`

## Data Enrichment Tasks
- Chạy `"Thêm sinh vật mới"` để nghiên cứu và chèn 3 sinh vật mới hoàn toàn vào Supabase. Đọc [add-creatures.md](file:///Users/hoangkien/Youtube/svh/docs/automations/add-creatures.md).
- Chạy `"Làm giàu data"` để tự động nâng cấp chi tiết thông tin khoa học sâu cho 5 sinh vật ít được làm giàu nhất dựa trên cột `enrichment_count`. Đọc [enrich-data.md](file:///Users/hoangkien/Youtube/svh/docs/automations/enrich-data.md).
- Chạy `"Chấm điểm P4P"` để tự động hiệu chuẩn P4P và cập nhật xếp hạng cho 5 sinh vật. Đọc [grade-p4p.md](file:///Users/hoangkien/Youtube/svh/docs/automations/grade-p4p.md).
- Chạy `"Làm giàu What-If"` để tạo và cập nhật kịch bản câu hỏi/câu trả lời phóng to cơ thể cho 3 sinh vật có điểm P4P cao nhất và ít câu hỏi What-If nhất. Đọc [what-if.md](file:///Users/hoangkien/Youtube/svh/docs/automations/what-if.md).
- Chạy `"Làm giàu Ghép Gen"` để tự động cấy ghép gen của 3 sinh vật có điểm P4P cao nhất và chưa được cấy ghép vào cơ thể người. Đọc [human-splice.md](file:///Users/hoangkien/Youtube/svh/docs/automations/human-splice.md).

