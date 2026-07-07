# QUY TRÌNH F: LÀM GIÀU GAUNTLET (Lệnh: "Làm giàu Gauntlet")

Khi nhận được yêu cầu `"Làm giàu Gauntlet"` cho một sinh vật (ví dụ: Bọ hung, Tôm gõ mõ, Bọ chét), AI sẽ xây dựng một thử thách leo tháp (Gauntlet) đối chiếu sức mạnh của sinh vật đó với các mốc sức mạnh (benchmarks) thực tế.

### Script Được Phép Sử Dụng:
- `src/scripts/get-creatures.js` — Lấy danh sách sinh vật hiện có trong DB (để tra cứu ID).
- `src/scripts/update-what-if.js` — Bản chất Gauntlet vẫn là một What-If, chúng ta dùng chung script của What-If để lưu trữ.

**LƯU Ý QUAN TRỌNG CHO AI**: TUYỆT ĐỐI KHÔNG tự viết các file script (`.js`) nháp để kết nối vào Database. Nếu cần lấy thông tin, CHỈ sử dụng các script đã có sẵn ở trên. Việc tự viết script sẽ gây lỗi sai đường dẫn file `.env.local`!

### Các Bước Thực Hiện:
1. **Chọn loại Gauntlet & Mốc so sánh (Benchmarks 3 Tầng)**:
   - **Xác định THẾ MẠNH ĐẶC TRƯNG** nhất của sinh vật (ví dụ: lực đấm, lực kéo, sức bật nhảy, tốc độ, độ cứng).
   - **Quy tắc chọn Benchmark 3 Tầng**: Dựa vào thế mạnh, AI tự chọn 3 mốc so sánh sao cho:
     - **Gắn liền thực tế**: Phải là thứ người ta có thể nhìn thấy hoặc hình dung ngay lập tức — sinh vật quen thuộc, phương tiện đời thường, hiện tượng tự nhiên. Người đọc vừa nghe tên là biết ngay nó "to cỡ nào" hay "mạnh cỡ nào". KHÔNG dùng tên kỹ thuật hay thứ phải Google mới hiểu.
     - **FLOW thăng tiến**: 3 đối thủ mạnh dần theo thứ tự (Tầng 1: Đáng nể → Tầng 2: Khủng → Tầng 3: Tối thượng).
     - **KHÔNG DÙNG DATABASE**: Tự do suy luận hoàn toàn, không bám vào danh sách cố định nào.

2. **Logic Scaling (Vật Lý Thuần Túy — Bắt Buộc)**:

   **Nguyên tắc cốt lõi**: Ở mỗi Tầng, sinh vật được phóng to lên đến một **kích thước trung gian cụ thể** (nhỏ hơn đối thủ để giữ yếu tố bất ngờ), sau đó sức mạnh mới được tính lại theo vật lý và đem đọ với đối thủ ở **kích thước thực** của nó.

   **Công thức (3 bước bắt buộc):**
   - Bước 1: Chọn `size_mới` cụ thể cho sinh vật ở tầng đó (ví dụ "bằng nắm tay" = 0.08m, "bằng con mèo" = 0.4m, "bằng con người" = 1.7m).
   - Bước 2: K = size_mới / size_gốc → Khối lượng mới = m_gốc × K³ → Lực mới = sức_mạnh_tỷ_lệ_gốc × m_mới
   - Bước 3: So sánh Lực mới của sinh vật vs sức mạnh thực tế của đối thủ (đối thủ KHÔNG được scale).

   **Cấu trúc 3 tầng mẫu (kích thước tăng dần, đối thủ cũng mạnh dần):**
   - *Tầng 1*: Scale lên kích thước nhỏ dễ hình dung (nắm tay, bóng tennis) → Đọ với Đối thủ Tầng 1. Nhấn mạnh: "Nhỏ hơn X lần nhưng mạnh hơn Y lần!"
   - *Tầng 2*: Scale lên cỡ vừa (con mèo, con chó nhỏ) → Đọ với Đối thủ Tầng 2. Đối thủ to hơn nhưng vẫn bị nghiền nát.
   - *Tầng 3*: Scale lên cỡ lớn (người lớn, xe hơi) → Đọ với Đối thủ Tầng 3 tối thượng. Kịch tính cực đại.

   **Trái tim của bài viết là 2 con số tương phản**: "Nhỏ hơn đối thủ X lần" vs "Mạnh hơn đối thủ Y lần". Cặp số này phải xuất hiện trong mỗi tầng.

3. **Viết kịch bản hư cấu sống động**: Mỗi tầng là một đoạn văn ngắn có cảm xúc — mô tả cuộc đối đầu, rồi kết bằng câu số liệu rõ ràng. (Ví dụ: "Con bọ bằng nắm tay đã kéo gã khổng lồ 28.5 tấn... trong khi Pitbull chỉ kéo được 150kg.")

4. **Tạo file JSON tạm thời**: Lưu dữ liệu vào file `src/scripts/temp-gauntlet.json` theo đúng cấu trúc của `update-what-if.js`.
   ```json
   {
     "creature_id": "UUID_CỦA_SINH_VẬT",
     "title": "Thử Thách Kéo Co Đa Vũ Trụ",
     "slug": "thu-thach-keo-co-da-vu-tru",
     "description": "Chuyện gì sẽ xảy ra nếu Bọ hung khổng lồ thách đấu kéo co với thế giới?",
     "answers": [
       {
         "title": "Leo tháp Kéo co (Gauntlet Mode)",
         "slug": "leo-thap-keo-co-gauntlet-mode",
         "perspective_type": "gauntlet",
         "summary": "Bọ hung dễ dàng nghiền nát mọi đối thủ bằng sức mạnh khủng khiếp.",
         "content": "Kịch bản trận đấu chi tiết...",
         "p4p_score_scaled": 100,
         "tier_scaled": "S",
         "sources": [],
         "formulas_and_data": {
           "gauntlet_type": "tug_of_war",
           "scaling_metric": "weight",
           "base_multiplier": 1141,
           "stages": [
             {
               "stage_level": 1,
               "opponent_name": "Chó Pitbull",
               "opponent_weight_kg": 25,
               "opponent_power": "Kéo 150 kg",
               "creature_scaled_weight_kg": 25,
               "creature_scaled_power_kg": 28525,
               "match_story": "Khi nặng 25kg, Bọ hung kéo 28.5 tấn..."
             }
             // ... stage 2, 3
           ]
         }
       }
     ]
   }
   ```
5. **Nạp vào Database**: Chạy lệnh:
   ```bash
   node src/scripts/update-what-if.js src/scripts/temp-gauntlet.json
   ```
6. **Dọn dẹp và báo cáo**: Xóa file tạm thời và báo cáo tóm tắt 3 trận đấu.

### ⛔ QUY TẮC TUYỆT ĐỐI
- File JSON phải đảm bảo `perspective_type: "gauntlet"`.
- Bắt buộc phải có thuộc tính `formulas_and_data.stages`.
- Script dùng để chạy là `update-what-if.js`, KHÔNG TẠO SCRIPT MỚI.
