# QUY TRÌNH C: TỰ ĐỘNG CHẤM ĐIỂM & HIỆU CHUẨN P4P (Lệnh: "Chấm điểm P4P")

Khi nhận được yêu cầu `"Chấm điểm P4P"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để chọn ra 5 sinh vật và chạy hiệu chuẩn điểm P4P khoa học.

### Script Được Phép Sử Dụng:
- `src/scripts/grade-p4p.js` — Script all-in-one: tự động truy vấn mục tiêu, chấm điểm, lưu lịch sử và cập nhật database.

### Các Bước Thực Hiện:
1. **Chạy script all-in-one**: Script `grade-p4p.js` sẽ tự động xử lý toàn bộ quy trình (truy vấn 5 mục tiêu, chấm điểm, lưu lịch sử, cập nhật database):
   ```bash
   node src/scripts/grade-p4p.js
   ```
2. **Tiêu chí chấm điểm khoa học** (được áp dụng bên trong script):
   - **RMD**: Relative Muscle Density (Mật độ cơ bắp/Ngoại cốt cấu trúc - thang 1-100).
   - **IAW**: Impact Acceleration & Weaponry Efficiency (Gia tốc đòn đánh và Hiệu suất vũ khí - thang 1-100).
   - **MRL**: Maneuverability & Reflex Latency (Độ cơ động và Phản xạ - thang 1-100).
   - **MEG**: Metabolic Efficiency & Genetic Adaptations (Hiệu suất trao đổi chất và Thích nghi gen - thang 1-100).
   - **SRN**: Sensory Resolution & Neural Processing (Độ phân giải giác quan và Tốc độ xử lý thần kinh - thang 1-100).
3. **Kết quả xử lý bên trong script**:
   - Tính tổng điểm P4P trung bình và xếp Tier (`S | A | B | C | D`).
   - Tăng `grading_count` thêm 1.
   - Thực hiện lưu dữ liệu chấm điểm vào bảng `grading_history` và cập nhật thông tin trong bảng `creatures` của Supabase.
4. **Báo cáo kết quả**: Hiển thị bảng kết quả chấm chi tiết của 5 loài vừa được hiệu chuẩn, đồng thời phân tích chỉ ra các loài đang bị đánh giá quá cao (Overrated) hoặc quá thấp (Underrated) dựa trên điểm bình chọn của cộng đồng.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
