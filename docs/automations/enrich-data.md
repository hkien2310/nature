# QUY TRÌNH B: NÂNG CẤP DỮ LIỆU ĐÃ CÓ (Lệnh: "Làm giàu data")

Khi nhận được yêu cầu `"Làm giàu data"`, AI sẽ quét cơ sở dữ liệu để tìm 5 sinh vật có số lần làm giàu (`enrichment_count`) thấp nhất để bổ sung chi tiết khoa học mới.

### Script Được Phép Sử Dụng:
- `src/scripts/update-enrichment.js` — Cập nhật dữ liệu làm giàu vào database.

### Các Bước Thực Hiện:
1. **Tìm mục tiêu**: Gọi API để tìm 5 sinh vật có `enrichment_count` thấp nhất:
   ```bash
   curl -H "x-api-key: bioforce_secret_key_2026" https://nature-puce-two.vercel.app/api/admin/enrichment/targets
   ```
2. **Nghiên cứu nâng cấp sâu**: Với mỗi sinh vật trong danh sách 5 con được chọn, AI sẽ tìm hiểu sâu hơn trên Internet để bổ sung các dữ liệu khoa học chất lượng cao hơn, đặc biệt điền bổ sung đầy đủ 12 trường cấu trúc sinh học mới (diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g) nếu dòng dữ liệu cũ chưa có hoặc còn thiếu.
   - **Tập trung khai thác các đặc điểm mạnh mẽ và độc đáo của sinh vật**: Bổ sung chi tiết các vũ khí tự nhiên, cơ chế phòng thủ, phản xạ, tơ, hoặc các khả năng sinh học tiến hóa đặc biệt khác.
   - **Nhận diện nhiều điểm mạnh cùng lúc**: Một sinh vật không chỉ bị giới hạn ở một ưu thế đơn lẻ. Hãy nghiên cứu và đưa toàn bộ các điểm mạnh vượt trội của loài đó vào mảng `strengths`, `unique_traits` và các phần mô tả chi tiết liên quan.
   - Thêm các liên kết nguồn tham khảo khoa học uy tín (`sources`).
   - Mở rộng thêm đặc điểm sinh học cụ thể (`characteristics`, `survival_method`, `unique_traits`).
   - Bổ sung thêm các sự thật thú vị mới (`funFacts`) và các điểm mạnh/điểm yếu bổ trợ (`strengths`, `weaknesses`).
   - Tăng biến `enrichment_count` lên 1 đơn vị.
3. **Tạo file JSON nâng cấp**: Lưu mảng chứa thông tin của 5 sinh vật nâng cấp vào file tạm `src/scripts/temp-enrich.json`.
4. **Cập nhật database**: Chạy lệnh:
   ```bash
   node src/scripts/update-enrichment.js src/scripts/temp-enrich.json
   ```
5. **Dọn dẹp**: Xóa file tạm thời `src/scripts/temp-enrich.json` sau khi cập nhật xong.
6. **Báo cáo**: Hiển thị bảng tóm tắt 5 sinh vật vừa được nâng cấp cùng thông tin được cập nhật và chỉ số `enrichment_count` mới.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
