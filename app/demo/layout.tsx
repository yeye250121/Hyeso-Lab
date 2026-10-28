// 데모 홈 전용 서체: Pretendard(가변). 렌더를 막지 않게 print 미디어로 받은 뒤 적용한다(폴백은 시스템 한글 서체).
// 승격 시 루트 레이아웃으로 옮긴다.
import PretendardLink from '@/components/home/PretendardLink'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-root">
      <PretendardLink />
      {children}
    </div>
  )
}
