# QUY TRÌNH E: LÀM GIÀU ĐỐI THỦ (Lệnh: "Làm giàu đối thủ")

Khi nhận được yêu cầu `"Làm giàu đối thủ"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để nghiên cứu, thu thập và cập nhật thông số của các đối thủ (Opponents) vào hệ thống. Các đối thủ này sẽ đóng vai trò làm mốc sức mạnh (benchmarks) cho các kịch bản Scaling Gauntlet.

### Script Được Phép Sử Dụng:
- `src/scripts/update-opponents.js` — Nạp dữ liệu đối thủ vào database.

### Các Bước Thực Hiện:
1. **Nghiên cứu đối thủ mới**: AI tự động lên mạng tra cứu hoặc dùng kiến thức nội tại để chọn ra 3-5 đối thủ thú vị thuộc các hạng cân khác nhau (từ vài kg đến hàng ngàn tấn) và thuộc nhiều thể loại (động vật, máy móc, con người, vật thể tự nhiên).
2. **Thu thập thông số chuẩn xác**:
   - `name`: Tên đối thủ (VD: Chó Pitbull, Khỉ đột lưng bạc, Xe tăng M1 Abrams).
   - `type`: Thuộc loại `animal`, `machine`, `human`, hoặc `nature_force`.
   - `weight_kg`: Trọng lượng cơ thể (hoặc cỗ máy) tính bằng kg. Đây là thông số QUAN TRỌNG NHẤT dùng để scale.
   - `pull_force_kg`: Sức kéo tối đa (nếu có thông tin).
   - `punch_force_kg`: Lực đánh/đấm (nếu có).
   - `speed_kmh`: Tốc độ di chuyển tối đa.
   - `description`: Mô tả ngắn gọn về đối thủ và thông số sức mạnh của nó.
   - `image_url`: Có thể để trống hoặc điền URL ảnh tham khảo.
3. **Tạo file JSON tạm thời**: Lưu mảng dữ liệu đối thủ vào file `src/scripts/temp-opponents.json`.
4. **Nạp vào Database**: Chạy lệnh:
   ```bash
   node src/scripts/update-opponents.js src/scripts/temp-opponents.json
   ```
5. **Dọn dẹp và báo cáo**: Xóa file tạm thời `src/scripts/temp-opponents.json` và in bảng báo cáo kết quả tóm tắt gồm: Tên đối thủ, loại, và khối lượng (kg).

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- Đảm bảo thông số `weight_kg` là con số chính xác và thực tế.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
