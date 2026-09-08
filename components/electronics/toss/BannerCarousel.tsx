'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

// 텍스트 기반 프로모 배너. 이미지 소재가 아직 없어 파스텔 배경 + 문구로 구성하고,
// 소재가 생기면 slide 에 이미지를 붙이면 된다. 우하단 n|N 인디케이터.
export type BannerSlide = {
  eyebrow: string;
  title: string;
  caption?: string;
  href: string;
  /** tailwind 배경 클래스 (파스텔) */
  bg: string;
};

export default function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (slides.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={onScroll}
        data-testid="banner-carousel"
        className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {slides.map((slide) => (
          <Link
            key={slide.title}
            href={slide.href}
            className={`snap-start shrink-0 w-full ${slide.bg} px-6 py-7`}
          >
            <p className="text-[13px] font-bold text-[var(--action-primary)]">{slide.eyebrow}</p>
            <p className="mt-1.5 text-xl font-bold text-[#333d4b] leading-snug whitespace-pre-line">
              {slide.title}
            </p>
            {slide.caption && <p className="mt-2 text-[13px] text-gray-500">{slide.caption}</p>}
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/25 text-white text-[11px] font-medium tabular-nums">
          {index + 1} | {slides.length}
        </span>
      )}
    </div>
  );
}
