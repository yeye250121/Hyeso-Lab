'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const LOGO_URL = 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src={LOGO_URL} alt="혜택 연구소" width={120} height={32} className="h-8 w-auto" />
            </Link>
            <span className="ml-4 text-sm text-gray-500">N-Level 마케팅 플랫폼</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-purple-600 transition">
              홈
            </Link>
            <Link href="/landing" className="text-gray-700 hover:text-purple-600 transition">
              상담 신청
            </Link>
            <Link href="/partners" className="text-gray-700 hover:text-purple-600 transition">
              파트너
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:070-4507-4427"
              className="text-gray-700 hover:text-purple-600 transition"
            >
              상담하기
            </a>
            <Link
              href="/partners/login"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              로그인
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-purple-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              홈
            </Link>
            <Link
              href="/landing"
              className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              상담 신청
            </Link>
            <Link
              href="/partners"
              className="block px-3 py-2 text-gray-700 hover:bg-purple-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              파트너
            </Link>
            <Link
              href="/partners/login"
              className="block px-3 py-2 text-purple-600 font-medium hover:bg-purple-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              로그인
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
