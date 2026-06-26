# DANH SÁCH QUY TRÌNH TỰ ĐỘNG HÓA (BIOFORCE ATLAS)

Tài liệu hướng dẫn chi tiết các tác vụ tự động hóa nạp/nâng cấp dữ liệu sinh vật trong dự án đã được phân tách thành từng file riêng biệt dưới đây để tối ưu hóa tokens:

- **[QUY TRÌNH A] Thêm sinh vật mới** (Lệnh: `"Thêm sinh vật mới"`): Xem hướng dẫn tại [add-creatures.md](file:///Users/hoangkien/Youtube/svh/docs/automations/add-creatures.md)
- **[QUY TRÌNH B] Làm giàu data** (Lệnh: `"Làm giàu data"`): Xem hướng dẫn tại [enrich-data.md](file:///Users/hoangkien/Youtube/svh/docs/automations/enrich-data.md)
- **[QUY TRÌNH C] Chấm điểm P4P** (Lệnh: `"Chấm điểm P4P"`): Xem hướng dẫn tại [grade-p4p.md](file:///Users/hoangkien/Youtube/svh/docs/automations/grade-p4p.md)
- **[QUY TRÌNH D] Làm giàu What-If** (Lệnh: `"Làm giàu What-If"`): Xem hướng dẫn tại [what-if.md](file:///Users/hoangkien/Youtube/svh/docs/automations/what-if.md)
- **[QUY TRÌNH E] Làm giàu Ghép Gen** (Lệnh: `"Làm giàu Ghép Gen"`): Xem hướng dẫn tại [human-splice.md](file:///Users/hoangkien/Youtube/svh/docs/automations/human-splice.md)

---

> [!IMPORTANT]
> **Yêu cầu Migration**: Bảng `creatures` trong Supabase cần có cột `enrichment_count` (`INTEGER DEFAULT 0 NOT NULL`), `grading_count` (`INTEGER DEFAULT 0 NOT NULL`), `ai_p4p_score` (`INTEGER DEFAULT 50 NOT NULL`), và `ai_tier` (`TEXT DEFAULT 'C' NOT NULL`). Ngoài ra cần tạo các bảng: `grading_history`, `what_if_questions`, `what_if_answers`, và `human_splices`.
> Vui lòng chạy các lệnh SQL trong file [schema.sql](file:///Users/hoangkien/Youtube/svh/src/scripts/schema.sql) để thực hiện cập nhật toàn bộ database.
