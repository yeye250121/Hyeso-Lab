'use client';

import { useCallback, useSyncExternalStore } from 'react';

// 장바구니 대신 쓰는 찜 목록. 결제가 없는 서비스라 서버 상태가 필요 없고,
// localStorage 만으로 유지한다. 가격은 찜한 시점의 스냅샷이라 변동될 수 있다.
export type WishItem = {
  slug: string;
  category: string;
  brand: string;
  name: string;
  fee: number;
  list: number | null;
  img: string | null;
  addedAt: number;
};

const KEY = 'bl:wishlist';
const EVENT = 'bl:wishlist-changed';

function read(): WishItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: WishItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // 사파리 시크릿 모드 등에서 실패할 수 있다. 찜은 편의 기능이라 조용히 넘어간다.
  }
  window.dispatchEvent(new Event(EVENT));
}

// useSyncExternalStore 용 캐시. 매 구독마다 JSON.parse 하지 않는다.
let cache: WishItem[] = [];
let cacheReady = false;

function getSnapshot(): WishItem[] {
  if (!cacheReady) {
    cache = read();
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
  window.addEventListener('storage', invalidate); // 다른 탭에서의 변경
  return () => {
    window.removeEventListener(EVENT, invalidate);
    window.removeEventListener('storage', invalidate);
  };
}

const EMPTY: WishItem[] = [];

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = useCallback((item: Omit<WishItem, 'addedAt'>): boolean => {
    const current = read();
    const exists = current.some((w) => w.slug === item.slug);
    write(
      exists
        ? current.filter((w) => w.slug !== item.slug)
        : [{ ...item, addedAt: Date.now() }, ...current]
    );
    return !exists;
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((w) => w.slug !== slug));
  }, []);

  const has = useCallback((slug: string) => items.some((w) => w.slug === slug), [items]);

  return { items, count: items.length, toggle, remove, has };
}
