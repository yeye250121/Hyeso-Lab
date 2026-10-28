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

// 하트: 속은 밋밋한 반투명 흰색, 연한 회색 테두리만 살짝. 찜하면 분홍으로 채움.
function GlassHeart({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className="transition-colors">
      <path
        d={HEART}
        fill={active ? '#ff8fab' : 'rgba(255,255,255,0.55)'}
        stroke={active ? '#ff8fab' : '#d1d6db'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';
