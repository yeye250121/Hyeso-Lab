'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CardImageGalleryProps {
  images: string[];
  alt: string;
}

export default function CardImageGallery({ images, alt }: CardImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative w-[260px] h-[260px] md:w-[340px] md:h-[340px] group transform transition-transform hover:scale-105"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 이미지 렌더링 (페이드 효과) */}
      <div className="relative w-full h-full">
        {images.map((img, idx) => (
          <div 
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <Image 
              src={img} 
              alt={`${alt} 디자인 ${idx + 1}`} 
              fill 
              className="object-contain drop-shadow-2xl select-none pointer-events-none" 
            />
          </div>
        ))}
      </div>

      {/* 좌우 화살표 (2개 이상일 때만 노출, 닷 인디케이터 제거 및 미니멀 화살표) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.preventDefault(); prevSlide(); }}
            className="absolute left-[-30px] md:left-[-40px] top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-all z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 drop-shadow-sm" />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); nextSlide(); }}
            className="absolute right-[-30px] md:right-[-40px] top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-all z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10 drop-shadow-sm" />
          </button>

          {/* 하단 닷 인디케이터 복구 */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
