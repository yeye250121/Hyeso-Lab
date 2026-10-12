'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { X } from 'lucide-react';

// 주소 찾기. 새 창 팝업 대신 화면 안 모달에 끼워 넣는다(모바일에서 창이 튀지 않고 톤도 맞출 수 있다).
// usePostcode() 로 준비 상태와 열기 함수를 받고, <PostcodeModal> 을 폼 안에 한 번 그린다.

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
        theme?: Record<string, string>;
      }) => { open: () => void; embed: (el: HTMLElement) => void };
    };
  }
}

export type PostcodeResult = { zonecode: string; address: string };

export function usePostcode() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const openPostcode = () => {
    if (!window.daum?.Postcode) return;
    setOpen(true);
  };
  return { ready, setReady, open, setOpen, openPostcode };
}

export default function PostcodeModal({
  open,
  onClose,
  onReady,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onReady: () => void;
  onComplete: (r: PostcodeResult) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !boxRef.current || !window.daum?.Postcode) return;
    const box = boxRef.current;
    box.innerHTML = '';
    new window.daum.Postcode({
      oncomplete: (data) => onComplete({ zonecode: data.zonecode, address: data.roadAddress || data.jibunAddress }),
      width: '100%',
      height: '100%',
      theme: {
        bgColor: '#FFFFFF',
        searchBgColor: '#F2F4F6',
        contentBgColor: '#FFFFFF',
        pageBgColor: '#FFFFFF',
        textColor: '#333D4B',
        queryTextColor: '#333D4B',
        postcodeTextColor: '#8B95A1',
        emphTextColor: '#FF7096',
        outlineColor: '#E5E8EB',
      },
    }).embed(box);
    // 열려 있는 동안 뒤 화면 스크롤 잠금
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        // onLoad 는 스크립트를 처음 받을 때만 불린다. 신청서를 다시 열면(이미 받은 상태) 불리지 않아
        // 주소 찾기 버튼이 계속 잠겨 있었다. onReady 는 화면에 붙을 때마다 불린다.
        onReady={onReady}
      />
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" data-testid="postcode-modal">
          <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative w-full sm:max-w-[480px] h-[78vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white overflow-hidden animate-[sheetUp_.25s_ease-out]">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <p className="text-xl font-semibold text-[#333d4b]">주소 찾기</p>
              <button type="button" onClick={onClose} aria-label="닫기" className="p-1 -m-1 text-gray-400 hover:text-[#333d4b]">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div ref={boxRef} className="flex-1 min-h-0 px-2 pb-2" />
          </div>
        </div>
      )}
    </>
  );
}
