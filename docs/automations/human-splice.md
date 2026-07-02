# QUY TRÌNH E: LÀM GIÀU GHÉP GEN (Lệnh: "Làm giàu Ghép Gen")

Khi nhận được yêu cầu "Làm giàu Ghép Gen", AI (Antigravity) sẽ tự động thực hiện quy trình sau để nghiên cứu, thiết kế cơ chế lai ghép tế bào và cập nhật hồ sơ ghép gen người cho 3 sinh vật ưu tiên.

### Script Được Phép Sử Dụng:
- `src/scripts/update-human-splice.js` — Nạp dữ liệu ghép gen vào database.

### Các Bước Thực Hiện:
1. **Truy vấn 3 mục tiêu (Gọi API)**: Gọi API để xác định 3 sinh vật có số lượng gen ghép ít nhất và có điểm P4P cao nhất:
   ```bash
   curl -H "x-api-key: bioforce_secret_key_2026" https://nature-puce-two.vercel.app/api/admin/human-splice/targets
   ```
2. **Nghiên cứu cơ chế ghép gen người**: Với mỗi sinh vật mục tiêu, AI thiết lập một cơ chế ghép gen độc đáo của loài đó vào cơ thể người (ví dụ: ghép nọc poneratoxin của kiến đạn vào hệ thống cơ quan người, cấy lớp kitin gia cố chống đạn của bọ hung...). AI nghiên cứu sinh nội dung gồm:
   - **sci_fi_hype**: Mô tả bá đạo cường hóa sức mạnh kiểu Terra Formars.
   - **scientific_reality**: Phân tích khoa học thực tế (xương khớp người chịu lực ra sao, thích nghi sinh học chống thải ghép thế nào).
   - **spliced_stats**: Đánh giá chỉ số chiến đấu của người lai (sức mạnh, độ bền, tốc độ...).
   - **formulas_and_data**: Tính toán áp lực lực đấm, tốc độ, gia tốc và các công thức vật lý cơ học cụ thể.
3. **Tạo file JSON tạm thời**: Lưu dữ liệu 3 sinh vật cùng thông tin lai ghép vào `src/scripts/temp-human-splice.json`.
4. **Nạp vào Database**: Chạy lệnh:
   ```bash
   node src/scripts/update-human-splice.js src/scripts/temp-human-splice.json
   ```
5. **Dọn dẹp và báo cáo**: Xóa file tạm thời `src/scripts/temp-human-splice.json` và in bảng báo cáo kết quả tóm tắt gồm: Tên loài, tên gen ghép, sức mạnh/độ bền người lai sau khi ghép.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
