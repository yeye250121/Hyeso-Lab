'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronDown, CircleCheck, Loader2, X } from 'lucide-react';

// 명세서(리드) 폼. 카드·인터넷·가전렌탈 공통 입구(/apply).
// 협력업체가 전화하는 데 꼭 필요한 건 전화번호 하나라 필수는 전화번호와 동의뿐이다.
// 정확한 상품·요금제는 상담원이 다시 정한다. 접수되면 알림톡으로 신청서 링크를 보낸다.

export type LeadService = 'card' | 'internet' | 'electronics';

export type LeadProduct = {
  slug: string;
  brand: string;
  display_name: string;
  category_slug: string;
  minFee: number;
};

const ICON_BASE = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/icons';

export const LEAD_SERVICES: { key: LeadService; label: string; icon: string }[] = [
  { key: 'card', label: '카드', icon: `${ICON_BASE}/card_icon.png` },
  { key: 'internet', label: '인터넷', icon: `${ICON_BASE}/internet_icon.png` },
  { key: 'electronics', label: '가전렌탈', icon: `${ICON_BASE}/electronics_icon.png` },
];

export const LEAD_AGREEMENTS = [
  { key: 'privacy', label: '개인정보 수집 및 활용 동의', required: true },
  { key: 'third_party', label: '개인정보 제3자 제공 및 활용 동의', required: true },
  { key: 'age14', label: '만 14세 이상입니다', required: true },
  { key: 'marketing', label: '마케팅 정보 수신 동의', required: false },
] as const;

