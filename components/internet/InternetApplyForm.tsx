'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Info, Loader2, MapPin, X } from 'lucide-react';
import SuccessOverlay from '@/components/shared/SuccessOverlay';
import { Choice, ErrorText, Field, Input, Label, Reveal, Section, SheetSelect } from '@/components/apply/ui';
import { focusFieldIn, scrollToFirstError } from '@/components/apply/engine';
import ProgressDots from '@/components/apply/ProgressDots';
import PostcodeModal, { usePostcode } from '@/components/apply/PostcodeModal';
import AgreementSheet from '@/components/apply/AgreementSheet';
import { formatPhone, isValidAccount, isValidEmail, isValidPhone } from '@/components/electronics/applyConstants';
import { addonLabel, giftLabel, speedHint, type AddonType, type Carrier, type InternetProduct } from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';
import {
  AGREEMENTS,
  BANKS,
  CUSTOMER_TYPES,
  GIFT_RECEIVERS,
  INITIAL_STATE,
  PAYERS,
  PHONE_CARRIERS,
  STEPS,
  formatBusinessNumber,
  isValidBusinessNumber,
  type InternetApplyFormState,
} from './internetApplyConstants';

// 인터넷 셀프 가입 신청서(5단계). 가전렌탈 신청서와 같은 엔진(components/apply)을 쓴다.
//  상품 → [약관 바텀시트] → 연락처 → 가입 정보 → 사은품 → 납부(+제출)
// 사은품·납부는 "나중에"로 건너뛸 수 있고, 건너뛴 항목은 해피콜에서 보완한다(관리자 목록에 표시).
// 생년월일·카드 정보는 받지 않는다.

const TOTAL = STEPS.length;
const BUSINESS_TYPES = ['개인사업자', '법인사업자'];

