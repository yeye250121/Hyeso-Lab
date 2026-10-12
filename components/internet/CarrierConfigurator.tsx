'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import {
  addonLabel,
  giftLabel,
  speedHint,
  type AddonType,
  type Carrier,
  type InternetProduct,
} from '@/lib/internetApi';
import CarrierLogo from './CarrierLogo';

// 통신사 요금제 설정기 = "직접 선택하기".
// 기본 선택값을 미리 정해 두지 않는다. 고객이 실제로 다양하게 고르기 때문에
// 통신사 → "TV도 함께 보세요?" → 속도 → (TV 상품) 순서로 묻고, 조합이 하나로 정해지면
// 요약(월 요금·사은품)과 신청 버튼이 켜진다. 질문은 답한 뒤에야 다음 질문이 나타난다.

const ADDON_ORDER: AddonType[] = ['none', 'tv', 'phone', 'cctv'];
const ADDON_LABEL: Record<AddonType, string> = {
  none: '안 봐요',
  tv: '봐요',
  phone: '070 전화',
  cctv: 'CCTV',
};
const ADDON_LABEL_WIDE: Record<AddonType, string> = {
  none: '인터넷만',
  tv: 'TV 함께',
  phone: '070 전화 함께',
  cctv: 'CCTV 함께',
};

type Initial = { addon?: string; speed?: string; name?: string };

