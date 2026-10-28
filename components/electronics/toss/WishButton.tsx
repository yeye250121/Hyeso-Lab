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
      // 유리알 느낌: 반투명 흰 배경 + 블러 + 얇은 흰 테두리 + 안쪽 하이라이트. 하트 선은 아주 연한 회색.
      className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center bg-white/45 backdrop-blur-md backdrop-saturate-150 border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:bg-white/60"
    >
      <Heart
        className={`w-[18px] h-[18px] transition-colors ${
          active ? 'fill-[var(--action-primary)] text-[var(--action-primary)]' : 'fill-transparent text-[#c5ccd3]'
        }`}
        strokeWidth={1.8}
      />
    </button>
  );
}
