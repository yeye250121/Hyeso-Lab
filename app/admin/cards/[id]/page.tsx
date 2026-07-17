import { getCardById } from '@/lib/cardApi';
import { notFound } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { ArrowLeft, FileJson } from 'lucide-react';

export default async function AdminCardEditPage({ params }: { params: { id: string } }) {
  const decodedId = decodeURIComponent(params.id);
  const card = await getCardById(decodedId);

  if (!card) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/admin/cards"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{card.name} 상세 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            상품 혜택 및 상세 정보는 JSON 파일에서 직접 관리합니다.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-2xl mx-auto mt-12">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileJson className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">상품 상세 수정 안내</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          에디터를 통한 상품 구성 기능은 비활성화되었습니다.<br/>
          상품 정보나 혜택을 추가 및 수정하시려면 코드 에디터에서<br/>
          <code className="bg-gray-100 text-pink-500 px-2 py-1 rounded mx-1">data/cards.json</code>
          파일을 직접 수정해 주시기 바랍니다.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-500 border border-gray-100">
          <strong>현재 카드 ID:</strong> <span className="text-gray-900">{card.id}</span>
        </div>
      </div>
    </AdminLayout>
  );
}
