import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

// 홈 상단의 원형 숏컷. 토스의 이벤트성 숏컷 자리에는 이벤트 시스템이 없으므로
// 실제 동작하는 진입점(상담·카테고리·찜·인기 카테고리)을 놓는다.
export type Shortcut = { label: string; href: string; icon: LucideIcon };

export default function CircleShortcuts({ items }: { items: Shortcut[] }) {
  return (
    <ul className="flex items-start justify-between max-w-[420px] mx-auto sm:mx-0 sm:gap-10 sm:justify-start">
      {items.map(({ label, href, icon: Icon }) => (
        <li key={href}>
          <Link href={href} className="group flex flex-col items-center gap-2 w-[68px]">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#f4f5f7] transition-colors group-hover:bg-[#eceef1]">
              <Icon className="w-6 h-6 text-[#333d4b]" strokeWidth={1.6} />
            </span>
            <span className="text-xs font-medium text-[#333d4b] whitespace-nowrap">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
