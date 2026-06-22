# QUY TRÌNH TỰ ĐỘNG HÓA: LÀM GIÀU DATA (BIOFORCE ATLAS)

Dự án hỗ trợ 3 quy trình tự động hóa nạp/nâng cấp dữ liệu sinh vật thông qua các lệnh kích hoạt.

---

## QUY TRÌNH A: THÊM SINH VẬT MỚI (Lệnh: "Thêm sinh vật mới")

Khi nhận được yêu cầu `"Thêm sinh vật mới"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để tìm kiếm, nghiên cứu và cập nhật 3 sinh vật mới cùng lúc lên database Supabase.

### Các Bước Thực Hiện:
1. **Kiểm tra sinh vật hiện có**: Truy vấn bảng `creatures` từ Supabase bằng cách chạy đoạn mã test hoặc đọc file cấu hình tĩnh để biết những sinh vật nào đã tồn tại trong database (để tránh trùng lặp).
2. **Chọn sinh vật mới**: Lựa chọn 3 sinh vật trong tự nhiên chưa có trong cơ sở dữ liệu. **Bắt buộc tập trung tìm kiếm các loài sở hữu những đặc điểm kì lạ, cơ chế sinh học độc đáo hoặc sức mạnh phi thường tiến hóa độc nhất vô nhị** (Ví dụ: Khả năng bắn tia nước áp lực búa tạ của Tôm bọ ngựa, bắn bọt bong bóng plasma, phun axit/chất độc của Bọ cánh cứng Bombardier, bất tử sinh học của Sứa Hải Đăng, kháng phóng xạ/áp suất cực hạn của Gấu nước Tardigrade, khả năng phóng điện của Cá chình điện, hoặc tự tái sinh toàn bộ cơ thể của Kỳ giông Axolotl).
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
5. **Nạp vào Database**: Chạy script nạp lần lượt từng con bằng lệnh (hoặc sử dụng script hỗ trợ).
6. **Báo cáo kết quả**: Thông báo cho người dùng biết các sinh vật nào đã được thêm thành công và tóm tắt nhanh chỉ số P4P ban đầu của chúng.

---

## QUY TRÌNH B: NÂNG CẤP DỮ LIỆU ĐÃ CÓ (Lệnh: "Làm giàu data")

Khi nhận được yêu cầu `"Làm giàu data"`, AI sẽ quét cơ sở dữ liệu để tìm 5 sinh vật có số lần làm giàu (`enrichment_count`) thấp nhất để bổ sung chi tiết khoa học mới.

### Các Bước Thực Hiện:
1. **Tìm mục tiêu**: Chạy script để tìm 5 sinh vật có `enrichment_count` thấp nhất:
   ```bash
   node src/scripts/get-enrichment-targets.js
   ```
2. **Nghiên cứu nâng cấp sâu**: Với mỗi sinh vật trong danh sách 5 con được chọn, AI sẽ tìm hiểu sâu hơn trên Internet để bổ sung các dữ liệu khoa học chất lượng cao hơn, đặc biệt điền bổ sung đầy đủ 12 trường cấu trúc sinh học mới (diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g) nếu dòng dữ liệu cũ chưa có hoặc còn thiếu.
   - Thêm các liên kết nguồn tham khảo khoa học uy tín (`sources`).
   - Mở rộng thêm đặc điểm sinh học cụ thể (`characteristics`, `survival_method`, `unique_traits`).
   - Bổ sung thêm các sự thật thú vị mới (`funFacts`) và các điểm mạnh/điểm yếu bổ trợ (`strengths`, `weaknesses`).
   - Tăng biến `enrichment_count` lên 1 đơn vị.
3. **Tạo file JSON nâng cấp**: Lưu mảng chứa thông tin của 5 sinh vật nâng cấp vào file tạm `src/scripts/temp-enrich.json`.
4. **Cập nhật database**: Chạy lệnh:
   ```bash
   node src/scripts/update-enrichment.js src/scripts/temp-enrich.json
   ```
5. **Báo cáo**: Hiển thị bảng tóm tắt 5 sinh vật vừa được nâng cấp cùng thông tin được cập nhật và chỉ số `enrichment_count` mới.

---

## QUY TRÌNH C: TỰ ĐỘNG CHẤM ĐIỂM & HIỆU CHUẨN P4P (Lệnh: "Chấm điểm P4P")

Khi nhận được yêu cầu `"Chấm điểm P4P"`, AI (Antigravity) sẽ tự động thực hiện quy trình sau để chọn ra 5 sinh vật và chạy hiệu chuẩn điểm P4P khoa học.

### Các Bước Thực Hiện:
1. **Truy vấn 5 mục tiêu**: Quét database Supabase để lấy danh sách tất cả sinh vật, sắp xếp theo `grading_count` tăng dần và chọn ra 5 con ít được đánh giá nhất.
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

---

> [!IMPORTANT]
> **Yêu cầu Migration**: Bảng `creatures` trong Supabase cần có cột `enrichment_count` (`INTEGER DEFAULT 0 NOT NULL`), `grading_count` (`INTEGER DEFAULT 0 NOT NULL`), `ai_p4p_score` (`INTEGER DEFAULT 50 NOT NULL`), và `ai_tier` (`TEXT DEFAULT 'C' NOT NULL`). Ngoài ra cần tạo bảng `grading_history`. 
> Vui lòng chạy lệnh SQL trong file [schema.sql](file:///Users/hoangkien/Youtube/svh/src/scripts/schema.sql) để thực hiện cập nhật toàn bộ database.
