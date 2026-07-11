'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV_LOGO_URL = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvaHllc28tbGFiX2xvZ29fcGljX3RleHRfYmxhY2sucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MzQzMzU3NiwiZXhwIjoxNzg0MDM4Mzc2fQ.DGBROh1thZ9aNai6oVGn4x8DtmeT0lpC9ihBcuuNI78';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        
        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link href="/card" className="text-gray-700 hover:text-[var(--action-primary)] text-[15px] font-semibold transition-colors">
            카드 혜택
          </Link>
          <Link href="/phone" className="text-gray-700 hover:text-[var(--action-primary)] text-[15px] font-semibold transition-colors">
            휴대폰 혜택
          </Link>
          <Link href="/internet" className="text-gray-700 hover:text-[var(--action-primary)] text-[15px] font-semibold transition-colors">
            인터넷 혜택
          </Link>
          <Link href="/cctv" className="text-gray-700 hover:text-[var(--action-primary)] text-[15px] font-semibold transition-colors">
            CCTV 혜택
          </Link>
        </div>

        {/* Right Menu (Login/Register) */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/partners/login"
            className="text-[var(--action-primary)] hover:text-[var(--action-primary-hover)] text-sm font-semibold transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/partners/register"
            className="bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            회원가입
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
            <path fill="#B0B8C1" d="M4.118 6.2h16a1.2 1.2 0 100-2.4h-16a1.2 1.2 0 100 2.4m16 4.6h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4m0 7h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4" fillRule="evenodd"/>
          </svg>
        </button>
      </div>
      {/* Mobile Menu Accordion */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${mobileMenuOpen ? 'max-h-[500px] opacity-100 bg-gray-50 shadow-md border-b border-gray-200' : 'max-h-0 opacity-0 bg-transparent'}`}>
        <div className="px-6 py-4 space-y-3 border-t border-[#333d4b]/10">
          <Link
            href="/card"
            className="block w-full text-left text-gray-700 hover:text-[var(--action-primary)] text-base font-semibold px-4 py-2 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            카드 혜택
          </Link>
          <Link
            href="/phone"
            className="block w-full text-left text-gray-700 hover:text-[var(--action-primary)] text-base font-semibold px-4 py-2 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            휴대폰 혜택
          </Link>
          <Link
            href="/internet"
            className="block w-full text-left text-gray-700 hover:text-[var(--action-primary)] text-base font-semibold px-4 py-2 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            인터넷 혜택
          </Link>
          <Link
            href="/cctv"
            className="block w-full text-left text-gray-700 hover:text-[var(--action-primary)] text-base font-semibold px-4 py-2 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            CCTV 혜택
          </Link>

          <div className="h-[1px] bg-gray-200 my-2" />
          
          <Link
            href="/partners/login"
            className="block w-full text-center text-[var(--action-primary)] border border-[var(--action-primary)] text-base font-semibold px-4 py-3 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            로그인
          </Link>
          <Link
            href="/partners/register"
            className="block w-full text-center bg-[var(--action-primary)] text-white text-base font-semibold px-4 py-3 rounded-xl transition-colors shadow-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            회원가입
          </Link>
        </div>
      </div>
    </nav>
  );
}
