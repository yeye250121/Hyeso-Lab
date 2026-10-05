'use client';

import { usePathname } from 'next/navigation';

// 고객용 화면은 모바일 앱처럼 가운데 1100px 폭으로 제한한다.
// 관리자(/admin)는 표·목록을 넓게 써야 해서 폭 제한을 두지 않는다.
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return <div className="w-full min-h-screen">{children}</div>;
  }
  return (
    <div className="max-w-[1100px] mx-auto w-full min-h-screen bg-gray-50 flex flex-col relative shadow-sm overflow-x-clip">
      {children}
    </div>
  );
}
