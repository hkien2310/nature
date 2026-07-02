# QUY TRÌNH D: LÀM GIÀU WHAT-IF (Lệnh: "Làm giàu What-If")

Khi nhận được yêu cầu `"Làm giàu What-If"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để nghiên cứu, xây dựng công thức vật lý và cập nhật kịch bản What-If cho 3 sinh vật ưu tiên.

### Script Được Phép Sử Dụng:
- `src/scripts/update-what-if.js` — Nạp dữ liệu What-If vào database.

### Các Bước Thực Hiện:
1. **Truy vấn 3 mục tiêu (Gọi API)**: Gọi API để xác định 3 sinh vật có số lượng câu hỏi What-If ít nhất và có điểm P4P cao nhất:
   ```bash
   curl -H "x-api-key: bioforce_secret_key_2026" https://nature-puce-two.vercel.app/api/admin/what-if/targets
   ```
2. **Nghiên cứu sinh kịch bản khoa học**: Với mỗi sinh vật mục tiêu, AI thiết lập một câu hỏi giả thuyết phóng to cơ thể sinh vật lên kích thước con người (80kg hoặc kích cỡ phù hợp khác) và nghiên cứu sinh ra ít nhất 2 câu trả lời tương ứng với các góc nhìn khoa học khác nhau:
   - **classic_scaling** (Phóng to cơ học lý thuyết): Thổi phồng sức mạnh bằng cách áp dụng công thức tỉ lệ thuận cơ học (lực đấm, tốc độ, gia tốc).
   - **biological_reality** (Giới hạn sinh học thực tế): Phân tích giới hạn thực tế theo định luật bình phương - lập phương (sự sụp đổ cấu trúc xương/vỏ, sự ngột ngạt hô hấp, áp suất tim).
   - **evolutionary_mutation** (Đột biến thích nghi - nếu có): Giả thuyết các đột biến sinh học cần thiết để sinh vật sinh tồn và chiến đấu được ở kích thước mới.
   *Yêu cầu*: Trong các câu trả lời bắt buộc tính toán số liệu cụ thể và điền công thức vật lý/sinh học vào trường `formulas_and_data`.
3. **Tạo file JSON tạm thời**: Lưu mảng dữ liệu 3 sinh vật cùng câu hỏi & câu trả lời giả thuyết vào `src/scripts/temp-what-if.json`.
4. **Nạp vào Database**: Chạy lệnh:
   ```bash
   node src/scripts/update-what-if.js src/scripts/temp-what-if.json
   ```
5. **Dọn dẹp và báo cáo**: Xóa file tạm thời `src/scripts/temp-what-if.json` và in bảng báo cáo kết quả tóm tắt gồm: Tên loài, câu hỏi, điểm P4P giả thuyết, và xếp hạng Tier giả thuyết của từng góc nhìn.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
