'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// 데스크톱 상품 상세에서 "신청하기"를 누르면 페이지를 떠나지 않고, 원래 화면을 살짝 흐리게 한 뒤
// 오른쪽에서 신청서가 밀려 들어온다. 신청서는 같은 페이지(/electronics/application?embed=1)를
// iframe 으로 띄운다 — 폼·검증·제출을 한 벌만 유지하고, 상세 페이지가 상품 목록을 다시 받지 않아도 된다.
const CLOSE_MS = 280;

export default function ApplyDrawer({ src, onClose }: { src: string | null; onClose: () => void }) {
  const open = src !== null;
  const [rendered, setRendered] = useState(open);
  const [shown, setShown] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setLastSrc(src);
      setRendered(true);
      // 다음 프레임에 열림 상태로 바꿔야 슬라이드 전환이 걸린다
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => setRendered(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    // 신청서 안에서 "닫기"를 요청하는 경우(첫 화면에서 이전 등)
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === 'bl:apply-close') onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('message', onMessage);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('message', onMessage);
    };
  }, [open, onClose]);

  if (!mounted || !rendered || !lastSrc) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]" data-testid="apply-drawer" data-state={shown ? 'open' : 'closed'}>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        data-testid="apply-drawer-dim"
        className={`absolute inset-0 bg-[#333d4b]/25 backdrop-blur-[3px] transition-opacity duration-300 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-label="신청서 작성"
        className={`absolute top-3 bottom-3 right-3 w-[430px] max-w-[calc(100vw-1.5rem)] rounded-[28px] bg-white shadow-[0_16px_48px_rgba(51,61,75,0.22)] overflow-hidden transition-transform duration-[280ms] ease-out ${
          shown ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-gray-400 hover:text-[#333d4b] shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>
        <iframe src={lastSrc} title="신청서 작성" className="w-full h-full border-0" />
      </aside>
    </div>,
    document.body
  );
}
