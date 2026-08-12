'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Droplets,
  Info,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';
import type { ProductListItem } from '@/lib/electronicsApi';
import {
  AGREEMENTS,
  BANKS,
  CARRIERS,
  CUSTOMER_TYPES,
  GENDERS,
  GIFT_RECEIVERS,
  INITIAL_STATE,
  PAYMENT_METHODS,
  STEPS,
  formatBirth,
  formatPhone,
  isValidAccount,
  isValidBirth,
  isValidEmail,
  isValidPhone,
  type ApplyFormState,
} from './applyConstants';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
        onclose?: () => void;
      }) => { open: () => void };
    };
  }
}

const TOTAL = STEPS.length;

function monthsLabel(m: number) {
  return m % 12 === 0 ? `${m / 12}년 약정` : `${m}개월 약정`;
}

export default function ApplyForm({
  products,
  initialProductSlug,
  initialPlanId,
  initialCategory,
}: {
  products: ProductListItem[];
  initialProductSlug?: string;
  initialPlanId?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ApplyFormState>({
    ...INITIAL_STATE,
    productSlug: initialProductSlug ?? null,
    planId: initialPlanId ?? null,
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof ApplyFormState>(key: K, value: ApplyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = useMemo(
    () => products.find((p) => p.slug === form.productSlug) ?? null,
    [products, form.productSlug]
  );

  // 선택한 제품의 요금제 요약에서 약정/관리방법 후보를 만든다
  const contracts = useMemo(
    () =>
      selectedProduct
        ? [...new Set(selectedProduct.plans.map((s) => s.c))].sort((a, b) => a - b)
        : [],
    [selectedProduct]
  );
  const cares = useMemo(() => {
    if (!selectedProduct || form.contractMonths === null) return [];
    return [
      ...new Set(
        selectedProduct.plans.filter((s) => s.c === form.contractMonths).map((s) => s.t)
      ),
    ];
  }, [selectedProduct, form.contractMonths]);

  const currentFee = useMemo(() => {
    if (!selectedProduct) return null;
    const matches = selectedProduct.plans.filter(
      (s) =>
        (form.contractMonths === null || s.c === form.contractMonths) &&
        (form.careType === null || s.t === form.careType)
    );
    return matches.length ? Math.min(...matches.map((s) => s.f)) : null;
  }, [selectedProduct, form.contractMonths, form.careType]);

  // 제품이 바뀌면 약정/관리 선택을 유효한 값으로 되돌린다
  useEffect(() => {
    if (!selectedProduct) return;
    setForm((f) => {
      const list = selectedProduct.plans;
      const nextContract =
        f.contractMonths !== null && list.some((s) => s.c === f.contractMonths)
          ? f.contractMonths
          : [...new Set(list.map((s) => s.c))].sort((a, b) => a - b)[0] ?? null;
      const careOptions = list.filter((s) => s.c === nextContract).map((s) => s.t);
      const nextCare =
        f.careType !== null && careOptions.includes(f.careType) ? f.careType : careOptions[0] ?? null;
      return { ...f, contractMonths: nextContract, careType: nextCare };
    });
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const base = q
      ? products.filter((p) =>
          `${p.display_name} ${p.brand} ${p.model_code}`.toLowerCase().includes(q)
        )
      : products;
    return base.slice(0, 30);
  }, [products, pickerQuery]);

  /* ── 단계별 유효성 ── */
  const errors = useMemo((): Record<string, string> => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.decideAfterConsult) {
        if (!form.productSlug) e.product = '상품을 선택하거나 "상담 후 결정"을 골라주세요.';
        else if (form.contractMonths === null) e.contract = '약정 기간을 선택해주세요.';
      }
    }
    if (step === 1) {
      if (!form.applicantName.trim()) e.applicantName = '가입자명을 입력해주세요.';
      if (!isValidBirth(form.birthDate)) e.birthDate = '생년월일을 YYYY-MM-DD 형식으로 입력해주세요.';
      if (!form.gender) e.gender = '성별을 선택해주세요.';
      if (!form.carrier) e.carrier = '통신사를 선택해주세요.';
      if (!isValidPhone(form.phoneNumber)) e.phoneNumber = '휴대폰 번호를 정확히 입력해주세요.';
      if (form.useAgentPhone && !isValidPhone(form.agentPhoneNumber))
        e.agentPhoneNumber = '대리인 연락처를 정확히 입력해주세요.';
      if (!isValidEmail(form.email)) e.email = '이메일을 정확히 입력해주세요.';
    }
    if (step === 2) {
      if (!form.address.trim()) e.address = '설치 주소를 검색해주세요.';
      if (!form.addressDetail.trim()) e.addressDetail = '상세주소를 입력해주세요.';
    }
    if (step === 3) {
      if (!form.giftReceiver) e.giftReceiver = '수령자를 선택해주세요.';
      if (!form.giftBank) e.giftBank = '은행을 선택해주세요.';
      if (!isValidAccount(form.giftAccountNumber)) e.giftAccountNumber = '계좌번호를 정확히 입력해주세요.';
    }
    if (step === 4 && !form.paymentSkipped) {
      if (!form.paymentMethod) e.paymentMethod = '납부 방식을 선택해주세요.';
      if (form.paymentMethod === '은행 자동이체' && !form.paymentSameAsGift) {
        if (!form.paymentBank) e.paymentBank = '은행을 선택해주세요.';
        if (!isValidAccount(form.paymentAccountNumber))
          e.paymentAccountNumber = '계좌번호를 정확히 입력해주세요.';
      }
    }
    if (step === 5) {
      const missing = AGREEMENTS.filter((a) => a.required && !form.agreements[a.key]);
      if (missing.length) e.agreements = '필수 약관에 모두 동의해주세요.';
    }
    return e;
  }, [step, form]);

  const canProceed = Object.keys(errors).length === 0;

  const goNext = () => {
    setTouched(true);
    if (!canProceed) return;
    setTouched(false);
    if (step < TOTAL - 1) {
      setStep(step + 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goPrev = () => {
    setTouched(false);
    if (step === 0) router.back();
    else {
      setStep(step - 1);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openPostcode = () => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        set('zonecode', data.zonecode);
        set('address', data.roadAddress || data.jibunAddress);
      },
    }).open();
  };

  const submit = async () => {
    setTouched(true);
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/electronics/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categorySlug: initialCategory ?? null,
          referrerUrl: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? '신청 처리 중 문제가 발생했습니다.');
      setDone(true);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '신청 처리 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 완료 화면 ── */
  if (done) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-20 text-center">
        <CircleCheck className="w-16 h-16 text-[var(--action-primary)] mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-[#333d4b]">신청이 접수되었어요</h1>
        <p className="mt-3 text-gray-500 leading-relaxed">
          담당 상담원이 확인 후 <span className="font-bold text-[#333d4b]">{form.phoneNumber}</span> 로
          <br />
          순차적으로 연락드릴 예정입니다.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/electronics"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-bold transition-colors"
          >
            가전 렌탈 더 보기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#333d4b] font-bold transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  const err = (key: string) => (touched ? errors[key] : undefined);

  return (
    <div className="max-w-[560px] mx-auto px-6 pb-32" ref={topRef}>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
        onLoad={() => setPostcodeReady(true)}
      />

      {/* 진행 표시 */}
      <div className="flex items-center gap-2 pt-8 pb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                i === step
                  ? 'w-6 h-6 bg-[var(--action-primary)] text-white'
                  : i < step
                    ? 'w-2.5 h-2.5 bg-[var(--action-primary)]'
                    : 'w-2.5 h-2.5 bg-gray-200'
              }`}
            >
              {i === step ? i + 1 : ''}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={goPrev}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#333d4b] transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        이전
      </button>

      {/* ───────── 1. 상품 선택 ───────── */}
      {step === 0 && (
        <Section title="원하는 상품을 선택해주세요">
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Choice
              active={!form.decideAfterConsult}
              onClick={() => set('decideAfterConsult', false)}
              label="추천 상품"
            />
            <Choice
              active={form.decideAfterConsult}
              onClick={() => set('decideAfterConsult', true)}
              label="상담 후 결정"
            />
          </div>

          {form.decideAfterConsult ? (
            <p className="flex items-start gap-2 rounded-xl bg-[#f8f9fb] px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
              <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
              사용 환경을 여쭤보고 조건에 맞는 제품을 골라 안내드릴게요.
            </p>
          ) : (
            <>
              <Label>상품 선택</Label>
              <p className="text-xs text-gray-400 mb-3">선택하신 상품 기준으로 맞춤 상담을 해드려요.</p>

              <div className="relative mb-3">
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="브랜드나 모델명 검색"
                  className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--action-primary)] text-sm bg-white"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-400">검색 결과가 없어요.</p>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set('productSlug', p.slug)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                        form.productSlug === p.slug ? 'bg-[#fff1f5]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-12 h-12 rounded-lg bg-gradient-to-b from-[#f6f8fb] to-[#eef1f6] flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11px] font-bold text-gray-400">{p.brand}</span>
                        <span className="block text-sm font-bold text-[#333d4b] truncate">
                          {p.display_name}
                        </span>
                        <span className="block text-[11px] text-gray-400 truncate">{p.model_code}</span>
                      </span>
                      <span className="text-sm font-bold text-[#333d4b] shrink-0 whitespace-nowrap">
                        월 {p.minFee.toLocaleString()}원~
                      </span>
                      {form.productSlug === p.slug && (
                        <Check className="w-4 h-4 text-[var(--action-primary)] shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
              {err('product') && <ErrorText>{err('product')}</ErrorText>}

              {selectedProduct && (
                <div className="mt-8 space-y-6">
                  <div>
                    <Label required>약정 기간</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {contracts.map((c) => (
                        <Choice
                          key={c}
                          active={form.contractMonths === c}
                          onClick={() => set('contractMonths', c)}
                          label={monthsLabel(c)}
                          compact
                        />
                      ))}
                    </div>
                    {err('contract') && <ErrorText>{err('contract')}</ErrorText>}
                  </div>

                  {cares.length > 0 && (
                    <div>
                      <Label required>관리 방법</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {cares.map((c) => (
                          <Choice
                            key={c ?? 'none'}
                            active={form.careType === c}
                            onClick={() => set('careType', c)}
                            label={c ?? '정보 없음'}
                            compact
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {currentFee !== null && (
                    <div className="rounded-2xl bg-[#f8f9fb] p-5 flex items-end justify-between">
                      <div>
                        <p className="text-sm text-gray-500">예상 월 렌탈료</p>
                        {form.contractMonths && (
                          <p className="text-xs text-gray-400 mt-1">
                            총 {(currentFee * form.contractMonths).toLocaleString()}원
                          </p>
                        )}
                      </div>
                      <p className="text-[#333d4b]">
                        <span className="text-2xl font-bold">{currentFee.toLocaleString()}</span>
                        <span className="font-bold">원</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Section>
      )}

      {/* ───────── 2. 가입자 정보 ───────── */}
      {step === 1 && (
        <Section title="가입자 정보를 입력해주세요">
          <Label required>고객 구분</Label>
          <div className="grid grid-cols-2 gap-2 mb-1">
            {CUSTOMER_TYPES.map((t) => (
              <Choice
                key={t}
                active={form.customerType === t}
                onClick={() => set('customerType', t)}
                label={t}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-6">
            사업장 또는 소호 신청인 경우 개인사업자를 선택해주세요.
          </p>

          <Field label="가입자명" required error={err('applicantName')}>
            <Input
              value={form.applicantName}
              onChange={(v) => set('applicantName', v)}
              placeholder="가입자명"
              autoComplete="name"
            />
          </Field>

          <Field label="생년월일" required error={err('birthDate')}>
            <Input
              value={form.birthDate}
              onChange={(v) => set('birthDate', formatBirth(v))}
              placeholder="YYYY-MM-DD"
              inputMode="numeric"
            />
          </Field>

          <Field label="성별" required error={err('gender')}>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <Choice key={g} active={form.gender === g} onClick={() => set('gender', g)} label={g} />
              ))}
            </div>
          </Field>

          <Field label="가입자 명의 연락처" required error={err('carrier') ?? err('phoneNumber')}>
            <div className="space-y-2">
              <Select
                value={form.carrier}
                onChange={(v) => set('carrier', v)}
                placeholder="통신사 선택"
                options={[...CARRIERS]}
              />
              <Input
                value={form.phoneNumber}
                onChange={(v) => set('phoneNumber', formatPhone(v))}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
          </Field>

          {form.useAgentPhone ? (
            <Field label="대리인 연락처" error={err('agentPhoneNumber')}>
              <div className="flex gap-2">
                <Input
                  value={form.agentPhoneNumber}
                  onChange={(v) => set('agentPhoneNumber', formatPhone(v))}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => {
                    set('useAgentPhone', false);
                    set('agentPhoneNumber', '');
                  }}
                  aria-label="대리인 연락처 삭제"
                  className="shrink-0 px-3 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Field>
          ) : (
            <button
              type="button"
              onClick={() => set('useAgentPhone', true)}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 mb-5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              대리인 연락처 추가
            </button>
          )}

          <Field label="이메일" required error={err('email')}>
            <Input
              value={form.email}
              onChange={(v) => set('email', v)}
              placeholder="이메일을 입력하세요"
              type="email"
              autoComplete="email"
            />
          </Field>
        </Section>
      )}

      {/* ───────── 3. 설치 주소 ───────── */}
      {step === 2 && (
        <Section title="설치하실 주소를 알려주세요">
          <Field label="설치 주소" required error={err('address')}>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.address}
                readOnly
                placeholder="주소 찾기를 눌러주세요"
                onClick={openPostcode}
                className="flex-1 min-w-0 py-3.5 px-4 rounded-xl border border-gray-200 bg-white text-[15px] placeholder-gray-400 cursor-pointer focus:outline-none focus:border-[var(--action-primary)]"
              />
              <button
                type="button"
                onClick={openPostcode}
                disabled={!postcodeReady}
                className="shrink-0 px-4 rounded-xl bg-[#333d4b] hover:bg-[#2b3440] disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {postcodeReady ? '주소 찾기' : '준비 중'}
              </button>
            </div>
            {form.zonecode && <p className="mt-1.5 text-xs text-gray-400">우편번호 {form.zonecode}</p>}
          </Field>

          <Field label="상세주소" required error={err('addressDetail')}>
            <Input
              value={form.addressDetail}
              onChange={(v) => set('addressDetail', v)}
              placeholder="동/호수 등 상세주소"
            />
          </Field>

          <p className="flex items-start gap-2 rounded-xl bg-[#f8f9fb] px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
            <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
            설치 가능 지역인지 미리 확인해 드릴게요.
          </p>
        </Section>
      )}

      {/* ───────── 4. 사은품 수령 ───────── */}
      {step === 3 && (
        <Section title="사은품 받으실 정보를 알려주세요">
          <Field label="수령자" required error={err('giftReceiver')}>
            <Select
              value={form.giftReceiver}
              onChange={(v) => set('giftReceiver', v)}
              placeholder="수령자 선택"
              options={[...GIFT_RECEIVERS]}
            />
          </Field>

          <Field label="계좌 정보" required error={err('giftBank') ?? err('giftAccountNumber')}>
            <div className="space-y-2">
              <Select
                value={form.giftBank}
                onChange={(v) => set('giftBank', v)}
                placeholder="은행 선택"
                options={[...BANKS]}
              />
              <Input
                value={form.giftAccountNumber}
                onChange={(v) => set('giftAccountNumber', v.replace(/[^\d-]/g, ''))}
                placeholder="계좌번호 입력 ('-' 없이)"
                inputMode="numeric"
              />
            </div>
          </Field>

          <div className="rounded-xl bg-[#f8f9fb] px-4 py-3.5">
            <p className="text-sm font-bold text-[#333d4b] mb-2">확인해주세요!</p>
            <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed list-disc pl-4">
              <li>현금과 달리 상품권은 본사에서 발송되므로 3~5일 정도 소요될 수 있어요.</li>
              <li>예금주가 가입자 본인과 다를 경우 지급이 지연될 수 있습니다.</li>
            </ul>
          </div>
        </Section>
      )}

      {/* ───────── 5. 납부 방법 ───────── */}
      {step === 4 && (
        <Section title="납부 방법을 알려주세요">
          <Field label="납부 방식" required error={err('paymentMethod')}>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Choice
                  key={m}
                  active={form.paymentMethod === m}
                  onClick={() => {
                    set('paymentMethod', m);
                    set('paymentSkipped', false);
                  }}
                  label={m}
                />
              ))}
            </div>
          </Field>

          {form.paymentMethod === '은행 자동이체' && (
            <div className="rounded-2xl bg-[#f8f9fb] p-4">
              <label className="flex items-center gap-2.5 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={form.paymentSameAsGift}
                  onChange={(e) => set('paymentSameAsGift', e.target.checked)}
                  className="w-4 h-4 accent-[var(--action-primary)]"
                />
                <span className="text-sm font-medium text-[#333d4b]">사은품 받는 계좌와 동일해요</span>
              </label>

              {!form.paymentSameAsGift && (
                <div className="space-y-2">
                  <Select
                    value={form.paymentBank}
                    onChange={(v) => set('paymentBank', v)}
                    placeholder="은행 선택"
                    options={[...BANKS]}
                  />
                  <Input
                    value={form.paymentAccountNumber}
                    onChange={(v) => set('paymentAccountNumber', v.replace(/[^\d-]/g, ''))}
                    placeholder="계좌번호 입력"
                    inputMode="numeric"
                  />
                  {(err('paymentBank') || err('paymentAccountNumber')) && (
                    <ErrorText>{err('paymentBank') ?? err('paymentAccountNumber')}</ErrorText>
                  )}
                </div>
              )}

              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                평생계좌나 카카오뱅크 모임계좌는 사용할 수 없습니다.
              </p>
            </div>
          )}

          {form.paymentMethod === '카드 결제' && (
            <p className="flex items-start gap-2 rounded-xl bg-[#f8f9fb] px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
              <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
              카드 정보는 보안을 위해 이 화면에서 받지 않아요. 상담 시 안전한 경로로 안내드립니다.
            </p>
          )}
        </Section>
      )}

      {/* ───────── 6. 약관 ───────── */}
      {step === 5 && (
        <Section title="약관 내용을 확인해주세요">
          <div className="rounded-2xl bg-[#f8f9fb] p-4">
            <label className="flex items-center gap-3 cursor-pointer pb-4 border-b border-gray-200">
              <input
                type="checkbox"
                checked={AGREEMENTS.every((a) => form.agreements[a.key])}
                onChange={(e) => {
                  const next: Record<string, boolean> = {};
                  for (const a of AGREEMENTS) next[a.key] = e.target.checked;
                  set('agreements', next);
                }}
                className="w-5 h-5 accent-[var(--action-primary)]"
              />
              <span className="font-bold text-[#333d4b]">전체 동의</span>
            </label>

            <ul className="pt-2">
              {AGREEMENTS.map((a) => (
                <li key={a.key}>
                  <label className="flex items-center gap-3 cursor-pointer py-2.5">
                    <input
                      type="checkbox"
                      checked={!!form.agreements[a.key]}
                      onChange={(e) =>
                        set('agreements', { ...form.agreements, [a.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-[var(--action-primary)] shrink-0"
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      <span className={a.required ? 'text-[#333d4b] font-medium' : 'text-gray-400'}>
                        [{a.required ? '필수' : '선택'}]
                      </span>{' '}
                      {a.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          {err('agreements') && <ErrorText>{err('agreements')}</ErrorText>}

          <div className="mt-6">
            <Label>고객 요청사항</Label>
            <textarea
              value={form.customerNote}
              onChange={(e) => set('customerNote', e.target.value)}
              rows={4}
              placeholder="요청사항을 입력해주세요"
              className="w-full py-3.5 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--action-primary)] text-[15px] placeholder-gray-400 resize-none"
            />
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
          )}
        </Section>
      )}

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-[560px] mx-auto">
          {step === TOTAL - 1 ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:opacity-60 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? '제출 중…' : '제출하기'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={goNext}
                className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  canProceed
                    ? 'bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
              {step === 4 && (
                <button
                  type="button"
                  onClick={() => {
                    set('paymentSkipped', true);
                    setTouched(false);
                    setStep(5);
                  }}
                  className="w-full mt-2 py-2 text-sm font-bold text-gray-400 hover:text-[#333d4b] transition-colors"
                >
                  나중에
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 작은 UI 조각들 ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-[26px] font-bold text-[#333d4b] leading-snug mb-8 whitespace-pre-line">
        {title}
      </h1>
      {children}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-sm font-bold text-[#333d4b] mb-2.5">
      {children}
      {required && <span className="text-[var(--action-primary)] ml-0.5">*</span>}
    </p>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-red-500">{children}</p>;
}

function Field({
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

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email';
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      className="w-full py-3.5 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)] text-[15px] placeholder-gray-400 bg-white transition-all"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full py-3.5 px-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[var(--action-primary)] text-[15px] bg-white cursor-pointer transition-all ${
        value ? 'text-[#333d4b]' : 'text-gray-400'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o} className="text-[#333d4b]">
          {o}
        </option>
      ))}
    </select>
  );
}

function Choice({
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
      className={`rounded-xl border font-bold transition-all text-center ${
        compact ? 'py-2.5 px-2 text-sm' : 'py-4 px-3 text-[15px]'
      } ${
        active
          ? 'border-[var(--action-primary)] bg-[#fff1f5] text-[var(--action-primary)]'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}
