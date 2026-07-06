-- Mở rộng constraint của cột perspective_type trong bảng what_if_answers để hỗ trợ 'gauntlet'
ALTER TABLE what_if_answers DROP CONSTRAINT IF EXISTS what_if_answers_perspective_type_check;

ALTER TABLE what_if_answers ADD CONSTRAINT what_if_answers_perspective_type_check CHECK (
    perspective_type IN (
      'classic_scaling',
      'biological_reality',
      'evolutionary_mutation',
      'custom',
      'gauntlet'
    )
);