export default function InternetApplyForm({
  carriers,
  products,
  initialProductId,
  initialApplicantName,
  initialPhoneNumber,
  leadId,
}: {
  carriers: Carrier[];
  products: InternetProduct[];
  initialProductId?: string;
  initialApplicantName?: string;
  initialPhoneNumber?: string;
  leadId?: string;
}) {
  const router = useRouter();
  const validInitial = !!initialProductId && products.some((p) => p.id === initialProductId);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<InternetApplyFormState>({
    ...INITIAL_STATE,
    productId: validInitial ? initialProductId! : null,
    applicantName: initialApplicantName ?? '',
    phoneNumber: initialPhoneNumber ?? '',
  });
  // 설정기·추천에서 상품을 골라 넘어온 경우 확인 화면(브릿지)을 먼저 보여준다
  const [intro, setIntro] = useState(validInitial);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof InternetApplyFormState>(key: K, value: InternetApplyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedProduct = useMemo(() => products.find((p) => p.id === form.productId) ?? null, [products, form.productId]);
  const carrierOf = (id: string | undefined) => carriers.find((c) => c.id === id) ?? null;
  const selectedCarrier = carrierOf(selectedProduct?.carrier_id);

  /* ── 자동 넘김 ── */
  const focusField = (key: string) => focusFieldIn(topRef.current, key);
  const setAndAdvance = <K extends keyof InternetApplyFormState>(key: K, value: InternetApplyFormState[K], nextKey: string | null) => {
    if (!nextKey) return set(key, value);
    flushSync(() => set(key, value));
    focusField(nextKey);
  };

  // 연락처 단계는 한 칸을 채우면 다음 항목이 나타난다. 한 번 나온 항목은 값을 지워도 남긴다.
  const contactLevel = useMemo(() => {
    let level = 0;
    if (form.applicantName.trim()) level = 1;
    if (level === 1 && form.phoneCarrier) level = 2;
    return level;
  }, [form.applicantName, form.phoneCarrier]);
  const revealedRef = useRef(0);
  revealedRef.current = Math.max(revealedRef.current, contactLevel);
  const revealed = revealedRef.current;

  const isBusiness = BUSINESS_TYPES.includes(form.customerType);
  const requiredAgreed = AGREEMENTS.filter((a) => a.required).every((a) => form.agreements[a.key]);

  /* ── 단계별 유효성 ── */
  const errors = useMemo((): Record<string, string> => {
    const e: Record<string, string> = {};
    if (step === 0 && !form.decideAfterConsult && !form.productId) e.product = '상품을 고르거나 "상담 후 결정"을 선택해주세요.';
    if (step === 1) {
      if (!form.applicantName.trim()) e.applicantName = '이름을 입력해주세요.';
      if (!form.phoneCarrier) e.phoneCarrier = '휴대폰 통신사를 선택해주세요.';
      if (!isValidPhone(form.phoneNumber)) e.phoneNumber = '휴대폰 번호를 정확히 입력해주세요.';
    }
    if (step === 2) {
      if (isBusiness) {
        if (!form.businessName.trim()) e.businessName = '사업자명(상호)을 입력해주세요.';
        if (!isValidBusinessNumber(form.businessNumber)) e.businessNumber = '사업자등록번호 10자리를 입력해주세요.';
      }
      if (!form.currentInternet) e.currentInternet = '현재 인터넷 사용 여부를 선택해주세요.';
      if (form.currentInternet === 'using' && !form.currentCarrier) e.currentCarrier = '사용 중인 통신사를 선택해주세요.';
      if (!form.address.trim()) e.address = '설치 주소를 검색해주세요.';
      if (form.email && !isValidEmail(form.email)) e.email = '이메일을 정확히 입력해주세요.';
    }
    if (step === 3 && !form.giftSkipped) {
      if (!form.giftReceiver) e.giftReceiver = '수령자를 선택해주세요.';
      if (!form.giftBank) e.giftBank = '은행을 선택해주세요.';
      if (!isValidAccount(form.giftAccountNumber)) e.giftAccountNumber = '계좌번호를 정확히 입력해주세요.';
    }
    if (step === 4 && !form.paymentSkipped) {
      if (!form.paymentPayer) e.paymentPayer = '납부자를 선택해주세요.';
      const same = form.paymentSameAsGift && !form.giftSkipped;
      if (!same) {
        if (!form.paymentBank) e.paymentBank = '은행을 선택해주세요.';
        if (!isValidAccount(form.paymentAccountNumber)) e.paymentAccountNumber = '계좌번호를 정확히 입력해주세요.';
      }
    }
    return e;
  }, [step, form, isBusiness]);

  const canProceed = Object.keys(errors).length === 0;
  const err = (key: string) => (touched ? errors[key] : undefined);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const goNext = () => {
    if (!canProceed) {
      flushSync(() => setTouched(true));
      scrollToFirstError(topRef.current);
      return;
    }
    setTouched(false);
    // 상품을 고른 직후 약관을 한 번 받는다
    if (step === 0 && !requiredAgreed) {
      setAgreementOpen(true);
      return;
    }
    if (step < TOTAL - 1) {
      setStep(step + 1);
      scrollTop();
    }
  };

  const goPrev = () => {
    setTouched(false);
    if (step === 0) {
      if (validInitial) setIntro(true);
      else router.back();
      return;
    }
    setStep(step - 1);
    scrollTop();
  };

  // 연락처 단계에 들어오면 비어 있는 첫 칸에 포커스
  useEffect(() => {
    if (step !== 1 || intro) return;
    const key = !form.applicantName.trim() ? 'applicantName' : !form.phoneCarrier ? null : !isValidPhone(form.phoneNumber) ? 'phoneNumber' : null;
    if (!key) return;
    const t = setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      topRef.current?.querySelector<HTMLElement>(`[data-af="${key}"]`)?.focus({ preventScroll: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, intro]);

  const postcode = usePostcode();

  const submit = async (skipPayment = false) => {
    if (skipPayment) {
      flushSync(() => {
        set('paymentSkipped', true);
        setTouched(false);
      });
    } else {
      setTouched(true);
      if (!canProceed) {
        scrollToFirstError(topRef.current);
        return;
      }
    }
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/internet/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          paymentSkipped: skipPayment || form.paymentSkipped,
          leadId: leadId ?? null,
          referrerUrl: typeof window !== 'undefined' ? window.location.href : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? '신청 처리 중 문제가 발생했습니다.');
      setDone(true);
      scrollTop();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '신청 처리 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 브릿지(상품 확인) ── */
  if (intro && selectedProduct && selectedCarrier) {
    return (
      <div className="max-w-[560px] mx-auto px-6 pt-8 pb-44" data-testid="iapply-bridge">
        <h1 className="text-[26px] font-semibold text-[#333d4b] leading-snug mb-7">이 조건으로 신청할게요</h1>
        <ProductCard carrier={selectedCarrier} product={selectedProduct} />
        <AgreementSheet
          open={agreementOpen}
          agreements={AGREEMENTS}
          value={form.agreements}
          onChange={(v) => set('agreements', v)}
          onClose={() => setAgreementOpen(false)}
          onConfirm={() => {
            setAgreementOpen(false);
            setIntro(false);
            setStep(1);
          }}
        />
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pt-4 pb-4">
          <div className="max-w-[560px] mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-medium text-[#333d4b]">월 요금</p>
              <p className="text-[19px] font-semibold text-[#333d4b]">월 {selectedProduct.monthly_fee.toLocaleString()}원</p>
            </div>
            <p className="mt-1.5 mb-3 flex items-center gap-1 text-xs text-gray-400">
              <Info className="w-3.5 h-3.5" />
              휴대폰 결합·카드 할인은 상담에서 추가로 확인해 드려요
            </p>
            <button
              type="button"
              onClick={() => (requiredAgreed ? (setIntro(false), setStep(1)) : setAgreementOpen(true))}
              data-testid="iapply-bridge-next"
              className="w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto px-6 pb-36" ref={topRef}>
      {(submitting || done) && (
        <SuccessOverlay
          done={done}
          testId="iapply-done"
          caption="신청서 접수 완료"
          title="신청이 접수되었어요"
          description={
            <p>
              담당 상담원이 확인 후 <span className="font-semibold text-[#333d4b]">{form.phoneNumber}</span> 로
              <br />
              순차적으로 연락드릴 예정입니다.
              {(form.giftSkipped || form.paymentSkipped) && (
                <>
                  <br />
                  건너뛴 항목은 전화로 함께 채워 드릴게요.
                </>
              )}
            </p>
          }
          actions={
            <>
              <Link href="/internet" className="inline-flex items-center justify-center h-[52px] rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-semibold transition-colors">
                완료
              </Link>
              <Link href="/" className="inline-flex items-center justify-center h-[52px] rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-[#333d4b] font-semibold transition-colors">
                홈으로
              </Link>
            </>
          }
        />
      )}

      <PostcodeModal
        open={postcode.open}
        onClose={() => postcode.setOpen(false)}
        onReady={() => postcode.setReady(true)}
        onComplete={(r) => {
          flushSync(() => {
            set('zonecode', r.zonecode);
            set('address', r.address);
            postcode.setOpen(false);
          });
          focusField('addressDetail');
        }}
      />

      <AgreementSheet
        open={agreementOpen}
        agreements={AGREEMENTS}
        value={form.agreements}
        onChange={(v) => set('agreements', v)}
        onClose={() => setAgreementOpen(false)}
        onConfirm={() => {
          setAgreementOpen(false);
          setStep(1);
          scrollTop();
        }}
      />

      <ProgressDots steps={STEPS} step={step} />

      <button type="button" onClick={goPrev} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#333d4b] transition-colors mb-4">
        <ChevronLeft className="w-4 h-4" />
        이전
      </button>

      {/* ───────── 1. 상품 ───────── */}
      {step === 0 && (
        <Section title="신청할 상품을 확인해주세요">
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Choice active={!form.decideAfterConsult} onClick={() => set('decideAfterConsult', false)} label="상품 고르기" />
            <Choice active={form.decideAfterConsult} onClick={() => set('decideAfterConsult', true)} label="상담 후 결정" />
          </div>

          {form.decideAfterConsult ? (
            <p className="flex items-start gap-2 rounded-xl bg-[#f8f9fb] px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
              <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
              사용 환경을 여쭤보고 조건에 맞는 통신사·속도를 골라 안내드릴게요.
            </p>
          ) : selectedProduct && selectedCarrier ? (
            <div data-testid="iapply-product-selected">
              <Label>선택한 상품</Label>
              <ProductCard
                carrier={selectedCarrier}
                product={selectedProduct}
                onClear={() => set('productId', null)}
              />
            </div>
          ) : (
            <ProductPicker carriers={carriers} products={products} onPick={(p) => set('productId', p.id)} />
          )}
          {err('product') && <ErrorText>{err('product')}</ErrorText>}
        </Section>
      )}

      {/* ───────── 2. 연락처 ───────── */}
      {step === 1 && (
        <Section title="연락받으실 분을 알려주세요">
          <Label required>신청하시는 분</Label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Choice active={form.applicantIsSelf} onClick={() => set('applicantIsSelf', true)} label="본인이에요" />
            <Choice active={!form.applicantIsSelf} onClick={() => set('applicantIsSelf', false)} label="대신 신청해요" />
          </div>
          {!form.applicantIsSelf && (
            <p className="-mt-3 mb-6 text-xs text-gray-400">가입자 본인 이름과 연락처를 입력해주세요. 상담 때 대리 신청 여부를 확인해요.</p>
          )}

          <Field label="가입자 이름" required error={err('applicantName')}>
            <Input
              value={form.applicantName}
              onChange={(v) => set('applicantName', v)}
              af="applicantName"
              onEnter={() => focusField('phoneCarrier')}
              placeholder="이름"
              autoComplete="name"
            />
          </Field>

          {revealed >= 1 && (
            <Reveal>
              <Field label="휴대폰 통신사" required error={err('phoneCarrier')}>
                <div className="grid grid-cols-4 gap-2" data-af="phoneCarrier">
                  {PHONE_CARRIERS.map((c) => (
                    <Choice
                      key={c}
                      active={form.phoneCarrier === c}
                      onClick={() => setAndAdvance('phoneCarrier', c, isValidPhone(form.phoneNumber) ? null : 'phoneNumber')}
                      label={c}
                      compact
                    />
                  ))}
                </div>
              </Field>
            </Reveal>
          )}

          {revealed >= 2 && (
            <Reveal>
              <Field label="휴대폰 번호" required error={err('phoneNumber')}>
                <Input
                  value={form.phoneNumber}
                  onChange={(v) => {
                    const next = formatPhone(v);
                    set('phoneNumber', next);
                    if (isValidPhone(next) && !isValidPhone(form.phoneNumber)) (document.activeElement as HTMLElement | null)?.blur?.();
                  }}
                  af="phoneNumber"
                  onEnter={goNext}
                  placeholder="010-0000-0000"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>
            </Reveal>
          )}
        </Section>
      )}

      {/* ───────── 3. 가입 정보 ───────── */}
      {step === 2 && (
        <Section title="가입 정보를 알려주세요">
          <Label required>고객 구분</Label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {CUSTOMER_TYPES.map((t) => (
              <Choice key={t} active={form.customerType === t} onClick={() => set('customerType', t)} label={t} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-6">가게·사무실에 설치하면 개인사업자 또는 법인사업자를 선택해주세요.</p>

          {isBusiness && (
            <Reveal>
              <Field label="사업자명 (상호)" required error={err('businessName')}>
                <Input value={form.businessName} onChange={(v) => set('businessName', v)} af="businessName" onEnter={() => focusField('businessNumber')} placeholder="상호" />
              </Field>
              <Field label="사업자등록번호" required error={err('businessNumber')}>
                <Input
                  value={form.businessNumber}
                  onChange={(v) => {
                    const next = formatBusinessNumber(v);
                    set('businessNumber', next);
                    if (isValidBusinessNumber(next) && !isValidBusinessNumber(form.businessNumber)) (document.activeElement as HTMLElement | null)?.blur?.();
                  }}
                  af="businessNumber"
                  placeholder="000-00-00000"
                  inputMode="numeric"
                />
              </Field>
            </Reveal>
          )}
          {form.customerType === '외국인' && (
            <p className="mb-6 flex items-start gap-2 rounded-xl bg-[#f8f9fb] px-4 py-3.5 text-sm text-gray-600 leading-relaxed">
              <Info className="w-4 h-4 text-[var(--action-primary)] shrink-0 mt-0.5" />
              외국인 등록증 기준으로 접수돼요. 필요한 서류는 상담에서 안내드릴게요.
            </p>
          )}

          <div className="mb-5" data-af="currentInternet">
            <Label required>지금 인터넷을 쓰고 계세요?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Choice active={form.currentInternet === 'none'} onClick={() => set('currentInternet', 'none')} label="안 쓰고 있어요" />
              <Choice active={form.currentInternet === 'using'} onClick={() => set('currentInternet', 'using')} label="쓰고 있어요" />
            </div>
            {err('currentInternet') && <ErrorText>{err('currentInternet')}</ErrorText>}
          </div>

          {form.currentInternet === 'using' && (
            <Reveal>
              <Field label="사용 중인 통신사" required error={err('currentCarrier')}>
                <div className="grid grid-cols-3 gap-2">
                  {[...carriers.map((c) => ({ key: c.name, logo: c.logo_url, name: c.name })), { key: '기타', logo: null, name: '기타' }].map((c) => {
                    const active = form.currentCarrier === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => set('currentCarrier', c.key)}
                        aria-pressed={active}
                        className={`flex flex-col items-center gap-1.5 rounded-xl px-2 pt-3.5 pb-3 transition-colors ${
                          active ? 'bg-[#fff1f5] ring-2 ring-[#ff9ebb]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'
                        }`}
                      >
                        <span className="flex items-center justify-center h-6">
                          <CarrierLogo src={c.logo} name={c.name} className="max-h-5 max-w-[60px]" />
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="휴대폰과 결합되어 있나요?">
                <div className="grid grid-cols-3 gap-2">
                  <Choice active={form.hasMobileBundle === true} onClick={() => set('hasMobileBundle', true)} label="네" compact />
                  <Choice active={form.hasMobileBundle === false} onClick={() => set('hasMobileBundle', false)} label="아니요" compact />
                  <Choice active={form.hasMobileBundle === null} onClick={() => set('hasMobileBundle', null)} label="모르겠어요" compact />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">결합 중이면 해지 위약금·재결합 조건을 상담에서 먼저 확인해 드려요.</p>
              </Field>
            </Reveal>
          )}

          <Field label="설치 주소" required error={err('address')}>
            <button
              type="button"
              onClick={postcode.openPostcode}
              disabled={!postcode.ready}
              data-testid="address-search"
              className="w-full flex items-center gap-2 py-3.5 px-4 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] text-left text-[15px] transition-colors disabled:opacity-60"
            >
              <span className={`flex-1 min-w-0 truncate ${form.address ? 'text-[#333d4b]' : 'text-gray-400'}`}>
                {form.address || (postcode.ready ? '건물, 지번 또는 도로명 검색' : '주소 검색을 준비하고 있어요')}
              </span>
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
            </button>
            {form.zonecode && <p className="mt-1.5 text-xs text-gray-400">우편번호 {form.zonecode}</p>}
          </Field>
          <Field label="상세주소 (선택)">
            <Input value={form.addressDetail} onChange={(v) => set('addressDetail', v)} af="addressDetail" onEnter={() => focusField('email')} placeholder="동/호수 (주택이면 비워두셔도 돼요)" />
          </Field>

          <Field label="이메일 (선택)" error={err('email')}>
            <Input value={form.email} onChange={(v) => set('email', v)} af="email" onEnter={goNext} placeholder="요금 청구서를 받을 이메일" type="email" autoComplete="email" />
          </Field>
        </Section>
      )}

      {/* ───────── 4. 사은품 ───────── */}
      {step === 3 && (
        <Section title="사은품 받으실 계좌를 알려주세요">
          {selectedProduct && selectedProduct.customer_gift != null && (
            <div className="mb-6 rounded-2xl bg-[#fff1f5] px-5 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">이 조건의 현금 사은품</p>
              <p className="text-[20px] font-bold text-[var(--action-primary)]">{giftLabel(selectedProduct)}</p>
            </div>
          )}
          <Field label="수령자" required error={err('giftReceiver')}>
            <SheetSelect
              name="giftReceiver"
              title="수령자를 선택해주세요"
              value={form.giftReceiver}
              onChange={(v) => setAndAdvance('giftReceiver', v, form.giftBank ? null : 'giftBank')}
              placeholder="수령자 선택"
              options={[...GIFT_RECEIVERS]}
            />
          </Field>
          <Field label="계좌 정보" required error={err('giftBank') ?? err('giftAccountNumber')}>
            <div className="space-y-2">
              <SheetSelect name="giftBank" af="giftBank" title="은행을 선택해주세요" value={form.giftBank} onChange={(v) => setAndAdvance('giftBank', v, 'giftAccountNumber')} placeholder="은행 선택" options={[...BANKS]} />
              <Input value={form.giftAccountNumber} onChange={(v) => set('giftAccountNumber', v.replace(/[^\d-]/g, ''))} af="giftAccountNumber" onEnter={goNext} placeholder="계좌번호 입력 ('-' 없이)" inputMode="numeric" />
            </div>
          </Field>
          <div className="rounded-xl bg-[#f8f9fb] px-4 py-3.5">
            <p className="text-sm font-semibold text-[#333d4b] mb-2">확인해주세요!</p>
            <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed list-disc pl-4">
              <li>명의자·납부 계좌·사은품 계좌는 같은 분이어야 접수가 돼요.</li>
              <li>현금 사은품은 개통 완료 후 통신사별 일정에 맞춰 지급돼요.</li>
              <li>지금 계좌를 모르면 ‘나중에’를 누르고 상담에서 알려주셔도 돼요.</li>
            </ul>
          </div>
        </Section>
      )}

      {/* ───────── 5. 납부 ───────── */}
      {step === 4 && (
        <Section title="요금 납부 정보를 알려주세요">
          <Field label="납부자" required error={err('paymentPayer')}>
            <div className="grid grid-cols-2 gap-2">
              {PAYERS.map((p) => (
                <Choice key={p} active={form.paymentPayer === p} onClick={() => set('paymentPayer', p)} label={p === '본인' ? '가입자 본인' : '다른 사람'} />
              ))}
            </div>
            {form.paymentPayer === '타인' && <p className="mt-1.5 text-xs text-gray-400">통신사 규정상 명의자와 납부자가 같아야 해요. 상담에서 방법을 안내드릴게요.</p>}
          </Field>

          <div className="rounded-2xl bg-[#f8f9fb] p-4 mb-5">
            <p className="text-sm font-semibold text-[#333d4b] mb-3">은행 자동이체</p>
            {!form.giftSkipped && (
              <label className="flex items-center gap-2.5 cursor-pointer mb-4">
                <input type="checkbox" checked={form.paymentSameAsGift} onChange={(e) => set('paymentSameAsGift', e.target.checked)} className="w-4 h-4 accent-[var(--action-primary)]" />
                <span className="text-sm font-medium text-[#333d4b]">사은품 받는 계좌와 동일해요</span>
              </label>
            )}
            {(form.giftSkipped || !form.paymentSameAsGift) && (
              <div className="space-y-2">
                <SheetSelect name="paymentBank" title="은행을 선택해주세요" value={form.paymentBank} onChange={(v) => setAndAdvance('paymentBank', v, 'paymentAccountNumber')} placeholder="은행 선택" options={[...BANKS]} />
                <Input value={form.paymentAccountNumber} onChange={(v) => set('paymentAccountNumber', v.replace(/[^\d-]/g, ''))} af="paymentAccountNumber" placeholder="계좌번호 입력" inputMode="numeric" />
                {(err('paymentBank') || err('paymentAccountNumber')) && <ErrorText>{err('paymentBank') ?? err('paymentAccountNumber')}</ErrorText>}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">자동이체는 필수예요. 평생계좌는 쓸 수 없고, 카드 결제는 상담에서 따로 안내드려요.</p>
          </div>

          <div className="mb-2">
            <Label>요청사항 (선택)</Label>
            <textarea
              value={form.customerNote}
              onChange={(e) => set('customerNote', e.target.value)}
              rows={3}
              placeholder="설치 희망일, 통화 가능 시간 등"
              className="w-full py-3.5 px-4 rounded-xl bg-[#f2f4f6] border-0 focus:outline-none focus:ring-2 focus:ring-[#ffc2d2] text-[15px] placeholder-gray-400 transition-shadow resize-none"
            />
          </div>
          {submitError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
        </Section>
      )}

      {/* 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-[560px] mx-auto">
          {step === TOTAL - 1 ? (
            <>
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={submitting}
                data-testid="iapply-submit"
                className="w-full py-4 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] disabled:opacity-60 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? '제출 중…' : '제출하기'}
              </button>
              <button type="button" onClick={() => submit(true)} disabled={submitting} data-testid="iapply-submit-later" className="w-full mt-2 py-2 text-sm font-semibold text-gray-400 hover:text-[#333d4b] transition-colors">
                납부 정보는 나중에 입력하고 제출
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={goNext}
                data-testid="iapply-next"
                className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  canProceed ? 'bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
              {step === 3 && (
                <button
                  type="button"
                  data-testid="iapply-gift-later"
                  onClick={() => {
                    setForm((f) => ({ ...f, giftSkipped: true, paymentSameAsGift: false }));
                    setTouched(false);
                    setStep(4);
                    scrollTop();
                  }}
                  className="w-full mt-2 py-2 text-sm font-semibold text-gray-400 hover:text-[#333d4b] transition-colors"
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

/* ── 상품 카드 ── */
function ProductCard({ carrier, product, onClear }: { carrier: Carrier; product: InternetProduct; onClear?: () => void }) {
  return (
    <div className="rounded-2xl bg-[#f2f4f6] px-5 py-5">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-14 h-10 rounded-xl bg-white shrink-0">
          <CarrierLogo src={carrier.logo_url} name={carrier.name} className="max-h-6 max-w-[48px]" />
        </span>
        <p className="flex-1 text-[17px] font-semibold text-[#333d4b]">인터넷 · {carrier.name}</p>
        {onClear && (
          <button type="button" onClick={onClear} aria-label="상품 선택 해제" className="shrink-0 p-1 -m-1 text-gray-400 hover:text-[#333d4b] transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <dl className="mt-4 space-y-2.5 text-[15px]">
        <Row k="속도" v={`${product.speed} ${product.internet_name}`} />
        <Row k="구성" v={addonLabel(product)} />
        <Row k="월 요금" v={`${product.monthly_fee.toLocaleString()}원 (3년 약정)`} />
        <Row k="현금 사은품" v={giftLabel(product)} accent />
        {product.voucher != null && product.voucher > 0 && <Row k="통신사 상품권" v={`${(product.voucher / 10000).toLocaleString()}만원`} />}
      </dl>
    </div>
  );
}
function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-gray-500">{k}</dt>
      <dd className={`flex-1 min-w-0 font-medium ${accent ? 'text-[var(--action-primary)]' : 'text-[#333d4b]'}`}>{v}</dd>
    </div>
  );
}

/* ── 상품 고르기(폼 안 축약판 설정기): 통신사 → TV 여부 → 속도 → TV 상품 ── */
function ProductPicker({ carriers, products, onPick }: { carriers: Carrier[]; products: InternetProduct[]; onPick: (p: InternetProduct) => void }) {
  const [carrierId, setCarrierId] = useState<string>('');
  const [addon, setAddon] = useState<AddonType | null>(null);
  const [speed, setSpeed] = useState<string | null>(null);

  const carrier = carriers.find((c) => c.id === carrierId) ?? null;
  const mine = products.filter((p) => p.carrier_id === carrierId);
  const addonTypes = (['none', 'tv'] as AddonType[]).filter((t) => mine.some((p) => p.addon_type === t));
  const effAddon = addonTypes.length === 1 ? addonTypes[0] : addon;
  const speeds = effAddon ? [...new Map(mine.filter((p) => p.addon_type === effAddon).map((p) => [p.speed, p])).values()].sort((a, b) => a.speed_mbps - b.speed_mbps) : [];
  const names = effAddon && speed ? mine.filter((p) => p.addon_type === effAddon && p.speed === speed).sort((a, b) => a.monthly_fee - b.monthly_fee) : [];

  const pickSpeed = (s: string) => {
    setSpeed(s);
    const list = mine.filter((p) => p.addon_type === effAddon && p.speed === s);
    if (list.length === 1) onPick(list[0]);
  };

  return (
    <div data-testid="iapply-picker">
      <Field label="통신사" required>
        <SheetSelect
          name="carrier"
          title="통신사를 선택해주세요"
          value={carrier?.name ?? ''}
          onChange={(name) => {
            setCarrierId(carriers.find((c) => c.name === name)?.id ?? '');
            setAddon(null);
            setSpeed(null);
          }}
          placeholder="통신사 선택"
          options={carriers.map((c) => c.name)}
        />
      </Field>
      {carrier && addonTypes.length > 1 && (
        <Field label="TV도 함께 보세요?" required>
          <div className="grid grid-cols-2 gap-2">
            <Choice active={effAddon === 'none'} onClick={() => { setAddon('none'); setSpeed(null); }} label="안 봐요" />
            <Choice active={effAddon === 'tv'} onClick={() => { setAddon('tv'); setSpeed(null); }} label="봐요" />
          </div>
        </Field>
      )}
      {effAddon && (
        <Field label="인터넷 속도" required>
          <div className="space-y-2">
            {speeds.map((p) => (
              <button
                key={p.speed}
                type="button"
                onClick={() => pickSpeed(p.speed)}
                aria-pressed={speed === p.speed}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors ${
                  speed === p.speed ? 'bg-[#fff1f5] ring-2 ring-[#ff9ebb]' : 'bg-[#f2f4f6] hover:bg-[#eceef1]'
                }`}
              >
                <span>
                  <span className="block text-[15px] font-semibold text-[#333d4b]">{p.speed} <span className="text-[13px] font-normal text-gray-500">{p.internet_name}</span></span>
                  <span className="block text-[12px] text-gray-500">{speedHint(p.speed_mbps)}</span>
                </span>
                <span className="text-sm font-medium text-gray-600 tabular-nums">월 {Math.min(...mine.filter((q) => q.addon_type === effAddon && q.speed === p.speed).map((q) => q.monthly_fee)).toLocaleString()}원{effAddon === 'tv' ? '~' : ''}</span>
              </button>
            ))}
          </div>
        </Field>
      )}
      {names.length > 1 && (
        <Field label="TV 상품" required>
          <div className="grid grid-cols-2 gap-2">
            {names.map((p) => (
              <button key={p.id} type="button" onClick={() => onPick(p)} className="flex flex-col items-start gap-0.5 rounded-xl bg-[#f2f4f6] hover:bg-[#eceef1] px-4 py-3.5 text-left transition-colors">
                <span className="text-[15px] font-semibold text-[#333d4b]">{addonLabel(p)}</span>
                <span className="text-[12px] text-gray-500">월 {p.monthly_fee.toLocaleString()}원 · 사은품 {giftLabel(p)}</span>
              </button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
