'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// 약관 동의 바텀시트. 상품을 고른 직후 한 번 띄워서 필수 약관을 받고 다음 단계로 넘어간다.
export type Agreement = { key: string; label: string; required: boolean };

export default function AgreementSheet({
  open,
  agreements,
  value,
  onChange,
  onClose,
  onConfirm,
}: {
  open: boolean;
  agreements: readonly Agreement[];
  value: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const all = agreements.every((a) => value[a.key]);
  const requiredOk = agreements.filter((a) => a.required).every((a) => value[a.key]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" data-testid="agreement-sheet">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-label="약관 동의"
        className="relative w-full max-w-[560px] max-h-[80vh] flex flex-col rounded-t-3xl bg-white pt-6 pb-[max(env(safe-area-inset-bottom),16px)] animate-[sheetUp_.25s_ease-out]"
      >
        <div className="flex items-center justify-between px-6 pb-4">
          <p className="text-xl font-semibold text-[#333d4b]">약관에 동의해주세요</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="p-1 -m-1 text-gray-400 hover:text-[#333d4b]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto px-6">
          <label className="flex items-center gap-3 cursor-pointer rounded-xl bg-[#f8f9fb] px-4 py-3.5">
            <input
              type="checkbox"
              checked={all}
              data-testid="agree-all"
              onChange={(e) => {
                const next: Record<string, boolean> = {};
                for (const a of agreements) next[a.key] = e.target.checked;
                onChange(next);
              }}
              className="w-5 h-5 accent-[var(--action-primary)]"
            />
            <span className="font-semibold text-[#333d4b]">전체 동의</span>
          </label>
          <ul className="pt-2 pb-2">
            {agreements.map((a) => (
              <li key={a.key}>
                <label className="flex items-center gap-3 cursor-pointer px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!value[a.key]}
                    onChange={(e) => onChange({ ...value, [a.key]: e.target.checked })}
                    className="w-4 h-4 accent-[var(--action-primary)] shrink-0"
                  />
                  <span className="text-sm text-gray-600 flex-1">
                    <span className={a.required ? 'text-[#333d4b] font-medium' : 'text-gray-400'}>[{a.required ? '필수' : '선택'}]</span>{' '}
                    {a.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 pt-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!requiredOk}
            data-testid="agree-confirm"
            className="w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold transition-colors"
          >
            동의하고 계속하기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
