import AdminLayout from '@/components/admin/AdminLayout';
import CardForm from '@/components/admin/CardForm';

export default function NewCardPage() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 카드 등록</h1>
        <p className="text-gray-500 text-sm mt-1">새로운 카드의 상세 정보를 입력하세요.</p>
      </div>
      
      <CardForm />
    </AdminLayout>
  );
}
