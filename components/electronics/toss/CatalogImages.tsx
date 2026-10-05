'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 상세페이지 카탈로그(브랜드 공식 자료). 세로로 아주 길어서 처음엔 접어 두고 버튼으로 편다.
// 이미지는 올릴 때 이미 폭 860px webp 조각으로 잘라 두었으므로 최적화기를 거치지 않고 그대로 쓴다.
// 주소 끝의 ?w=&h= 는 자리를 미리 잡아 화면이 밀리지 않게 하려는 크기 정보다.

const COLLAPSED_HEIGHT = 720;

function sizeOf(src: string) {
  const m = src.match(/[?&]w=(\d+)&h=(\d+)/);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

export default function CatalogImages({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState(false);
  if (images.length === 0) return null;

  return (
    <div data-testid="catalog-images">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={open ? undefined : { maxHeight: COLLAPSED_HEIGHT }}
      >
        <div className="mx-auto max-w-[860px] lg:max-w-[645px]">
          {images.map((src, i) => {
            const size = sizeOf(src);
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={i === 0 ? `${alt} 상세 이미지` : ''}
                width={size?.width}
                height={size?.height}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="block w-full h-auto"
              />
            );
          })}
        </div>
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="catalog-toggle"
        className="mt-3 flex w-full items-center justify-center gap-1 h-12 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[15px] font-medium text-[#333d4b] transition-colors"
      >
        {open ? '상세정보 접기' : '상세정보 펼쳐보기'}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
