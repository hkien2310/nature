-- 1. Tạo bảng creatures
CREATE TABLE creatures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  class TEXT NOT NULL,
  "order" TEXT NOT NULL,
  family TEXT NOT NULL,
  real_weight TEXT NOT NULL,
  size TEXT NOT NULL,
  characteristics TEXT,
  habitat TEXT NOT NULL,
  location TEXT,
  survival_method TEXT,
  unique_traits TEXT,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  fun_facts TEXT[] DEFAULT '{}',
  sources JSONB DEFAULT '[]',
  image_color TEXT NOT NULL,
  enrichment_count INTEGER DEFAULT 0 NOT NULL,
  diet_type TEXT CHECK (diet_type IN ('carnivore', 'herbivore', 'omnivore', 'detritivore', 'parasitic')),
  diet_items TEXT[] DEFAULT '{}',
  activity_pattern TEXT CHECK (activity_pattern IN ('diurnal', 'nocturnal', 'crepuscular', 'variable')),
  lifespan_min INTEGER,
  lifespan_max INTEGER,
  lifespan_unit TEXT CHECK (lifespan_unit IN ('years', 'months', 'days')),
  reproduction_type TEXT CHECK (reproduction_type IN ('sexual', 'asexual', 'hermaphrodite', 'oviparous', 'viviparous')),
  reproduction_notes TEXT,
  locomotion TEXT CHECK (locomotion IN ('swim', 'walk', 'fly', 'crawl', 'burrow', 'hybrid')),
  speed_max DOUBLE PRECISION,
  conservation_status TEXT CHECK (conservation_status IN ('LC', 'NT', 'VU', 'EN', 'CR', 'EX')),
  size_min_mm DOUBLE PRECISION,
  size_max_mm DOUBLE PRECISION,
  weight_avg_g DOUBLE PRECISION,
  has_documentary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tạo bảng votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_id TEXT REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
  strength INTEGER CHECK (strength >= 1 AND strength <= 100) NOT NULL,
  durability INTEGER CHECK (durability >= 1 AND durability <= 100) NOT NULL,
  speed INTEGER CHECK (speed >= 1 AND speed <= 100) NOT NULL,
  weaponry INTEGER CHECK (weaponry >= 1 AND weaponry <= 100) NOT NULL,
  special INTEGER CHECK (special >= 1 AND special <= 100) NOT NULL,
  lethality INTEGER CHECK (lethality >= 1 AND lethality <= 100) NOT NULL,
  user_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tạo index tối ưu hóa truy vấn
CREATE INDEX idx_votes_creature_id ON votes(creature_id);

-- 4. Tạo bảng accounts cho nickname login (bỏ Supabase Auth Mail)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tạo bảng battles
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_a_id TEXT REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
  creature_b_id TEXT REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  duration_days INTEGER NOT NULL DEFAULT 7,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tạo bảng battle_votes
CREATE TABLE battle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  vote_for TEXT NOT NULL,
  user_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  user_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (battle_id, user_id),
  UNIQUE (battle_id, user_ip)
);

CREATE INDEX idx_battle_votes_battle_id ON battle_votes(battle_id);

-- 7. Tạo bảng matchup_votes cho bình chọn dự đoán 1v1 chi tiết
CREATE TABLE matchup_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_slug TEXT NOT NULL,
  vote_for TEXT NOT NULL,
  user_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  user_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (matchup_slug, user_id),
  UNIQUE (matchup_slug, user_ip)
);

CREATE INDEX idx_matchup_votes_slug ON matchup_votes(matchup_slug);

-- 8. Thêm cột phục vụ hệ thống tự động chấm điểm & hiệu chuẩn P4P
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS grading_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS ai_p4p_score INTEGER DEFAULT 50 NOT NULL;
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'C' NOT NULL;

-- 9. Tạo bảng grading_history lưu lịch sử chấm điểm chéo 5 loài
CREATE TABLE IF NOT EXISTS grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creatures_evaluated TEXT[] NOT NULL,
  evaluation_details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
