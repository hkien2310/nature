-- Tạo bảng opponents để lưu mốc sức mạnh (benchmarks) cho Scaling Gauntlet
CREATE TABLE IF NOT EXISTS opponents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('animal', 'machine', 'human', 'nature_force')
  ),
  size_m DOUBLE PRECISION NOT NULL,
  weight_kg DOUBLE PRECISION NOT NULL,
  pull_force_kg DOUBLE PRECISION,
  punch_force_kg DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index tối ưu hóa truy vấn theo cân nặng để lấy danh sách từ thấp lên cao
CREATE INDEX IF NOT EXISTS idx_opponents_weight_kg ON opponents(weight_kg);

-- Tắt RLS để cho phép nạp và đồng bộ tự động từ script
ALTER TABLE opponents DISABLE ROW LEVEL SECURITY;
