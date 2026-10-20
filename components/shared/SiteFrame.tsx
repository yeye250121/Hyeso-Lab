'use client';

import { usePathname } from 'next/navigation';

// 고객용 화면은 모바일 앱처럼 가운데 1100px 폭으로 제한한다.
// 콘솔(/owner·/admin·/partners)과 담당자 명세서(/s)는 표·목록을 넓게 써야 해서 폭 제한을 두지 않고,
// 다크모드 배경도 콘솔 변수(--bg-primary)를 따른다.
const FULL_WIDTH_PREFIXES = ['/owner', '/admin', '/partners', '/s/'];

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (FULL_WIDTH_PREFIXES.some((p) => pathname?.startsWith(p))) {
    return <div className="w-full min-h-screen bg-bg-primary">{children}</div>;
  }
  return (
    <div className="max-w-[1100px] mx-auto w-full min-h-screen bg-gray-50 flex flex-col relative shadow-sm overflow-x-clip">
      {children}
    </div>
  );
}
