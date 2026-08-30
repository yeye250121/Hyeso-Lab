'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

// 히어로에는 검색창 하나만 둔다. 입력하면 전체보기 페이지로 넘겨
// 거기서 실제 검색 결과를 렌더링한다.
export default function HeroSearch({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/electronics/category?q=${encodeURIComponent(q)}` : '/electronics/category');
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어떤 가전을 찾으세요?"
        aria-label="가전 렌탈 상품 검색"
        className="w-full py-4 pl-12 pr-24 rounded-2xl border border-gray-200 bg-white text-[15px] placeholder-gray-400 focus:outline-none focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)] transition-all"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-[#333d4b] hover:bg-[#2b3440] text-white text-sm font-bold transition-colors"
      >
        검색
      </button>
    </form>
  );
}
