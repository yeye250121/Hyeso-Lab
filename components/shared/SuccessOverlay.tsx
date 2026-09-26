'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import SuccessCheck from './SuccessCheck';

// 접수 완료 전체 화면. 뒤 화면을 뿌옇게 덮어 가운데 아이콘·애니메이션·완료 문구에만
// 시선이 가게 한다. 제출이 시작되면 로딩 원이 돌고, 접수가 끝나면 체크가 터지며
// 그때 문구와 버튼이 나타난다.
export default function SuccessOverlay({
  done,
  caption,
  title,
  description,
  actions,
  testId,
}: {
  done: boolean;
  /** 제목 위의 작은 안내. 예: "상담 신청 완료" */
  caption?: string;
  title: string;
  description?: React.ReactNode;
  /** 화면 하단 버튼들 */
  actions?: React.ReactNode;
  testId?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 뒤 화면이 스크롤되지 않게
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  const reveal = (delay: string) =>
    `transition-all duration-500 ${delay} ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-white/85 backdrop-blur-md flex flex-col animate-[fadeIn_.2s_ease-out]"
      data-testid={testId}
      data-done={done}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className={reveal('')}>
          {caption && <p className="text-[15px] font-medium text-[var(--action-primary)]">{caption}</p>}
          <h2 className="mt-1 text-[24px] font-semibold text-[#333d4b] leading-snug">{title}</h2>
        </div>
        <SuccessCheck done={done} onFinished={() => setRevealed(true)} size={260} />
        {description && (
          <div className={`text-[15px] text-gray-500 leading-relaxed ${reveal('delay-100')}`}>{description}</div>
        )}
      </div>
      {actions && (
        <div
          className={`w-full max-w-[560px] mx-auto px-6 pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col gap-2.5 ${reveal('delay-150')}`}
        >
          {actions}
        </div>
      )}
    </div>,
    document.body
  );
}
