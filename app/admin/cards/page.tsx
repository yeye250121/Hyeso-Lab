import { getAllCards } from '@/lib/cardApi';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default async function AdminCardsPage() {
  const cards = await getAllCards();
  
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">카드 관리</h1>
        <Link href="/admin/cards/new" className="bg-[var(--action-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--action-primary-hover)] font-semibold transition-colors">
          새 카드 추가
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">카드사</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">분류</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {cards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 mr-4 bg-gray-100 rounded-lg flex items-center justify-center p-1">
                        {card.card_image_url ? (
                          <img className="h-full w-full object-contain" src={card.card_image_url} alt="" />
                        ) : (
                          <span className="text-xs text-gray-400">No Img</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{card.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{card.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {card.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {card.detailed_benefits ? (
                      <span className="text-green-600 font-medium text-xs">상세 완료</span>
                    ) : (
                      <span className="text-orange-500 font-medium text-xs">상세 필요</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/cards/${card.id}`} className="text-[var(--action-primary)] hover:text-red-700 font-semibold px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors">
                      수정
                    </Link>
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
