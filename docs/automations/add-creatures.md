# QUY TRÌNH A: THÊM SINH VẬT MỚI (Lệnh: "Thêm sinh vật mới")

Khi nhận được yêu cầu `"Thêm sinh vật mới"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để tìm kiếm, nghiên cứu và cập nhật 3 sinh vật mới cùng lúc lên database Supabase.

### Script Được Phép Sử Dụng:
- `src/scripts/insert-creature.js` — Nạp sinh vật mới vào database.

### Các Bước Thực Hiện:
1. **Kiểm tra sinh vật hiện có**: Gọi API để lấy danh sách sinh vật đã tồn tại trong database (tránh trùng lặp):
   ```bash
   curl -H "x-api-key: bioforce_secret_key_2026" https://nature-puce-two.vercel.app/api/admin/creatures/list
   ```
2. **Chọn sinh vật mới**: Lựa chọn 3 sinh vật trong tự nhiên chưa có trong cơ sở dữ liệu. **Bắt buộc tập trung tìm kiếm các loài sở hữu những đặc điểm kì lạ, cơ chế sinh học độc đáo hoặc sức mạnh phi thường tiến hóa độc nhất vô nhị** (Ví dụ: Bọ ngựa với siêu phản xạ - "võ sĩ tự nhiên", Gấu nước Tardigrade siêu trâu bò chống chịu cực hạn, các sinh vật nhỏ nhưng có đặc điểm đặc biệt như lớp vỏ kitin giáp dày chịu lực, con hà với cơ chế sinh sản đặc biệt, dơi sử dụng sóng siêu thanh định vị, ngài sở hữu tơ cực chắc, châu chấu có đôi chân bật nhảy cực khỏe).
   - *Lưu ý quan trọng:* Một sinh vật có thể có một hoặc **nhiều đặc điểm mạnh mẽ/kỳ lạ cùng lúc** (Ví dụ: Tôm tít/tôm bọ ngựa vừa có cú đấm áp lực búa tạ vừa có lớp gai ở đuôi để tự vệ). AI cần thu thập và biểu diễn đầy đủ các đặc tính này.
3. **Nghiên cứu thông tin sinh học**: Nghiên cứu đầy đủ thông tin chuẩn khoa học của 3 sinh vật đó, bao gồm:
   - Các trường cơ bản (ID, tên tiếng Việt, tên khoa học, phân loại, kích thước thực tế, nọc độc, điểm mạnh/yếu, fun facts, nguồn tài liệu).
   - **Các trường sinh học cấu trúc bắt buộc**:
     - `diet_type`: `carnivore | herbivore | omnivore | detritivore | parasitic`
     - `diet_items`: mảng thức ăn cụ thể (ví dụ: `["cua", "cá nhỏ"]`)
     - `activity_pattern`: `diurnal | nocturnal | crepuscular | variable`
     - `lifespan_min`, `lifespan_max`: số nguyên tương ứng tuổi thọ
     - `lifespan_unit`: `years | months | days`
     - `reproduction_type`: `sexual | asexual | hermaphrodite | oviparous | viviparous`
     - `reproduction_notes`: tóm tắt cách thức đẻ trứng/sinh con hay chu kỳ sinh sản.
     - `locomotion`: `swim | walk | fly | crawl | burrow | hybrid`
     - `speed_max`: tốc độ di chuyển tối đa đo bằng đơn vị km/h (số thực).
     - `conservation_status`: `LC | NT | VU | EN | CR | EX` (theo chuẩn IUCN quốc tế)
     - `size_min_mm`, `size_max_mm`: kích thước cơ thể tối thiểu/tối đa đo bằng đơn vị milimet (mm) (số thực).
     - `weight_avg_g`: trọng lượng cơ thể trung bình đo bằng đơn vị gram (g) (số thực).
4. **Tạo file JSON tạm thời**: Lưu dữ liệu 3 sinh vật vừa nghiên cứu vào `src/scripts/temp-creatures.json` (dạng mảng JSON).
5. **Nạp vào Database**: Chạy script nạp dữ liệu:
   ```bash
   node src/scripts/insert-creature.js src/scripts/temp-creatures.json
   ```
6. **Dọn dẹp**: Xóa file tạm thời `src/scripts/temp-creatures.json` sau khi nạp xong.
7. **Báo cáo kết quả**: Thông báo cho người dùng biết các sinh vật nào đã được thêm thành công và tóm tắt nhanh chỉ số P4P ban đầu của chúng.

### ⛔ QUY TẮC TUYỆT ĐỐI
- **KHÔNG ĐƯỢC** tạo file script mới trong `src/scripts/`. Chỉ sử dụng đúng script đã liệt kê ở trên.
- **KHÔNG ĐƯỢC** tạo file round (ví dụ: `enrich-round-X.js`). Nếu vi phạm = BUG.
- File JSON tạm thời (`temp-*.json`) phải bị xóa sau khi push xong.
