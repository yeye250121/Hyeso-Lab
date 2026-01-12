-- Supabase SQL Editor에 복사하여 실행하세요.

-- 1. 문의(inquiries) 테이블에 필요한 컬럼 추가 (이미 있으면 무시됨)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS marketer_code TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'consultation';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS landing_template TEXT DEFAULT 'kt-cctv';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS landing_subtype TEXT DEFAULT '1';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS reservation_date DATE;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS reservation_time_slot TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS outdoor_count INTEGER DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS indoor_count INTEGER DEFAULT 0;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS address_detail TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS zonecode TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS documents_submitted BOOLEAN DEFAULT false;

-- 2. 검색 성능 향상을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_inquiries_marketer_code ON inquiries(marketer_code);
CREATE INDEX IF NOT EXISTS idx_inquiries_landing_template ON inquiries(landing_template);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- 3. 기존 install_count 제약 조건 완화 (화물카드는 대수가 0일 수 있으므로)
ALTER TABLE inquiries ALTER COLUMN install_count SET DEFAULT 0;
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_install_count_check;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_install_count_check CHECK (install_count >= 0);
