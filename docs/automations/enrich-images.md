# QUY TRÌNH: LÀM GIÀU DỮ LIỆU ẢNH (Lệnh: "Làm giàu dữ liệu ảnh")

Khi nhận được yêu cầu `"Làm giàu dữ liệu ảnh"`, AI sẽ tự động tìm 1 sinh vật thiếu ảnh, sinh ra 5 tấm ảnh tả thực bằng công cụ AI, tải lên Cloudinary và cập nhật Database.

### Các Bước Thực Hiện:
1. **Tìm mục tiêu ưu tiên**: 
   - Gọi API GET tới: `http://localhost:3000/api/admin/cloudinary/targets`
   - Kèm theo header: `x-api-key: bioforce_secret_key_2026`
   - API này sẽ tự động phân tích Database và trả về 1 sinh vật (ưu tiên con có ít ảnh nhất. Nếu số ảnh bằng nhau, ưu tiên con có điểm `ai_p4p_score` cao nhất).
   - Đọc thông tin trả về (Tên, Ngoại hình, Đặc điểm) để làm nguyên liệu vẽ ảnh.

2. **Sinh ảnh (Generate Images)**: 
   - Sử dụng tool `generate_image` để vẽ ra **5 bức ảnh** khác nhau của sinh vật này.
   - **Phong cách bắt buộc (Art Style):** Tả thực (Realistic / National Geographic / Wildlife Photography).
   - Đảm bảo bối cảnh môi trường sống phù hợp với thông tin sinh học của sinh vật (ví dụ: rừng mưa nhiệt đới, sa mạc, dưới đáy đại dương...).
   - Đặt tên file logic, ví dụ: `[tên-sinh-vật]_01`, `[tên-sinh-vật]_02`...

3. **Upload ảnh lên Cloudinary**:
   - Sau khi tạo xong 5 ảnh, các ảnh sẽ được lưu trữ vật lý trong thư mục `artifacts` (workspace).
   - Sử dụng lệnh `curl` gửi từng file này lên API Upload của chúng ta. Chú ý truyền Header bảo mật. Ví dụ:
     ```bash
     curl -X POST http://localhost:3000/api/admin/cloudinary/upload \
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

5. **Báo cáo**: 
   - Thông báo cho người dùng biết sinh vật nào đã được thêm ảnh, và paste lại 5 mã `public_id` (hoặc URL ảnh) để người dùng kiểm tra trên giao diện Web.
