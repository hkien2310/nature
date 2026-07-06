# QUY TRÌNH F: LÀM GIÀU GAUNTLET (Lệnh: "Làm giàu Gauntlet")

Khi nhận được yêu cầu `"Làm giàu Gauntlet"` cho một sinh vật (ví dụ: Bọ hung, Tôm gõ mõ, Bọ chét), AI sẽ xây dựng một thử thách leo tháp (Gauntlet) đối chiếu sức mạnh của sinh vật đó với các mốc sức mạnh (benchmarks) thực tế.

### Script Được Phép Sử Dụng:
- `src/scripts/get-creatures.js` — Lấy danh sách sinh vật hiện có trong DB (để tra cứu ID).
- `src/scripts/update-what-if.js` — Bản chất Gauntlet vẫn là một What-If, chúng ta dùng chung script của What-If để lưu trữ.

**LƯU Ý QUAN TRỌNG CHO AI**: TUYỆT ĐỐI KHÔNG tự viết các file script (`.js`) nháp để kết nối vào Database. Nếu cần lấy thông tin, CHỈ sử dụng các script đã có sẵn ở trên. Việc tự viết script sẽ gây lỗi sai đường dẫn file `.env.local`!

### Các Bước Thực Hiện:
1. **Chọn loại Gauntlet & Mốc so sánh (Benchmarks 3 Tầng)**:
   - **Xác định THẾ MẠNH ĐẶC TRƯNG** nhất của sinh vật (ví dụ: lực đấm, lực kéo, sức bật nhảy, tốc độ, độ cứng).
   - **Quy tắc chọn Benchmark 3 Tầng**: Dựa vào thế mạnh trên, AI tự vận dụng kiến thức thực tế để chọn ra 3 mốc so sánh nổi tiếng nhất thế giới. 
     - **LOGIC Chọn Đối thủ**: Mốc so sánh phải CỤ THỂ, RÕ RÀNG và SIÊU PHỔ BIẾN (những thứ mà ai cũng biết, vừa nghe tên là hình dung ngay được độ khủng khiếp, ví dụ: Xe tăng, Khủng long T-Rex, Tàu sân bay, Tên lửa vũ trụ, Võ sĩ hạng nặng). KHÔNG dùng các ví dụ mập mờ, khó hiểu hay tên thiết bị máy móc ít người biết.
     - **FLOW Thăng tiến sức mạnh**: Ba đối thủ phải tạo thành một đường cong thăng tiến sức mạnh/kích thước tăng dần đầy kịch tính (Tầng 1: Đáng nể -> Tầng 2: Khủng khiếp -> Tầng 3: Tối thượng).
     - *Ví dụ bật nhảy: Tầng 1 - Kangaroo -> Tầng 2 - Trực thăng -> Tầng 3 - Tên lửa vũ trụ Saturn V.*
     - *Ví dụ đấm/phá: Tầng 1 - Võ sĩ Boxer hạng nặng -> Tầng 2 - Máy xúc khổng lồ -> Tầng 3 - Đạn pháo Xe tăng.*
   - **KHÔNG DÙNG DATABASE**: Tuyệt đối tự do suy luận và KHÔNG bám vào database! Cứ thứ gì trên đời này nổi tiếng nhất về thế mạnh đó thì lôi ra làm mốc.
2. **Triết Lý Scaling — Sức Mạnh Thực Tế, Không Scale Bằng Đối Thủ**:
   - **KHÔNG ép sinh vật lớn bằng đối thủ** — Đây là sai lầm giết chết yếu tố bất ngờ. Nếu hai bên bằng nhau về kích thước thì không còn gì choáng ngợp nữa.
   - **Giữ kích thước THỰC hoặc tạo CHÊNH LỆCH CÓ Ý NGHĨA**: Có 2 hướng hợp lệ:
     - *Hướng A (Giữ nguyên thực)*: Sinh vật giữ kích thước thật 100%. Đối thủ lớn hơn nhiều lần nhưng **sức mạnh tỷ lệ cơ thể của sinh vật** nghiền nát nó hoàn toàn. (Ví dụ: Bọ hung 5g dùng lực kéo 1141x trọng lượng → kéo được 5.7kg, trong khi Chó Pitbull 25kg chỉ kéo được 150kg. Tính P4P thì bọ hung thắng tuyệt đối dù nhỏ hơn 5000 lần.)
     - *Hướng B (Scale có chủ đích)*: Scale sinh vật lên nhưng vẫn **nhỏ hơn đáng kể** so với đối thủ để tạo sự bất ngờ tối đa. (Ví dụ: Bọ hung scale lên bằng con chó 25kg → nó kéo được 28.5 tấn. Pitbull chỉ kéo 150kg. Chênh lệch 190 lần!)
   - **Trình bày chênh lệch theo số liệu cụ thể**: Luôn nêu rõ con số ("nhỏ hơn X lần" / "chênh lệch Y lần về sức mạnh") để người đọc cảm nhận được sự điên rồ.
   - Tính lực vật lý dựa trên Square-Cube Law: $K = \frac{\text{Size mới}}{\text{Size gốc}}$, Khối lượng mới $= m_{gốc} \times K^3$.
3. **Viết kịch bản chiến đấu**: Trình bày rõ sự chênh lệch kích thước, sức mạnh tỷ lệ cơ thể điên rồ để người đọc không thể tin vào mắt mình.
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
