'use client';

import { useEffect, useRef, useState } from 'react';

// 앵커 스크롤형 탭. 누르면 해당 섹션으로 스크롤하고, 스크롤하면 현재 섹션이
// 활성화된다. 콘텐츠는 전부 렌더링된 상태라 서버 컴포넌트를 그대로 children 으로
// 받을 수 있고 SEO 에도 유리하다.

const NAV_OFFSET = 72; // 고정 탭바 높이만큼 스크롤 위치를 보정한다

export default function ProductTabs({
  tabs,
  children,
}: {
  tabs: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  // 탭을 눌러 이동하는 동안에는 스크롤 감지가 중간 섹션을 집지 않도록 잠근다
  const lockUntil = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      // 탭바 바로 아래를 지나는 섹션을 현재 섹션으로 본다
      let current = tabs[0]?.id;
      for (const tab of tabs) {
        const el = document.getElementById(tab.id);
        if (el && el.getBoundingClientRect().top <= NAV_OFFSET + 8) current = tab.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tabs]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    lockUntil.current = Date.now() + 700;
    setActive(id);
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 -mx-6 px-6">
        <ul className="flex gap-1 max-w-[1100px] mx-auto">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => go(tab.id)}
                aria-current={active === tab.id ? 'true' : undefined}
                className={`relative px-4 py-4 text-[15px] font-bold transition-colors ${
                  active === tab.id
                    ? 'text-[#333d4b]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
                <span
                  className={`absolute left-3 right-3 bottom-0 h-0.5 rounded-full transition-opacity ${
                    active === tab.id ? 'bg-[#333d4b] opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </>
  );
}
