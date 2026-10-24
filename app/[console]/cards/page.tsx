import { getCardsForAdmin } from '@/lib/cardApi';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

// 카드 상품 관리. 모바일은 건당 카드, 데스크톱은 표.
export default async function AdminCardsPage({ params }: { params: { console: string } }) {
  const cp = (p: string) => `/${params.console}${p}`;
  const cards = await getCardsForAdmin();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-headline text-text-primary">카드 상품</h1>
            <p className="text-small text-text-secondary mt-1">총 {cards.length}개 · 상세 필요 {cards.filter((c) => !c.detailed_benefits).length}개</p>
          </div>
          <Link href={cp('/cards/new')} className="inline-flex items-center gap-1 h-10 px-4 rounded-button bg-action-primary text-white text-small font-medium hover:bg-action-primary-hover transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> 새 카드
          </Link>
        </div>

        {/* 모바일: 건당 카드 */}
        <ul className="md:hidden space-y-2.5" data-testid="card-cards">
          {cards.length === 0 && <li className="rounded-card bg-bg-card px-5 py-10 text-center text-small text-text-secondary">등록된 카드가 없습니다.</li>}
          {cards.map((card) => (
            <li key={card.id}>
              <Link href={cp(`/cards/${card.id}`)} className="flex items-center gap-3 rounded-card bg-bg-card p-3.5" data-testid="card-card">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-bg-primary flex items-center justify-center p-1 overflow-hidden">
                  {card.card_image_url ? (
                    <Image className="h-full w-full object-contain" src={card.card_image_url} alt="" width={48} height={48} />
                  ) : (
                    <span className="text-[10px] text-text-tertiary">No Img</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-text-primary truncate">{card.name}</p>
                  <p className="mt-0.5 text-xs text-text-secondary truncate">{card.company} · {card.type}</p>
                  <p className={`mt-0.5 text-xs font-medium ${card.detailed_benefits ? 'text-green-600' : 'text-orange-500'}`}>{card.detailed_benefits ? '상세 완료' : '상세 필요'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        {/* 데스크톱: 표 */}
        <div className="hidden md:block bg-bg-card rounded-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-small">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">카드사</th>
                <th className="px-4 py-3 font-medium">분류</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="border-b border-border last:border-0 hover:bg-bg-primary transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-bg-primary rounded-lg flex items-center justify-center p-1 overflow-hidden">
                        {card.card_image_url ? (
                          <Image className="h-full w-full object-contain" src={card.card_image_url} alt="" width={40} height={40} />
                        ) : (
                          <span className="text-[10px] text-text-tertiary">No Img</span>
                        )}
                      </div>
                      <span className="font-medium text-text-primary">{card.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{card.company}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-bg-primary text-xs font-medium text-text-secondary">{card.type}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-medium ${card.detailed_benefits ? 'text-green-600' : 'text-orange-500'}`}>{card.detailed_benefits ? '상세 완료' : '상세 필요'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Link href={cp(`/cards/${card.id}`)} className="text-action-primary font-medium hover:underline">수정</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
