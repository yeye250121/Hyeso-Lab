'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

// PDP 상단 이미지 스와이퍼. 이미지가 없으면 플레이스홀더 한 장으로 동작한다.
export default function ImageSwiper({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = Math.max(images.length, 1);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative" data-testid="pdp-swiper">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:rounded-3xl"
      >
        {images.length > 0 ? (
          images.map((src, i) => (
            <div
              key={src}
              className="relative snap-start shrink-0 w-full aspect-square bg-white"
            >
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt} 이미지 ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
                priority={i === 0}
              />
            </div>
          ))
        ) : (
          <div className="relative snap-start shrink-0 w-full aspect-square bg-gradient-to-b from-[#f6f8fb] to-[#eef1f6] flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" strokeWidth={1.2} />
          </div>
        )}
      </div>

      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/25 text-white text-[11px] font-medium tabular-nums">
        {index + 1} | {count}
      </span>
    </div>
  );
}
