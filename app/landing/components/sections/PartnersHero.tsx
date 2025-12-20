'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export interface PartnersHeroProps {
  logoUrl?: string;
  logoWithTextUrl?: string;
  /** 로고 이미지에 적용할 추가 클래스 (예: 'brightness-0 invert' for dark logos) */
  logoClassName?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
  loginHref?: string;
  registerHref?: string;
  /** 네비게이션 전체 숨기기 */
  hideNav?: boolean;
  /** 네비게이션 버튼만 숨기기 (로고는 표시) */
  hideNavButtons?: boolean;
  /** 히어로 영역 로고 숨기기 */
  hideLogo?: boolean;
  /** 타이틀 위에 표시할 경고/강조 문구 */
  warningTitle?: React.ReactNode;
  /** 경고 문구 아래 이미지 URL */
  warningImageUrl?: string;
  /** 경고 이미지 alt */
  warningImageAlt?: string;
  /** 헤더 로고 클릭 비활성화 */
  disableLogoLink?: boolean;
  /** 서브타이틀 숨기기 */
  hideSubtitle?: boolean;
  /** CTA 버튼 숨기기 */
  hideCta?: boolean;
}

const defaultProps: PartnersHeroProps = {
  logoUrl: 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_logo',
  logoWithTextUrl: 'https://i.namu.wiki/i/g-8tEhqgrMv-DLrASvSM-7pgsPos9qX1Lpx3VVOGRYTTZpgtUnWbMEsw7DLDuU7ecjtrkl6nqnCrFqxepgRU1A.svg',
  logoClassName: '',
  title: (
    <>
      집에서 시작하는<br />온라인 사업<br />
      <span className="text-[#3182f6]">블룸</span> 파트너스
    </>
  ),
  subtitle: (
    <>
      <br />상담을 연결하면 수익이 생겨요<br />
      전부 다, 블룸이 도와드릴게요.
    </>
  ),
  ctaText: '지금 시작하기',
  ctaHref: '/partners/login',
  loginHref: '/partners/login',
  registerHref: '/partners/register',
  hideNav: false,
  hideNavButtons: false,
  hideLogo: false,
};

export default function PartnersHero(props: PartnersHeroProps = {}) {
  const {
    logoUrl,
    logoWithTextUrl,
    logoClassName,
    title,
    subtitle,
    ctaText,
    ctaHref,
    loginHref,
    registerHref,
    hideNav,
    hideNavButtons,
    hideLogo,
    warningTitle,
    warningImageUrl,
    warningImageAlt,
    disableLogoLink,
    hideSubtitle,
    hideCta,
  } = { ...defaultProps, ...props };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="bg-[#191f28] min-h-[600px] flex flex-col">
      {/* Navigation - hideNav가 true면 숨김 */}
      {!hideNav && (
        <nav className="relative">
          <div className="h-16 max-w-[1100px] mx-auto px-6 flex items-center justify-between">
            {disableLogoLink ? (
              <Image
                src={logoWithTextUrl!}
                alt="Piooom"
                width={100}
                height={28}
                className="h-5 w-auto brightness-0 invert"
              />
            ) : (
              <Link href="/">
                <Image
                  src={logoWithTextUrl!}
                  alt="Piooom"
                  width={100}
                  height={28}
                  className="h-5 w-auto brightness-0 invert"
                />
              </Link>
            )}
            {/* Desktop Menu */}
            {!hideNavButtons && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href={loginHref!}
                  className="text-[#3182f6] hover:text-[#1b64da] text-sm font-semibold transition-colors"
                >
                  파트너스 로그인
                </Link>
                <Link
                  href={registerHref!}
                  className="bg-[#3182f6] hover:bg-[#1b64da] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}
            {/* Mobile Hamburger Button */}
            {!hideNavButtons && (
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="메뉴 열기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#B0B8C1" d="M4.118 6.2h16a1.2 1.2 0 100-2.4h-16a1.2 1.2 0 100 2.4m16 4.6h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4m0 7h-16a1.2 1.2 0 100 2.4h16a1.2 1.2 0 100-2.4" fillRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
          {/* Mobile Menu Accordion */}
          {!hideNavButtons && (
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${mobileMenuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-6 py-4 space-y-3 border-t border-[#333d4b]">
                <Link
                  href={loginHref!}
                  className="block w-full text-center text-[#3182f6] border border-[#3182f6] text-base font-semibold px-4 py-3 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  파트너스 로그인
                </Link>
                <Link
                  href={registerHref!}
                  className="block w-full text-center bg-white hover:bg-gray-100 text-[#3182f6] text-base font-semibold px-4 py-3 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            </div>
          )}
        </nav>
      )}

      {/* Hero Content */}
      <div className="flex-1 flex items-center">
        <div className="max-w-[1100px] mx-auto px-6 py-16 lg:py-24 text-center w-full">
          <div className="animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
            {!hideLogo && (
              <Image
                src={logoUrl!}
                alt="Logo"
                width={240}
                height={72}
                className={`h-[72px] w-auto mb-6 mx-auto ${logoClassName || ''}`}
              />
            )}
            {/* 경고 문구 및 이미지 */}
            {warningTitle && (
              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-6">
                {warningTitle}
              </h2>
            )}
            {warningImageUrl && (
              <div className="flex flex-col items-center mb-16">
                {/* 세로선 */}
                <div className="w-[2px] h-16 lg:h-20 bg-white/40 mb-4" />
                {/* 사이렌 이미지 + 글로우 효과 */}
                <div className="relative">
                  {/* 빨간 글로우 배경 */}
                  <div className="absolute inset-0 bg-red-800/30 blur-xl rounded-full scale-150" />
                  <Image
                    src={warningImageUrl}
                    alt={warningImageAlt || '경고 이미지'}
                    width={160}
                    height={160}
                    className="relative w-32 h-32 lg:w-40 lg:h-40 object-contain"
                  />
                </div>
              </div>
            )}
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-8">
              {title}
            </h1>
            {!hideSubtitle && (
              <p className="text-white/70 text-lg lg:text-xl max-w-2xl mx-auto mb-12">
                {subtitle}
              </p>
            )}
            {!hideCta && (
              <Link
                href={ctaHref!}
                className="inline-flex items-center gap-2 bg-[#3182f6] hover:bg-[#1b64da] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
              >
                {ctaText}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
