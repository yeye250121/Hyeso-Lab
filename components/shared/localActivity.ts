'use client';

import { useSyncExternalStore } from 'react';

// 로그인이 없는 서비스라 "나의 활동"은 전부 브라우저 저장이다.
// 찜(bl:wishlist)·최근 검색(bl:recent-searches)과 같은 방식으로,
// 최근 본 상품과 내가 남긴 상담 신청을 기록해 마이페이지 서랍에서 보여준다.

export type RecentProduct = {
  slug: string;
  category: string;
  brand: string;
  name: string;
  fee: number;
  img: string | null;
  viewedAt: number;
};

export type MyLead = {
  id: string;
  service: 'card' | 'internet' | 'electronics';
  productName: string | null;
  submittedAt: number;
};

const RECENT_KEY = 'bl:recent-products';
const LEADS_KEY = 'bl:my-leads';
const EVENT = 'bl:activity-changed';
const RECENT_MAX = 10;
const LEADS_MAX = 10;

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, items: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // 시크릿 모드 등에서 실패할 수 있다. 편의 기능이라 조용히 넘어간다.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function pushRecentProduct(item: Omit<RecentProduct, 'viewedAt'>) {
  const rest = readArray<RecentProduct>(RECENT_KEY).filter((p) => p.slug !== item.slug);
  writeArray(RECENT_KEY, [{ ...item, viewedAt: Date.now() }, ...rest].slice(0, RECENT_MAX));
}

export function pushMyLead(lead: Omit<MyLead, 'submittedAt'>) {
  const rest = readArray<MyLead>(LEADS_KEY).filter((l) => l.id !== lead.id);
  writeArray(LEADS_KEY, [{ ...lead, submittedAt: Date.now() }, ...rest].slice(0, LEADS_MAX));
}

// useSyncExternalStore 용 스냅샷 캐시. 이벤트가 올 때만 다시 읽는다.
type Snapshot = { recent: RecentProduct[]; leads: MyLead[] };
const EMPTY: Snapshot = { recent: [], leads: [] };
let cache: Snapshot = EMPTY;
let cacheReady = false;

function getSnapshot(): Snapshot {
  if (!cacheReady) {
    cache = { recent: readArray<RecentProduct>(RECENT_KEY), leads: readArray<MyLead>(LEADS_KEY) };
    cacheReady = true;
  }
  return cache;
}

function subscribe(cb: () => void) {
  const invalidate = () => {
    cacheReady = false;
    cb();
  };
  window.addEventListener(EVENT, invalidate);
  window.addEventListener('storage', invalidate);
  return () => {
    window.removeEventListener(EVENT, invalidate);
    window.removeEventListener('storage', invalidate);
  };
}

export function useLocalActivity(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
