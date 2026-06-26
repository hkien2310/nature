# QUY TRÌNH C: TỰ ĐỘNG CHẤM ĐIỂM & HIỆU CHUẨN P4P (Lệnh: "Chấm điểm P4P")

Khi nhận được yêu cầu `"Chấm điểm P4P"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để chọn ra 5 sinh vật và chạy hiệu chuẩn điểm P4P khoa học.

### Các Bước Thực Hiện:
1. **Truy vấn 5 mục tiêu (Gọi API)**: Gửi yêu cầu GET tới API `/api/admin/grade/targets` để xác định chính xác nhóm 5 sinh vật tối ưu cần chấm điểm tiếp theo. Thuật toán sẽ tự động chọn 1 sinh vật ưu tiên cao làm Trọng tâm (Anchor), tìm các sinh vật có lực tương đồng để so sánh chéo, loại trừ các cặp đấu bị trùng lặp gần đây, và pha trộn 25% tỷ lệ ngẫu nhiên khám phá nhằm tối đa hóa lượng thông tin.
2. **Chấm điểm theo tiêu chí khoa học**:
   - **RMD**: Relative Muscle Density (Mật độ cơ bắp/Ngoại cốt cấu trúc - thang 1-100).
   - **IAW**: Impact Acceleration & Weaponry Efficiency (Gia tốc đòn đánh và Hiệu suất vũ khí - thang 1-100).
   - **MRL**: Maneuverability & Reflex Latency (Độ cơ động và Phản xạ - thang 1-100).
   - **MEG**: Metabolic Efficiency & Genetic Adaptations (Hiệu suất trao đổi chất và Thích nghi gen - thang 1-100).
   - **SRN**: Sensory Resolution & Neural Processing (Độ phân giải giác quan và Tốc độ xử lý thần kinh - thang 1-100).
3. **Lưu lịch sử và cập nhật**:
   - Tính tổng điểm P4P trung bình và xếp Tier (`S | A | B | C | D`).
   - Tăng `grading_count` thêm 1.
   - Thực hiện lưu dữ liệu chấm điểm vào bảng `grading_history` và cập nhật thông tin trong bảng `creatures` của Supabase.
4. **Báo cáo kết quả**: Hiển thị bảng kết quả chấm chi tiết của 5 loài vừa được hiệu chuẩn, đồng thời phân tích chỉ ra các loài đang bị đánh giá quá cao (Overrated) hoặc quá thấp (Underrated) dựa trên điểm bình chọn của cộng đồng.