export default function CarrierConfigurator({
  carrier,
  carriers,
  products,
  initial,
}: {
  carrier: Carrier;
  carriers: Carrier[];
  products: InternetProduct[]; // 이 통신사 상품만
  initial?: Initial;
}) {
  const router = useRouter();

  const addonTypes = useMemo(
    () => ADDON_ORDER.filter((t) => products.some((p) => p.addon_type === t)),
    [products]
  );
  // TV/단독만 있으면 "TV도 함께 보세요?" 로, 전화·CCTV 가 섞이면 "함께 쓸 상품" 질문으로 바꾼다
  const simpleTvQuestion = addonTypes.every((t) => t === 'none' || t === 'tv');
  // 스카이라이프처럼 조합이 하나뿐이면 질문을 생략한다
  const singleAddon = addonTypes.length === 1 ? addonTypes[0] : null;

  const [addon, setAddon] = useState<AddonType | null>(() => {
    if (singleAddon) return singleAddon;
    const a = initial?.addon as AddonType | undefined;
    return a && addonTypes.includes(a) ? a : null;
  });
  const [speed, setSpeed] = useState<string | null>(() => initial?.speed ?? null);
  const [addonName, setAddonName] = useState<string | null>(() => initial?.name ?? null);

  const speeds = useMemo(() => {
    if (!addon) return [];
    const list = products.filter((p) => p.addon_type === addon);
    const uniq = [...new Map(list.map((p) => [p.speed, p])).values()];
    return uniq
      .sort((a, b) => a.speed_mbps - b.speed_mbps)
      .map((p) => ({
        speed: p.speed,
        mbps: p.speed_mbps,
        internet_name: p.internet_name,
        minFee: Math.min(...list.filter((q) => q.speed === p.speed).map((q) => q.monthly_fee)),
        recommended: list.some((q) => q.speed === p.speed && q.is_recommended),
      }));
  }, [products, addon]);

  const names = useMemo(() => {
    if (!addon || !speed || addon === 'none') return [];
    return products
      .filter((p) => p.addon_type === addon && p.speed === speed)
      .sort((a, b) => a.monthly_fee - b.monthly_fee);
  }, [products, addon, speed]);

  // 앞 단계가 바뀌어 뒤 단계 값이 더 이상 유효하지 않으면 지운다
  const validSpeed = speed && speeds.some((s) => s.speed === speed) ? speed : null;
  const validName =
    addon === 'none'
      ? null
      : addonName && names.some((n) => n.addon_name === addonName)
        ? addonName
        : names.length === 1
          ? names[0].addon_name
          : null;

  const selected: InternetProduct | null = useMemo(() => {
    if (!addon || !validSpeed) return null;
    if (addon === 'none') return products.find((p) => p.addon_type === 'none' && p.speed === validSpeed) ?? null;
    if (!validName) return null;
    return products.find((p) => p.addon_type === addon && p.speed === validSpeed && p.addon_name === validName) ?? null;
  }, [products, addon, validSpeed, validName]);

  // 다음 질문이 나타나면 그 자리로 내려 준다
  const speedRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLElement>) =>
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  const pickAddon = (t: AddonType) => {
    setAddon(t);
    scrollTo(speedRef);
  };
  const pickSpeed = (s: string) => {
    setSpeed(s);
    const nextNames = products.filter((p) => p.addon_type === addon && p.speed === s);
    if (addon !== 'none' && nextNames.length > 1) scrollTo(nameRef);
    else scrollTo(summaryRef);
  };
  const pickName = (n: string) => {
    setAddonName(n);
    scrollTo(summaryRef);
  };

  // 통신사를 바꾸면 같은 질문 답은 가져가고(가능한 경우), 아니면 다시 묻는다
  const switchCarrier = (id: string) => {
    const q = new URLSearchParams();
    if (addon) q.set('addon', addon);
    if (validSpeed) q.set('speed', validSpeed);
    router.push(`/internet/${id}${q.size ? `?${q}` : ''}`);
  };

  // 요약 바가 가리지 않도록 본문 하단 여백 (모바일)
  useEffect(() => {
    document.body.classList.add('pb-28', 'lg:pb-0');
    return () => document.body.classList.remove('pb-28', 'lg:pb-0');
  }, []);

  const applyHref = selected ? `/internet/application?product=${selected.id}` : '#';
  const consultHref = `/apply?service=internet`;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
      <div className="min-w-0 space-y-10">
        {/* 통신사 */}
        <section>
          <h2 className="text-[17px] font-bold text-[#333d4b]">통신사</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" data-testid="cfg-carriers">
            {carriers.map((c) => {
              const active = c.id === carrier.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => !active && switchCarrier(c.id)}
                  data-testid={`cfg-carrier-${c.id}`}
                  aria-pressed={active}
                  className={`shrink-0 flex items-center gap-2 h-11 pl-3 pr-3.5 rounded-xl border transition-colors ${
                    active ? 'border-[#333d4b] bg-white' : 'border-gray-100 bg-[#f4f5f7] hover:bg-[#eceef1]'
                  }`}
                >
                  <CarrierLogo src={c.logo_url} name="" className="h-5 w-auto max-w-[56px]" />
                  <span className={`text-sm whitespace-nowrap ${active ? 'font-bold text-[#191f28]' : 'font-medium text-gray-600'}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
          {carrier.product_note && (
            <p className="mt-2 text-[12px] text-gray-400">{carrier.product_note}</p>
          )}
        </section>

        {/* 결합 질문 */}
        {!singleAddon && (
          <section data-testid="cfg-addon">
            <h2 className="text-[17px] font-bold text-[#333d4b]">
              {simpleTvQuestion ? 'TV도 함께 보세요?' : '인터넷과 함께 쓸 상품이 있나요?'}
            </h2>
            <div className={`mt-3 grid gap-2 ${addonTypes.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {addonTypes.map((t) => {
                const active = addon === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickAddon(t)}
                    data-testid={`cfg-addon-${t}`}
                    aria-pressed={active}
                    className={`h-14 rounded-xl border text-[15px] font-semibold transition-colors ${
                      active
                        ? 'border-[#333d4b] bg-white text-[#191f28]'
                        : 'border-transparent bg-[#f4f5f7] text-[#4e5968] hover:bg-[#eceef1]'
                    }`}
                  >
                    {simpleTvQuestion ? ADDON_LABEL[t] : ADDON_LABEL_WIDE[t]}
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {singleAddon === 'tv' && (
          <p className="text-[13px] text-gray-500 -mt-6">{carrier.name}은 인터넷과 TV를 함께 쓰는 상품만 있어요.</p>
        )}

        {/* 속도 */}
        {addon && (
          <section ref={speedRef} data-testid="cfg-speed">
            <h2 className="text-[17px] font-bold text-[#333d4b]">인터넷 속도</h2>
            <ul className="mt-3 space-y-2">
              {speeds.map((s) => {
                const active = validSpeed === s.speed;
                return (
                  <li key={s.speed}>
                    <button
                      type="button"
                      onClick={() => pickSpeed(s.speed)}
                      data-testid={`cfg-speed-${s.speed}`}
                      aria-pressed={active}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                        active ? 'border-[#333d4b] bg-white' : 'border-transparent bg-[#f4f5f7] hover:bg-[#eceef1]'
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[16px] font-bold text-[#191f28]">{s.speed}</span>
                          <span className="text-[13px] text-gray-500">{s.internet_name}</span>
                          {s.recommended && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#fff1f5] text-[11px] font-bold text-[var(--action-primary)]">
                              추천
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-gray-500">{speedHint(s.mbps)}</span>
                      </span>
                      <span className="text-[15px] font-semibold text-[#333d4b] tabular-nums shrink-0">
                        월 {s.minFee.toLocaleString()}원{addon !== 'none' && names.length !== 1 ? '~' : ''}
                      </span>
                      {active && <Check className="w-5 h-5 text-[#333d4b] shrink-0" strokeWidth={2.5} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* TV 등 추가상품 */}
        {addon && addon !== 'none' && validSpeed && names.length > 1 && (
          <section ref={nameRef} data-testid="cfg-name">
            <h2 className="text-[17px] font-bold text-[#333d4b]">
              {addon === 'tv' ? 'TV 상품' : addon === 'phone' ? '전화 상품' : 'CCTV 상품'}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {names.map((p) => {
                const active = validName === p.addon_name;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickName(p.addon_name!)}
                      data-testid="cfg-name-option"
                      aria-pressed={active}
                      className={`w-full h-full flex flex-col items-start gap-1 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                        active ? 'border-[#333d4b] bg-white' : 'border-transparent bg-[#f4f5f7] hover:bg-[#eceef1]'
                      }`}
                    >
                      <span className="text-[15px] font-semibold text-[#191f28]">{addonLabel(p)}</span>
                      <span className="text-[13px] text-gray-500 tabular-nums">월 {p.monthly_fee.toLocaleString()}원</span>
                      {p.customer_gift != null && (
                        <span className="text-[12px] font-medium text-[var(--action-primary)]">사은품 {giftLabel(p)}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 데스크톱에선 우측 카드가 요약을 맡고, 모바일에선 여기 인라인 요약 + 하단 고정 바 */}
        <div ref={summaryRef} className="lg:hidden">
          <Summary carrier={carrier} product={selected} applyHref={applyHref} consultHref={consultHref} inline />
        </div>
      </div>

      <aside className="hidden lg:block sticky top-24">
        <Summary carrier={carrier} product={selected} applyHref={applyHref} consultHref={consultHref} />
      </aside>

      {/* 모바일 하단 고정 바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]" data-testid="cfg-bar">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {selected ? (
              <>
                <p className="text-[12px] text-gray-500 truncate">
                  {selected.speed} · {addonLabel(selected)} · 사은품 {giftLabel(selected)}
                </p>
                <p className="text-[17px] font-bold text-[#191f28] tabular-nums">월 {selected.monthly_fee.toLocaleString()}원</p>
              </>
            ) : (
              <p className="text-[14px] text-gray-500">조건을 고르면 월 요금이 보여요</p>
            )}
          </div>
          <Link
            href={applyHref}
            aria-disabled={!selected}
            data-testid="cfg-apply"
            className={`shrink-0 h-12 px-6 rounded-xl flex items-center text-[15px] font-bold transition-colors ${
              selected
                ? 'bg-[var(--action-primary)] text-white hover:bg-[var(--action-primary-hover)]'
                : 'bg-[#f2f4f6] text-gray-400 pointer-events-none'
            }`}
          >
            신청하기
          </Link>
        </div>
      </div>
    </div>
  );
}

function Summary({
  carrier,
  product,
  applyHref,
  consultHref,
  inline = false,
}: {
  carrier: Carrier;
  product: InternetProduct | null;
  applyHref: string;
  consultHref: string;
  inline?: boolean;
}) {
  return (
    <div className={`rounded-2xl ${inline ? 'bg-[#f4f5f7]' : 'bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'} p-5`} data-testid={inline ? 'cfg-summary-inline' : 'cfg-summary'}>
      {product ? (
        <>
          <p className="text-[13px] text-gray-500">
            {carrier.name} · {product.speed} · {addonLabel(product)}
          </p>
          <p className="mt-1.5 text-[26px] font-bold text-[#191f28] tabular-nums leading-tight">
            월 {product.monthly_fee.toLocaleString()}원
          </p>
          <dl className="mt-4 space-y-2 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-gray-500">현금 사은품</dt>
              <dd className="font-semibold text-[var(--action-primary)]">{giftLabel(product)}</dd>
            </div>
            {product.voucher != null && product.voucher > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">통신사 상품권</dt>
                <dd className="font-medium text-[#333d4b]">{(product.voucher / 10000).toLocaleString()}만원</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">약정</dt>
              <dd className="font-medium text-[#333d4b]">3년</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12px] text-gray-400 leading-relaxed">
            통신사 3년 약정 기준 요금이에요. 휴대폰 결합 할인은 설치 후 고객센터에 직접 신청하면 추가로 적용돼요.
          </p>
        </>
      ) : (
        <>
          <p className="text-[15px] font-semibold text-[#333d4b]">아직 고른 조건이 없어요</p>
          <p className="mt-1 text-[13px] text-gray-500">위에서 조건을 고르면 월 요금과 사은품을 바로 계산해 드려요.</p>
        </>
      )}
      {!inline && (
        <div className="mt-5 space-y-2">
          <Link
            href={applyHref}
            aria-disabled={!product}
            className={`flex items-center justify-center h-12 rounded-xl text-[15px] font-bold transition-colors ${
              product
                ? 'bg-[var(--action-primary)] text-white hover:bg-[var(--action-primary-hover)]'
                : 'bg-[#f2f4f6] text-gray-400 pointer-events-none'
            }`}
          >
            이 조건으로 신청하기
          </Link>
          <Link
            href={consultHref}
            className="flex items-center justify-center h-12 rounded-xl bg-[#f2f4f6] text-[15px] font-medium text-[#333d4b] hover:bg-[#eceef1] transition-colors"
          >
            상담으로 알아보기
          </Link>
        </div>
      )}
      {inline && (
        <Link href={consultHref} className="mt-4 inline-block text-[13px] font-medium text-gray-500 underline underline-offset-2">
          고르기 어려우면 상담으로 알아보기
        </Link>
      )}
    </div>
  );
}
