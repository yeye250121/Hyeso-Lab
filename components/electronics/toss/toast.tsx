'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck } from 'lucide-react';

// 화면 하단에 잠깐 떠 있는 토스트. 전역 상태 라이브러리 없이
// 커스텀 이벤트로 띄운다. ToastHost 는 app/electronics/layout.tsx 에 한 번만 둔다.
type ToastPayload = {
  message: string;
  action?: { label: string; href: string };
};

const EVENT = 'bl:toast';

export function showToast(message: string, action?: ToastPayload['action']) {
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: { message, action } }));
}

export function ToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setToast((e as CustomEvent<ToastPayload>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 2500);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      data-testid="toast"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 max-w-[calc(100vw-3rem)] px-4 py-3 rounded-2xl bg-[#333d4b]/95 text-white text-sm shadow-lg animate-[fadeInUp_.2s_ease-out]"
    >
      <CircleCheck className="w-4 h-4 text-[var(--action-primary)] shrink-0" />
      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{toast.message}</span>
      {toast.action && (
        <Link
          href={toast.action.href}
          onClick={() => setToast(null)}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-white/15 font-bold text-xs whitespace-nowrap"
        >
          {toast.action.label}
        </Link>
      )}
    </div>
  );
}
