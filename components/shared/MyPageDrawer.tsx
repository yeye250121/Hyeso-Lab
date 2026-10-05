'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Heart,
  History,
  MessageCircle,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { useWishlist } from '@/components/electronics/toss/useWishlist';
import { readRecentSearches } from '@/components/electronics/toss/recentSearches';
import { useLocalActivity } from '@/components/shared/localActivity';
import { LEAD_SERVICES } from '@/components/shared/LeadForm';

// 햄버거를 누르면 오른쪽에서 나오는 마이페이지 서랍. 회원 시스템이 없으므로
// "나의 활동"은 전부 브라우저 저장(찜·최근 본 상품·최근 검색·내 상담 신청)이다.
// 로그인이 생기면 상단 인사 카드만 바꾸면 된다.

const KAKAO_CHAT_URL = 'http://pf.kakao.com/_ElyaX/chat';
const PHONE = '010-7469-4385';
const SERVICE_LABEL: Record<string, string> = { card: '카드', internet: '인터넷', electronics: '가전렌탈' };
const CLOSE_MS = 250;

export default function MyPageDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // 닫힘 애니메이션이 끝난 뒤 언마운트하기 위해 렌더 여부를 따로 든다
  const [rendered, setRendered] = useState(open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // shown: 실제로 열림 위치에 있는지. 마운트 직후엔 닫힌 위치로 한 번 그린 뒤 열림으로 바꿔야
  // 들어오는 슬라이드가 보인다(같은 프레임에 주면 전환 없이 바로 나타난다).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setRendered(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }
    setShown(false);
    const t = setTimeout(() => setRendered(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open]);

  // 열려 있는 동안 본문 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]" data-testid="mypage-drawer" data-state={shown ? 'open' : 'closed'}>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        data-testid="mypage-dim"
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-label="전체 보기"
        className={`absolute top-0 right-0 h-full w-[85vw] max-w-[360px] lg:max-w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-[250ms] ease-out ${
          shown ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between h-14 px-5 shrink-0">
          <p className="text-[17px] font-semibold text-[#333d4b]">전체 보기</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            data-testid="mypage-close"
            className="p-1 -m-1 text-gray-400 hover:text-[#333d4b]"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <DrawerBody onNavigate={onClose} />
        </div>
      </aside>
    </div>,
    document.body
  );
}

function DrawerBody({ onNavigate }: { onNavigate: () => void }) {
  const { items: wishes } = useWishlist();
  const { recent, leads } = useLocalActivity();
  const [searches, setSearches] = useState<string[]>([]);
  useEffect(() => setSearches(readRecentSearches()), []);

  return (
    <>
      {/* 인사 카드 — 로그인이 생기면 이 카드만 바뀐다 */}
      <div className="rounded-2xl bg-[#f2f4f6] px-5 py-4">
        <p className="text-[17px] font-semibold text-[#333d4b]">안녕하세요</p>
        <p className="mt-0.5 text-[13px] text-gray-500">
          찜 <span data-testid="mypage-wish-count">{wishes.length}</span> · 최근 본 상품 {recent.length}
        </p>
        <Link
          href="/apply"
          onClick={onNavigate}
          className="mt-3 flex items-center justify-center gap-1 h-11 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[15px] font-semibold transition-colors"
        >
          간편 신청하기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 서비스 */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {LEAD_SERVICES.map((s) => (
          <Link
            key={s.key}
            href={`/${s.key}`}
            onClick={onNavigate}
            className="flex flex-col items-center justify-center gap-1.5 h-[88px] rounded-2xl bg-[#f2f4f6] hover:bg-[#eceef1] transition-colors"
          >
            <Image src={s.icon} alt="" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[13px] font-medium text-[#333d4b]">{s.label}</span>
          </Link>
        ))}
      </div>

      <Group title="나의 활동">
        <Row href="/electronics/wishlist" onClick={onNavigate} icon={Heart} label="찜한 상품" meta={wishes.length} />
        <Row href="/electronics/search" onClick={onNavigate} icon={Search} label="최근 검색어" meta={searches.length} />
        {searches.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {searches.slice(0, 6).map((q) => (
              <Link
                key={q}
                href={`/electronics/search?q=${encodeURIComponent(q)}`}
                onClick={onNavigate}
                className="shrink-0 rounded-full bg-[#f2f4f6] px-3 py-1.5 text-[13px] text-gray-600 hover:bg-[#eceef1]"
              >
                {q}
              </Link>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 py-3">
          <History className="w-5 h-5 text-[#4e5968]" strokeWidth={1.6} />
          <span className="text-[15px] text-[#333d4b]">최근 본 상품</span>
          <span className="ml-auto text-sm text-gray-400">{recent.length}</span>
        </div>
        {recent.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {recent.slice(0, 8).map((p) => (
              <Link
                key={p.slug}
                href={`/electronics/${p.category}/${p.slug}`}
                onClick={onNavigate}
                className="shrink-0 w-[104px]"
              >
                <span className="block w-[104px] h-[104px] rounded-xl bg-[#f2f4f6] overflow-hidden relative">
                  {p.img ? (
                    <Image src={p.img} alt="" fill sizes="104px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                      {p.brand}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-[12px] text-[#333d4b] leading-snug line-clamp-2">{p.name}</span>
                <span className="block text-[12px] font-semibold text-[#333d4b]">월 {p.fee.toLocaleString()}원~</span>
              </Link>
            ))}
          </div>
        )}
        {leads.length > 0 && (
          <div className="mt-1">
            <div className="flex items-center gap-3 py-3">
              <ClipboardList className="w-5 h-5 text-[#4e5968]" strokeWidth={1.6} />
              <span className="text-[15px] text-[#333d4b]">내 상담 신청</span>
              <span className="ml-auto text-sm text-gray-400">{leads.length}</span>
            </div>
            <ul className="rounded-xl bg-[#f8f9fb] divide-y divide-white">
              {leads.slice(0, 3).map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#333d4b] truncate">
                      {SERVICE_LABEL[l.service] ?? l.service}
                      {l.productName ? ` · ${l.productName}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(l.submittedAt)} 접수</p>
                  </div>
                  {l.service === 'electronics' && (
                    <Link
                      href={`/electronics/application?lead=${l.id}`}
                      onClick={onNavigate}
                      className="shrink-0 text-xs font-semibold text-[var(--action-primary)]"
                    >
                      신청서 작성
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Group>

      <Group title="신청하기">
        <Row href="/apply" onClick={onNavigate} icon={ClipboardList} label="간편 신청하기" />
        <Row href="/electronics/application" onClick={onNavigate} icon={FileText} label="신청서 작성하기" />
      </Group>

      <Group title="고객센터">
        <Row href={`tel:${PHONE}`} icon={Phone} label="전화 문의" metaText={PHONE} />
        <Row href={KAKAO_CHAT_URL} external icon={MessageCircle} label="카카오톡 문의" metaText="혜소 채널" />
      </Group>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <p className="text-[13px] font-medium text-gray-400 mb-1">{title}</p>
      {children}
    </section>
  );
}

function Row({
  href,
  onClick,
  icon: Icon,
  label,
  meta,
  metaText,
  external,
}: {
  href: string;
  onClick?: () => void;
  icon: typeof Heart;
  label: string;
  meta?: number;
  metaText?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <Icon className="w-5 h-5 text-[#4e5968]" strokeWidth={1.6} />
      <span className="text-[15px] text-[#333d4b]">{label}</span>
      <span className="ml-auto text-sm text-gray-400">{meta !== undefined && meta > 0 ? meta : metaText}</span>
    </>
  );
  const cls = 'flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-[#f8f9fb] transition-colors';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={cls}>
      {inner}
    </Link>
  );
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}
