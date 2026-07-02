# QUY TRÌNH: LÀM GIÀU DỮ LIỆU ẢNH (Lệnh: "Làm giàu dữ liệu ảnh")

Khi nhận được yêu cầu `"Làm giàu dữ liệu ảnh"`, AI sẽ tự động tìm 1 sinh vật thiếu ảnh, sinh ra 5 tấm ảnh tả thực bằng công cụ AI, tải lên Cloudinary và cập nhật Database.

### Script Được Phép Sử Dụng:
- `src/scripts/update-images.js` — Cập nhật public_id ảnh vào database.

### Các Bước Thực Hiện:
1. **Tìm mục tiêu ưu tiên**: 
   - Gọi API GET tới: `https://nature-puce-two.vercel.app/api/admin/cloudinary/targets`
   - Kèm theo header: `x-api-key: bioforce_secret_key_2026`
   - API này sẽ tự động phân tích Database và trả về 1 sinh vật (ưu tiên con có ít ảnh nhất. Nếu số ảnh bằng nhau, ưu tiên con có điểm `ai_p4p_score` cao nhất).
   - Đọc thông tin trả về (Tên, Ngoại hình, Đặc điểm) để làm nguyên liệu vẽ ảnh.

2. **Sinh ảnh (Generate Images)**: 
   - Sử dụng tool `generate_image` để vẽ ra **5 bức ảnh** khác nhau của sinh vật này.
   - **Góc độ bắt buộc (Angles):** 5 ảnh tạo ra bắt buộc phải ở 5 góc độ/phối cảnh khác nhau (Ví dụ: Cận cảnh khuôn mặt, Chụp từ trên xuống, Góc nghiêng khi bay/di chuyển, Góc thấp từ dưới lên, và Góc ngang tầm mắt). Không tạo 5 ảnh trùng lặp về bố cục.
   - **Phong cách bắt buộc (Art Style):** Tả thực (Realistic / National Geographic / Wildlife Photography).
   - Đảm bảo bối cảnh môi trường sống phù hợp với thông tin sinh học của sinh vật (ví dụ: rừng mưa nhiệt đới, sa mạc, dưới đáy đại dương...).
   - Đặt tên file logic, ví dụ: `[tên-sinh-vật]_01`, `[tên-sinh-vật]_02`...

3. **Upload ảnh lên Cloudinary**:
   - Sau khi tạo xong 5 ảnh, các ảnh sẽ được lưu trữ vật lý trong thư mục `artifacts` (workspace).
   - Sử dụng lệnh `curl` gửi từng file này lên API Upload của chúng ta. Chú ý truyền Header bảo mật. Ví dụ:
     ```bash
     curl -X POST https://nature-puce-two.vercel.app/api/admin/cloudinary/upload \
       -H "x-api-key: bioforce_secret_key_2026" \
       -F "file=@/đường/dẫn/tuyệt/đối/tới/file_ảnh_01.png" \
       -F "folder=creatures"
     ```
   - Trích xuất 5 mã `public_id` từ kết quả JSON trả về.

4. **Cập nhật Database**:
   - Sử dụng script cập nhật dữ liệu để gắn 5 mã `public_id` vào Database Supabase.
   - Chạy lệnh:
     ```bash
     node src/scripts/update-images.js [ID_sinh_vật] "[public_id_1],[public_id_2],[public_id_3],[public_id_4],[public_id_5]"
     ```

5. **Dọn dẹp file ảnh**:
   - Sau khi upload và cập nhật database thành công, **bắt buộc xóa toàn bộ 5 file ảnh** đã tạo trong thư mục `artifacts`.
   - Chạy lệnh xóa từng file hoặc dùng wildcard:
     ```bash
     rm /đường/dẫn/tuyệt/đối/tới/[tên-sinh-vật]_0*.png
     ```

6. **Báo cáo**: 
   - Thông báo cho người dùng biết sinh vật nào đã được thêm ảnh, và paste lại 5 mã `public_id` (hoặc URL ảnh) để người dùng kiểm tra trên giao diện Web.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
