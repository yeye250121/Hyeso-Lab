-- Piooom 프로젝트 Supabase 데이터베이스 스키마

-- 1. 문의(inquiries) 테이블
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_url TEXT,
  phone_number TEXT NOT NULL,
  install_location TEXT NOT NULL,
  install_count INTEGER NOT NULL CHECK (install_count >= 1 AND install_count <= 100),
  privacy_consent BOOLEAN NOT NULL DEFAULT true,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_inquiries_submitted_at ON inquiries(submitted_at DESC);
CREATE INDEX idx_inquiries_phone_number ON inquiries(phone_number);

-- 2. 사용자(users) 테이블 - 관리자/마케터
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  login_id TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  referrer_code TEXT REFERENCES users(unique_code), -- 추천 코드 = 가계도처럼 상위 파트너를 연결하는 끈
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_users_unique_code ON users(unique_code);
CREATE INDEX idx_users_referrer_code ON users(referrer_code);

-- 3. 파트너 가이드(partner_guides) 테이블
CREATE TABLE IF NOT EXISTS partner_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  resource_url TEXT,
  resource_type TEXT DEFAULT 'text',
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 가이드 정렬 최적화
CREATE INDEX idx_partner_guides_order ON partner_guides(display_order);

-- 4. Row Level Security (RLS) 정책 설정

-- inquiries 테이블 RLS 활성화
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 문의를 생성할 수 있음 (public insert)
CREATE POLICY "Anyone can insert inquiries"
  ON inquiries
  FOR INSERT
  WITH CHECK (true);

-- 인증된 사용자만 문의를 조회할 수 있음
CREATE POLICY "Authenticated users can view inquiries"
  ON inquiries
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 사용자 정보를 조회할 수 있음
CREATE POLICY "Authenticated users can view users"
  ON users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 사용자는 자신의 정보만 업데이트할 수 있음
CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- 5. 트리거 - updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 초기 데모 데이터 (선택사항)
-- 비밀번호: demo123 (bcrypt hash)
INSERT INTO users (login_id, password_hash, nickname, unique_code, level)
VALUES (
  'demo',
  '$2a$10$YourBcryptHashHere', -- 실제로는 bcrypt로 해싱된 비밀번호
  '데모 관리자',
  'S00001',
  1
)
ON CONFLICT (login_id) DO NOTHING;
