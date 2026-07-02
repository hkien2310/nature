-- 12. Tạo bảng human_splices (Lai ghép Gen Người)
CREATE TABLE IF NOT EXISTS human_splices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_id TEXT REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  trait_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  spliced_stats JSONB NOT NULL,
  formulas_and_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  summary TEXT,
  sci_fi_hype TEXT NOT NULL,
  scientific_reality TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index tối ưu hóa truy vấn gen ghép
CREATE INDEX IF NOT EXISTS idx_human_splices_creature_id ON human_splices(creature_id);
CREATE INDEX IF NOT EXISTS idx_human_splices_slug ON human_splices(slug);

-- Tắt RLS để cho phép nạp và đồng bộ tự động từ API/script
ALTER TABLE human_splices DISABLE ROW LEVEL SECURITY;
