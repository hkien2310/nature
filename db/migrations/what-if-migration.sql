-- 10. Tạo bảng what_if_questions
CREATE TABLE IF NOT EXISTS what_if_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_id TEXT REFERENCES creatures(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index tối ưu hóa truy vấn câu hỏi
CREATE INDEX IF NOT EXISTS idx_what_if_questions_creature_id ON what_if_questions(creature_id);
CREATE INDEX IF NOT EXISTS idx_what_if_questions_slug ON what_if_questions(slug);

-- 11. Tạo bảng what_if_answers (1 Câu hỏi -> Nhiều Câu trả lời/Góc nhìn)
CREATE TABLE IF NOT EXISTS what_if_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES what_if_questions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  perspective_type TEXT NOT NULL CHECK (
    perspective_type IN (
      'classic_scaling',      -- Phóng to cơ học lý thuyết (sức mạnh tuyến tính)
      'biological_reality',   -- Giới hạn sinh học thực tế (sụp đổ cấu trúc, thiếu oxy)
      'evolutionary_mutation',-- Tiến hóa đột biến thích nghi (nếu cơ thể thay đổi để sống sót)
      'custom'
    )
  ),
  summary TEXT,
  content TEXT NOT NULL,
  formulas_and_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  p4p_score_scaled INTEGER NOT NULL CHECK (p4p_score_scaled BETWEEN 1 AND 100),
  tier_scaled TEXT NOT NULL CHECK (tier_scaled IN ('S', 'A', 'B', 'C', 'D')),
  sources JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index tối ưu hóa truy vấn câu trả lời
CREATE INDEX IF NOT EXISTS idx_what_if_answers_question_id ON what_if_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_what_if_answers_slug ON what_if_answers(slug);

-- Tắt RLS để cho phép nạp và đồng bộ tự động từ API/script
ALTER TABLE what_if_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_answers DISABLE ROW LEVEL SECURITY;
