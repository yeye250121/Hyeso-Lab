'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, X } from 'lucide-react';
import { readRecentSearches, removeRecentSearch } from './recentSearches';

export default function RecentSearches() {
  const router = useRouter();
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(readRecentSearches());
  }, []);

  if (items.length === 0) return null;

  return (
    <section data-testid="recent-searches">
      <h2 className="text-[15px] font-bold text-[#333d4b] mb-3">최근 검색어</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((q) => (
          <li
            key={q}
            className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600"
          >
            <button
              type="button"
              onClick={() => router.push(`/electronics/search?q=${encodeURIComponent(q)}`)}
              className="flex items-center gap-1.5 hover:text-[#333d4b]"
            >
              <Clock3 className="w-3.5 h-3.5 text-gray-300" />
              {q}
            </button>
            <button
              type="button"
              aria-label={`${q} 삭제`}
              onClick={() => {
                removeRecentSearch(q);
                setItems(readRecentSearches());
              }}
              className="p-1 rounded-full text-gray-300 hover:bg-gray-50 hover:text-gray-500"
            >
              <X className="w-3 h-3" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