/** 010-1234-5678 형태로 정규화 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function isValidPhone(v: string): boolean {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(v);
}

function monthsLabel(m: number) {
  return m % 12 === 0 ? `${m / 12}년 약정` : `${m}개월 약정`;
}

export default function LeadForm({
  initialService,
  initialProduct,
  initialPlanId,
  initialContractMonths,
  initialCareType,
  initialCategory,
}: {
  initialService?: LeadService;
  /** 가전렌탈 상세에서 고른 상품. 있으면 서비스는 가전렌탈로 고정해 시작한다 */
  initialProduct?: LeadProduct | null;
  initialPlanId?: string;
  initialContractMonths?: number;
  initialCareType?: string;
  initialCategory?: string;
}) {
  const [service, setService] = useState<LeadService | null>(
    initialProduct || initialCategory ? 'electronics' : initialService ?? null
  );
  const [product, setProduct] = useState<LeadProduct | null>(initialProduct ?? null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [agreementsOpen, setAgreementsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const allAgreed = LEAD_AGREEMENTS.every((a) => agreements[a.key]);
  const requiredAgreed = LEAD_AGREEMENTS.filter((a) => a.required).every((a) => agreements[a.key]);
  const serviceError = !service ? '어떤 혜택을 알아볼지 골라주세요.' : null;
  const phoneError = !isValidPhone(phone) ? '휴대폰 번호를 정확히 입력해주세요.' : null;
  const agreeError = !requiredAgreed ? '필수 항목에 동의해주세요.' : null;
  const canSubmit = !serviceError && !phoneError && !agreeError;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const a of LEAD_AGREEMENTS) next[a.key] = checked;
    setAgreements(next);
  };

  const submit = async () => {
    setTouched(true);
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const withProduct = service === 'electronics' && product;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          phoneNumber: phone,
          applicantName: name,
          categorySlug: service === 'electronics' ? product?.category_slug ?? initialCategory ?? null : null,
          productSlug: withProduct ? product.slug : null,
          planId: withProduct ? initialPlanId ?? null : null,
          contractMonths: withProduct ? initialContractMonths ?? null : null,
          careType: withProduct ? initialCareType ?? null : null,
          agreedMarketing: !!agreements.marketing,
          referrerUrl: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? '신청 처리 중 문제가 발생했습니다.');
      setDoneId(json.id ?? '');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '신청 처리 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (doneId !== null) {
    const showApplication = service === 'electronics' && doneId;
    return (
      <div className="px-6 py-14 text-center" data-testid="lead-done">
        <CircleCheck className="w-14 h-14 text-[var(--action-primary)] mx-auto mb-5" strokeWidth={1.5} />
        <h2 className="text-[22px] font-semibold text-[#333d4b]">전문가가 오늘 중 연락드려요</h2>
        <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
          <span className="font-semibold text-[#333d4b]">{phone}</span> 로 전화드릴게요.
          {showApplication && (
            <>
              <br />
              카카오톡으로 신청서 링크도 보내드려요.
            </>
          )}
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          {showApplication && (
            <Link
              href={`/electronics/application?lead=${doneId}`}
              data-testid="lead-done-application"
              className="inline-flex items-center justify-center h-12 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors"
            >
              지금 바로 신청서 작성하기
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[#333d4b] font-medium transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 sm:px-7 sm:py-8" data-testid="lead-form">
      {/* 서비스 선택 */}
      <div className="grid grid-cols-3 gap-2.5">
        {LEAD_SERVICES.map((s) => {
          const active = service === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setService(s.key)}
              aria-pressed={active}
              data-testid={`lead-service-${s.key}`}
              className={`flex flex-col items-center justify-center gap-1.5 h-[96px] rounded-2xl transition-colors ${
                active ? 'bg-[#fff1f5] ring-2 ring-[#ff9ebb]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'
              }`}
            >
              <Image src={s.icon} alt="" width={44} height={44} className="w-11 h-11 object-contain" />
              <span
                className={`text-[13px] font-medium ${active ? 'text-[var(--action-primary)]' : 'text-[#333d4b]'}`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
      {touched && serviceError && <p className="mt-1.5 text-xs text-red-500">{serviceError}</p>}

      {/* 가전렌탈 상세에서 고른 상품 */}
      {service === 'electronics' && product && (
        <div
          data-testid="lead-product-selected"
          className="mt-3 flex items-start gap-3 rounded-2xl bg-[#f2f4f6] px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-400">{product.brand}</p>
            <p className="text-sm font-semibold text-[#333d4b] truncate">{product.display_name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {[
                initialContractMonths ? monthsLabel(initialContractMonths) : null,
                initialCareType,
                `월 ${product.minFee.toLocaleString()}원~`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProduct(null)}
            aria-label="상품 선택 해제"
            className="shrink-0 p-1 -m-1 text-gray-400 hover:text-[#333d4b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 이름 · 전화번호 */}
      <div className="mt-5 space-y-2.5">
        <FieldBox label="이름">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            autoComplete="name"
            data-testid="lead-name"
            className="w-full bg-transparent text-[15px] text-[#333d4b] placeholder-gray-400 focus:outline-none"
          />
        </FieldBox>
        <FieldBox label="휴대폰 번호" required error={touched ? phoneError : null}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="휴대폰번호를 입력해주세요"
            inputMode="numeric"
            autoComplete="tel"
            data-testid="lead-phone"
            className="w-full bg-transparent text-[15px] text-[#333d4b] placeholder-gray-400 focus:outline-none"
          />
        </FieldBox>
      </div>

      {/* 동의 */}
      <div className="mt-5 rounded-2xl bg-[#f2f4f6] px-4">
        <div className="flex items-center gap-3 py-3.5">
          <CheckBox checked={allAgreed} onChange={toggleAll} testId="lead-agree-all" label="전체 동의" />
          <button
            type="button"
            onClick={() => setAgreementsOpen((v) => !v)}
            aria-expanded={agreementsOpen}
            aria-label="동의 항목 펼치기"
            className="ml-auto p-1 -m-1 text-gray-400"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${agreementsOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {agreementsOpen && (
          <ul className="border-t border-white py-2">
            {LEAD_AGREEMENTS.map((a) => (
              <li key={a.key} className="py-2">
                <CheckBox
                  checked={!!agreements[a.key]}
                  onChange={(v) => setAgreements((prev) => ({ ...prev, [a.key]: v }))}
                  testId={`lead-agree-${a.key}`}
                  label={
                    <>
                      <span className={a.required ? 'text-[#333d4b]' : 'text-gray-400'}>
                        ({a.required ? '필수' : '선택'})
                      </span>{' '}
                      {a.label}
                    </>
                  }
                  small
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {touched && agreeError && <p className="mt-1.5 text-xs text-red-500">{agreeError}</p>}

      {submitError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        data-testid="lead-submit"
        className={`mt-5 w-full h-[52px] rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
          canSubmit
            ? 'bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white'
            : 'bg-[#ffd0dc] text-white'
        } disabled:opacity-60`}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? '접수 중…' : '혜택 안내 받기'}
      </button>
    </div>
  );
}

/* ── 작은 UI 조각들 ── */

function FieldBox({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`block rounded-2xl bg-[#f2f4f6] px-4 pt-2.5 pb-3 transition-shadow focus-within:ring-2 ${
          error ? 'ring-2 ring-red-300' : 'focus-within:ring-[#ffc2d2]'
        }`}
      >
        <span className="block text-xs text-gray-500 mb-1">
          {label}
          {required && <span className="text-[var(--action-primary)] ml-0.5">*</span>}
        </span>
        {children}
      </label>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function CheckBox({
  checked,
  onChange,
  label,
  testId,
  small,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  testId?: string;
  small?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`pointer-events-none flex items-center justify-center shrink-0 rounded-md border transition-colors ${
          small ? 'w-[18px] h-[18px]' : 'w-5 h-5'
        } ${
          checked
            ? 'border-[var(--action-primary)] bg-[var(--action-primary)] text-white'
            : 'border-transparent bg-white text-transparent'
        } peer-focus-visible:ring-2 peer-focus-visible:ring-[#ffc2d2]`}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
      <span
        className={small ? 'text-[13px] text-gray-600 leading-snug' : 'text-[15px] font-medium text-[#333d4b]'}
      >
        {label}
      </span>
    </label>
  );
}
