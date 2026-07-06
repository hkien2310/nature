# QUY TRÌNH F: LÀM GIÀU GAUNTLET (Lệnh: "Làm giàu Gauntlet")

Khi nhận được yêu cầu `"Làm giàu Gauntlet"` cho một sinh vật (ví dụ: Bọ hung, Tôm gõ mõ, Bọ chét), AI sẽ xây dựng một thử thách leo tháp (Gauntlet) đối chiếu sức mạnh của sinh vật đó với các mốc sức mạnh (benchmarks) thực tế.

### Script Được Phép Sử Dụng:
- `src/scripts/get-creatures.js` — Lấy danh sách sinh vật hiện có trong DB (để tra cứu ID).
- `src/scripts/update-what-if.js` — Bản chất Gauntlet vẫn là một What-If, chúng ta dùng chung script của What-If để lưu trữ.

**LƯU Ý QUAN TRỌNG CHO AI**: TUYỆT ĐỐI KHÔNG tự viết các file script (`.js`) nháp để kết nối vào Database. Nếu cần lấy thông tin, CHỈ sử dụng các script đã có sẵn ở trên. Việc tự viết script sẽ gây lỗi sai đường dẫn file `.env.local`!

### Các Bước Thực Hiện:
1. **Chọn loại Gauntlet & Mốc so sánh (Benchmarks 3 Tầng)**:
   - **Xác định THẾ MẠNH ĐẶC TRƯNG** nhất của sinh vật (ví dụ: lực đấm, lực kéo, sức bật nhảy, tốc độ, độ cứng).
   - **Quy tắc chọn Benchmark 3 Tầng**: Dựa vào thế mạnh trên, AI tự vận dụng kiến thức thực tế để chọn ra 3 mốc so sánh (benchmarks) nổi tiếng nhất thế giới về đúng phương diện đó. Ba mốc này phải tuân thủ cấu trúc 3 tầng với sức mạnh/kích thước tăng dần (Tầng 1: Vừa phải -> Tầng 2: Khủng khiếp -> Tầng 3: Tối thượng). 
     - *Ví dụ bật nhảy: Tầng 1 - Kangaroo -> Tầng 2 - Máy phóng máy bay -> Tầng 3 - Tên lửa vũ trụ.*
     - *Ví dụ đấm: Tầng 1 - Võ sĩ Boxer hạng nặng -> Tầng 2 - Máy búa thủy lực -> Tầng 3 - Đạn pháo xe tăng.*
   - **KHÔNG DÙNG DATABASE**: Tuyệt đối tự do suy luận! Không được sử dụng bất kỳ database hay ví dụ cố định nào (chẳng hạn không lấy Xe tăng đọ với kỹ năng bật nhảy).
2. **Mô phỏng Scale kích thước (Định luật Square-Cube Law)**:
   - Thay vì ép khối lượng, hãy **ép kích thước (size)** của sinh vật bằng với `size_m` của đối thủ.
   - Tính hệ số $K = \frac{\text{Size đối thủ}}{\text{Size gốc của sinh vật}}$.
   - Tính khối lượng mới của sinh vật bằng công thức lập phương: $\text{Khối lượng mới} = \text{Khối lượng gốc} \times K^3$.
   - Tính lực vật lý (hoặc các thông số sức mạnh) của sinh vật dựa trên khối lượng mới hoặc tiết diện ($K^2$), tuân thủ theo rule của từng sinh vật (ví dụ Bọ chét phóng 140x khối lượng cơ thể).
4. **Viết kịch bản chiến đấu**: Trình bày rõ quá trình quy đổi kích thước, khối lượng mới siêu to khổng lồ và sức mạnh cực hạn để so kèo.
5. **Tạo file JSON tạm thời**: Lưu dữ liệu vào file `src/scripts/temp-gauntlet.json` theo đúng cấu trúc của `update-what-if.js`.
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
