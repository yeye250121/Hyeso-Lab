// 데모 홈 전용 서체: Pretendard(가변). 승격 시 루트 레이아웃으로 옮긴다.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-root">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      {children}
    </div>
  )
}
