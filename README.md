# 혜택연구소 (Benefit Lab)

**혜택연구소**는 고객에게 카드, 휴대폰, 인터넷, CCTV 관련 최적의 혜택 정보를 제공하고 상담을 돕는 통합 웹 플랫폼입니다.

## 📁 프로젝트 구조

단일 Next.js(App Router) 기반 애플리케이션으로 랜딩 페이지와 관리자(Admin) 페이지가 통합되어 있습니다.

```text
benefit-lab/
├── app/
│   ├── page.tsx          # 메인 랜딩 홈 페이지
│   ├── card/             # 카드 혜택 안내 및 상담 라우트
│   ├── phone/            # 휴대폰 혜택 안내 및 상담 라우트
│   ├── internet/         # 인터넷 혜택 안내 및 상담 라우트
│   ├── cctv/             # CCTV 혜택 안내 및 상담 라우트
│   └── admin/            # 관리자 대시보드 라우트 (상담 내역, 콘텐츠 관리 등)
├── components/           # 공통 UI 및 레이아웃 컴포넌트 (Navbar, Footer 등)
├── lib/                  # 유틸리티 함수 및 설정 파일
├── data/                 # 더미 데이터 및 정적 데이터
├── *.sql                 # Supabase 데이터베이스 스키마 및 RLS(Row Level Security) 설정
└── package.json          # 프로젝트 의존성 설정
```

## 🚀 실행 방법

### 1. 환경 변수 설정
프로젝트 구동을 위해 필요한 환경 변수(Supabase URL, Key 등)를 `.env.local` 파일에 설정해야 합니다. (개발 환경 기준)

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```
명령어를 실행한 후, 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

- **홈 (랜딩)**: `http://localhost:3000/`
- **관리자**: `http://localhost:3000/admin`

## 📚 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **백엔드/BaaS**: Supabase (Database, Storage, Auth)
- **상태 관리**: Zustand
- **폼 및 유효성 검사**: React Hook Form, Zod
- **텍스트 에디터**: Tiptap
- **아이콘**: Lucide React
