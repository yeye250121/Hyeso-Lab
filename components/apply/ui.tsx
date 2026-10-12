'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

// 신청서 공용 UI 조각. 가전렌탈·인터넷 신청서가 같은 생김새·같은 자동 넘김 규약을 쓴다.
//  - data-af="<key>": 자동 넘김이 다음 칸을 찾을 때 쓰는 이름
//  - data-af-open: 포커스 대신 click() 으로 여는 칸(바텀시트 선택)
//  - data-field-error: 오류 문구. "다음"을 눌렀을 때 첫 오류로 스크롤한다

export function BridgeRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-gray-500">{k}</dt>
      <dd className="flex-1 min-w-0 font-medium text-[#333d4b]">{v}</dd>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug mb-8 whitespace-pre-line">
        {title}
      </h1>
      {children}
    </div>
  );
}

export function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-sm font-semibold text-[#333d4b] mb-2.5">
      {children}
      {required && <span className="text-[var(--action-primary)] ml-0.5">*</span>}
    </p>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p data-field-error className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <Label required={required}>{label}</Label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  af,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email';
  autoComplete?: string;
  /** 자동 넘김이 이 칸을 찾을 때 쓰는 이름 */
  af?: string;
  /** 키보드의 엔터(다음)를 눌렀을 때 */
  onEnter?: () => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      data-af={af}
      enterKeyHint={onEnter ? 'next' : undefined}
      onKeyDown={(e) => {
        // 한글 조합 중의 엔터는 글자 확정이므로 넘기지 않는다
        if (e.key !== 'Enter' || e.nativeEvent.isComposing || !onEnter) return;
        e.preventDefault();
        onEnter();
      }}
      className="w-full py-3.5 px-4 rounded-xl bg-[#f2f4f6] border-0 focus:outline-none focus:ring-2 focus:ring-[#ffc2d2] text-[15px] placeholder-gray-400 transition-shadow"
    />
  );
}

/** 2단계에서 새로 나타나는 항목. 살짝 올라오며 등장한다 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // 새 항목이 하단 고정 버튼 밑에 가려지지 않도록 보이는 곳까지 끌어올린다
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);
  return (
    <div ref={ref} className="scroll-mb-28 animate-[sheetUp_.25s_ease-out]">
      {children}
    </div>
  );
}

/** 네이티브 select 대신 바텀시트로 고른다. 모바일에서 OS 피커가 뜨는 걸 피한다 */
export function SheetSelect({
  name,
  title,
  value,
  onChange,
  options,
  placeholder,
  af,
}: {
  name: string;
  title: string;
  /** 자동 넘김 대상이면 이름을 준다. 넘어오면 시트가 바로 열린다 */
  af?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid={`sheet-select-${name}`}
        data-af={af}
        data-af-open={af ? '' : undefined}
        className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[15px] text-left transition-colors ${
          value ? 'text-[#333d4b]' : 'text-gray-400'
        }`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setOpen(false)}
              data-testid={`sheet-dim-${name}`}
              className="absolute inset-0 bg-black/40"
            />
            <div
              role="dialog"
              aria-label={title}
              data-testid={`sheet-${name}`}
              className="relative w-full max-w-[560px] max-h-[70vh] flex flex-col rounded-t-3xl bg-white pt-5 pb-[max(env(safe-area-inset-bottom),16px)] animate-[sheetUp_.25s_ease-out]"
            >
              <div className="flex items-center justify-between px-5 pb-3">
                <p className="text-lg font-semibold text-[#333d4b]">{title}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="닫기"
                  className="p-1 -m-1 text-gray-400 hover:text-[#333d4b]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="overflow-y-auto px-2">
                {options.map((o) => {
                  const active = o === value;
                  return (
                    <li key={o}>
                      <button
                        type="button"
                        onClick={() => pick(o)}
                        data-testid={`sheet-option-${o}`}
                        className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl text-[15px] text-left transition-colors ${
                          active
                            ? 'text-[var(--action-primary)] font-semibold bg-[#fff1f5]'
                            : 'text-[#333d4b] hover:bg-gray-50'
                        }`}
                      >
                        {o}
                        {active && <Check className="w-4 h-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function Choice({
  active,
  onClick,
  label,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl font-semibold transition-colors text-center ${
        compact ? 'py-2.5 px-2 text-sm' : 'py-4 px-3 text-[15px]'
      } ${
        active
          ? 'bg-[#fff1f5] text-[var(--action-primary)] ring-2 ring-[#ff9ebb]'
          : 'bg-[#f2f4f6] text-gray-600 hover:bg-[#eceef1]'
      }`}
    >
      {label}
    </button>
  );
}
