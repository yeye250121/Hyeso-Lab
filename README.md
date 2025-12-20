# Piooom - N-Level 마케팅 네트워크 플랫폼

Piooom 메인 프로젝트 - 통합 게이트웨이

## 📁 프로젝트 구조

```
piooom/
├── piooom-main/              # 메인 프로젝트 (포트 3000) ⭐
├── piooom-landing-nextjs/     # 랜딩 페이지 (포트 3001)
└── piooom-admin/
    ├── frontend/             # 관리자 프론트엔드 (포트 3002)
    └── backend/              # NestJS API (포트 3001)
```

## 🌐 라우트 구조

- **`piooom.kr/`** → 메인 페이지 (Piooom 플랫폼 소개)
- **`piooom.kr/landing`** → KT CCTV 상담 신청 랜딩 페이지 (프록시 → 포트 3001)
- **`piooom.kr/admin`** → 관리자 대시보드 (프록시 → 포트 3002)

## 🚀 실행 방법

### 1. 모든 서버 실행 (3개 터미널 필요)

#### 터미널 1: 메인 프로젝트
```bash
cd piooom-main
npm run dev
# → http://localhost:3000
```

#### 터미널 2: 랜딩 페이지
```bash
cd ../piooom-landing-nextjs
npm run dev
# → http://localhost:3001
```

#### 터미널 3: 관리자 프론트엔드
```bash
cd ../piooom-admin/frontend
npm run dev
# → http://localhost:3002
```

### 2. 접속

브라우저에서 `http://localhost:3000` 접속

- **홈** → `http://localhost:3000/`
- **상담 신청** → `http://localhost:3000/landing`
- **관리자** → `http://localhost:3000/admin`

## ⚙️ 작동 원리

`piooom-main`의 `next.config.ts`에서 Next.js rewrites를 사용하여 각 경로를 프록시합니다:

```typescript
async rewrites() {
  return [
    // /landing → localhost:3001
    { source: '/landing', destination: 'http://localhost:3001' },
    { source: '/landing/:path*', destination: 'http://localhost:3001/:path*' },

    // /admin → localhost:3002
    { source: '/admin', destination: 'http://localhost:3002' },
    { source: '/admin/:path*', destination: 'http://localhost:3002/:path*' },
  ];
}
```

## 🎯 장점

1. **독립성**: 각 프로젝트는 독립적으로 개발 가능
2. **유연성**: 각 프로젝트를 별도로 배포/관리 가능
3. **간단함**: 기존 프로젝트 구조 그대로 유지
4. **확장성**: 새로운 서비스 추가 시 프록시만 추가하면 됨

## 📦 의존성 설치

각 프로젝트에서 개별적으로 설치:

```bash
# 메인
cd piooom-main && npm install

# 랜딩
cd ../piooom-landing-nextjs && npm install

# 관리자 프론트
cd ../piooom-admin/frontend && npm install
```

## 📝 개발 시 주의사항

1. **모든 서버를 동시에 실행해야 합니다** (메인 3000, 랜딩 3001, 관리자 3002)
2. 각 프로젝트의 포트가 설정됨:
   - 메인: 3000
   - 랜딩: 3001
   - 관리자: 3002
3. 프록시는 개발 환경에서 작동

## 📚 기술 스택

- **메인**: Next.js 16, React 18, Tailwind CSS
- **랜딩**: Next.js 14, Google Sheets API, Zod
- **관리자**: Next.js 14, Zustand, Axios
- **백엔드**: NestJS, TypeORM, PostgreSQL
