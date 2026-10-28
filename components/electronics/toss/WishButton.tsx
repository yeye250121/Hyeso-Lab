'use client';

import { Heart } from 'lucide-react';
import { useWishlist, type WishItem } from './useWishlist';
import { showToast } from './toast';

export default function WishButton({
  item,
  variant = 'overlay',
}: {
  item: Omit<WishItem, 'addedAt'>;
  /** overlay = 카드 이미지 위 반투명 / bar = 스티키바의 보더 버튼 */
  variant?: 'overlay' | 'bar';
}) {
  const { has, toggle } = useWishlist();
  const active = has(item.slug);

  const onClick = (e: React.MouseEvent) => {
    // 카드 전체가 링크라 하트 클릭이 상세로 이동하지 않게 막는다
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(item);
    showToast(
      added ? '찜 목록에 담았어요' : '찜을 해제했어요',
      added ? { label: '보러가기', href: '/electronics/wishlist' } : undefined
    );
  };

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid="wish-toggle"
        aria-label={active ? '찜 해제' : '찜하기'}
        aria-pressed={active}
        className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white shrink-0 transition-colors hover:bg-gray-50"
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            active ? 'fill-[var(--action-primary)] text-[var(--action-primary)]' : 'text-gray-400'
          }`}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="wish-toggle"
      aria-label={active ? '찜 해제' : '찜하기'}
      aria-pressed={active}
      className="absolute bottom-2 right-2 p-1.5"
    >
      <GlassHeart active={active} />
    </button>
  );
}

// 유리 질감 하트: 반투명 흰 그라데이션 채움 + 연한 회색 테두리 + 윗부분 광택. 찜하면 분홍 유리.
function GlassHeart({ active }: { active: boolean }) {
  const id = active ? 'wh-on' : 'wh-off';
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          {active ? (
            <>
              <stop offset="0" stopColor="#ffb3c6" />
              <stop offset="1" stopColor="#ff7096" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#e5e8eb" stopOpacity="0.6" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={HEART} />
        </clipPath>
      </defs>
      <path d={HEART} fill={`url(#${id}-fill)`} stroke={active ? '#ff8fab' : '#d1d6db'} strokeWidth="1.2" strokeLinejoin="round" />
      {/* 광택: 하트 윗부분에 걸친 타원 */}
      <ellipse cx="9" cy="6.5" rx="6.5" ry="3.2" fill={`url(#${id}-gloss)`} clipPath={`url(#${id}-clip)`} />
    </svg>
  );
}

const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';
