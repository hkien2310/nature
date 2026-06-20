# Specifications: BioForce Atlas

> Chi tiết requirements và chức năng của project.

---

## Functional Requirements

### 1. Creature Profile Page (`/creatures/[slug]`)
- Ảnh đại diện sinh vật (full-width hero)
- Tên thường gọi + tên khoa học + phân loại (Kingdom > Phylum > Class > Order)
- Mô tả ngắn — thú vị, có chất, không khô như Wikipedia
- **Radar chart** — 6 chỉ số: Sức mạnh / Độ bền / Tốc độ / Vũ khí / Khả năng đặc biệt / Tính nguy hiểm
- **Pound-for-pound (P4P) Score** — điểm tổng hợp khi quy về 80kg
- **Tier badge** — S / A / B / C / D
- **Điểm mạnh / Điểm yếu** — bullet points ngắn gọn
- **Fun fact** — 1-2 fact kinh dị/ấn tượng
- **Nguồn** — link nghiên cứu khoa học

### 2. Trang Matchup (`/matchup/[creature-a]-vs-[creature-b]`)
- So sánh 2 sinh vật side-by-side
- Stat comparison từng chỉ số
- Phân tích: ai có lợi thế gì
- **Verdict** — kết luận ai thắng + lý do (dựa trên data, không phải vote)
- Nút share để dùng làm thumbnail/teaser cho video

### 3. Trang danh sách (`/creatures`)
- Grid các creature cards
- Filter theo tier (S/A/B/C/D)
- Filter theo loại (Insect / Mammal / Reptile / Marine / ...)
- Sort theo P4P Score

### 4. Trang chủ (`/`)
- Hero section — giới thiệu concept
- Featured matchup gần nhất
- Top 5 sinh vật theo P4P score
- Link đến danh sách đầy đủ

---

## Non-Functional Requirements

- **Performance:** Tải nhanh — static generation, ảnh optimize
- **SEO:** Meta tags đầy đủ — vì mục tiêu có người từ Google vào đọc từ link video
- **Scalability:** Thêm sinh vật = thêm file JSON, không cần deploy lại backend
- **Mobile:** Responsive — người xem video hay mở link trên điện thoại

---

## Data Model (JSON per creature)

```json
{
  "id": "bullet-ant",
  "name": "Kiến Đạn",
  "scientificName": "Paraponera clavata",
  "taxonomy": {
    "class": "Insecta",
    "order": "Hymenoptera",
    "family": "Paraponerinae"
  },
  "realWeight": "0.1g",
  "habitat": "Rừng nhiệt đới Trung và Nam Mỹ",
  "description": "...",
  "stats": {
    "strength": 95,
    "durability": 70,
    "speed": 60,
    "weaponry": 98,
    "special": 85,
    "lethality": 88
  },
  "p4pScore": 89,
  "tier": "S",
  "strengths": ["Nọc độc mạnh nhất trong côn trùng", "..."],
  "weaknesses": ["Kích thước nhỏ thật sự", "..."],
  "funFacts": ["Nọc độc gây đau 24 giờ liên tục", "..."],
  "sources": ["https://..."]
}
```

---

## UI/UX Notes

- **Aesthetic:** Dark sci-fi — đen/đỏ đậm, monospace font, kiểu HUD/terminal
- **Cảm giác:** Hồ sơ tối mật, không phải blog bình thường
- **Tham khảo:** Terra Formars (manga), Apex Legends legend bio, Dark Souls enemy description
- **Font:** Share Tech Mono (heading) + Fira Code (body)

---

## Tech Stack

| Layer | Technology | Lý do |
|-------|------------|-------|
| Framework | Next.js 15 (App Router) | SSG tốt, SEO, deploy Vercel free |
| Styling | Tailwind CSS v4 | Utility-first, nhanh |
| Data | JSON files trong `/data/creatures/` | Không cần DB, thêm con = thêm file |
| Charts | Recharts hoặc Chart.js | Radar chart đẹp |
| Deploy | Vercel | Free, auto deploy từ git |
| Domain | (tuỳ) | Sau này nếu muốn |

---

## Constraints

- Deploy free → Vercel
- Data driven bằng file JSON — không cần Supabase giai đoạn đầu
- Bắt đầu với 5 sinh vật mẫu: Kiến Đạn, Bọ Hung Goliath, Bạch Tuộc Đốm Xanh, Rết Khổng Lồ, Bọ Cạp Hoàng Đế
