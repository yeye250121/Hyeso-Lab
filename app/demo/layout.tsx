import { IBM_Plex_Mono } from 'next/font/google'

// 데모 홈 전용 서체. 본문·제목은 Pretendard(가변), 라벨·숫자는 IBM Plex Mono.
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${mono.variable} demo-root`}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {children}
    </div>
  )
}
