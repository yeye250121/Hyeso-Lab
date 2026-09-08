// 최근 검색어. 검색 제출 시 기록하고 검색 홈에서 보여준다.
const KEY = 'bl:recent-searches';
const MAX = 10;

export function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(q: string) {
  const query = q.trim();
  if (!query) return;
  try {
    const next = [query, ...readRecentSearches().filter((v) => v !== query)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 무시 — 편의 기능이다
  }
}

export function removeRecentSearch(q: string) {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(readRecentSearches().filter((v) => v !== q))
    );
  } catch {
    /* noop */
  }
}
