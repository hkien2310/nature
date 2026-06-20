# Project Brief: BioForce Atlas

> File này chứa ý tưởng ban đầu của project.
> AI đọc file này đầu tiên trong Phase 0 để hiểu context.

---

## Mô tả ý tưởng

**BioForce Atlas** — Trang wiki sinh vật theo phong cách dark sci-fi, lấy cảm hứng từ manga Terra Formars.

Concept cốt lõi: **"Nếu hai sinh vật cùng cân nặng đối đầu nhau, con nào thắng?"**

Đây là tài liệu hồ sơ sinh vật được thiết kế đẹp, dùng làm nguồn tham khảo và nền tảng nội dung cho video giải mã trên YouTube/TikTok. Không phải tool kiếm tiền — làm vì thích, vì có thứ để học, có content để post.

---

## Target Users

- **Primary:** Bản thân — content creator dùng web này làm tài liệu viết/quay video
- **Secondary:** Người xem video tò mò muốn đọc hồ sơ đầy đủ hơn (từ link description)

## Problem

Không có problem nghiêm trọng — đây là creative project.
Nhưng nếu phải nói: Wikipedia về sinh vật quá khô, thiếu góc nhìn "combat & survival", thiếu aesthetic. 
BioForce Atlas lấp khoảng trống đó: thông tin thật + trình bày ngầu + frame "ai sẽ thắng nếu cùng cân".

## Key Features (brain dump)

- **Hồ sơ sinh vật** — tên khoa học, phân loại, ảnh, mô tả, habitat
- **Combat stats** — STR / DEF / SPD / Độc / Khả năng đặc biệt (radar chart)
- **Pound-for-pound score** — điểm sức mạnh khi quy về cùng cân nặng
- **Tier rank** — S / A / B / C / D dựa trên P4P score
- **Trang Matchup** — phân tích 2 sinh vật cụ thể: điểm mạnh/yếu, ai có lợi thế
- **Danh sách / Bảng xếp hạng** — xem toàn bộ theo tier
- **Nguồn khoa học** — link nghiên cứu thật cho từng stat

## Tech Preferences

Đơn giản, không cần backend phức tạp. Ưu tiên:
- Next.js (App Router) — SEO tốt, deploy Vercel dễ
- Data dạng JSON/MDX — thêm sinh vật bằng cách thêm file, không cần database
- Supabase (sau này, nếu muốn thêm voting)

## Constraints

- **Budget:** $0 — deploy free trên Vercel
- **Timeline:** Fun project, không deadline
- **Scope:** Bắt đầu với ~5-10 sinh vật mẫu, thêm dần
- **Monetize:** Không phải mục tiêu
