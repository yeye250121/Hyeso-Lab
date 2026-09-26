'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import MyPageDrawer from '@/components/shared/MyPageDrawer';

const NAV_LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png';

const MENU = [
  { href: '/card', label: '카드' },
  { href: '/internet', label: '인터넷' },
  { href: '/electronics', label: '가전렌탈' },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 서랍 안의 링크로 이동하면 닫는다
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-gray-50' : 'bg-transparent'}`}>
      <div className="h-16 max-w-[1100px] mx-auto px-6 flex items-center justify-between">
        <Link href="/">
          <Image
            src={NAV_LOGO_URL}
            alt="혜택 연구소"
            width={300}
            height={84}
            className="h-[60px] w-auto"
          />
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="text-gray-700 hover:text-[var(--action-primary)] text-[15px] font-semibold transition-colors"
              >
                {m.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="p-2 -mr-2"
            onClick={() => setDrawerOpen(true)}
            aria-label="전체 보기 열기"
            data-testid="open-drawer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
              <path fill="#B0B8C1" d="M4.118 6.2h16a1.2 1.2 0 100-2.4h-16a1.2 1.2 0 100 2.4m16 4.6h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4m0 7h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4" fillRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <MyPageDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </nav>
  );
}
