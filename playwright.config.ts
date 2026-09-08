import { defineConfig, devices } from '@playwright/test';

// 가전렌탈 E2E. 프로덕션 빌드(next start)를 대상으로 실데이터(시드된 DB)를 쓴다.
// 신청 제출만은 라우트 인터셉션으로 막는다 — 운영 DB 에 테스트 신청서를 남기지 않는다.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3131',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // 개편의 중심이 모바일 쇼핑 UX 라 모바일 뷰포트로 검증한다
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npx next start -p 3131',
    url: 'http://localhost:3131/electronics',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
