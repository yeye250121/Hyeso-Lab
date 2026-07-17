import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';
import { CreditCard, Smartphone, ShieldCheck, Box } from 'lucide-react';

export default function ProductsHubPage() {
  const categories = [
    {
      name: '카드 관리',
      description: '신용카드 및 체크카드 상품의 상세 정보와 이미지를 관리합니다.',
      href: '/admin/cards',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: '휴대폰 관리 (준비중)',
      description: '통신사별 단말기 및 요금제 상품 정보를 관리합니다.',
      href: '#',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: '보험 관리 (준비중)',
      description: '각종 보험 상품의 보장 내역과 가입 조건을 관리합니다.',
      href: '#',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Box className="w-6 h-6 text-[var(--action-primary)]" />
          상품 관리
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          다양한 혜택 상품(카드, 휴대폰, 보험 등)을 카테고리별로 관리할 수 있는 허브 페이지입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          const isReady = category.href !== '#';
          
          return (
            <Link
              key={idx}
              href={category.href}
              className={`block p-6 bg-white rounded-xl shadow-sm border border-gray-100 transition-all ${
                isReady ? 'hover:shadow-md hover:border-blue-200 cursor-pointer transform hover:-translate-y-1' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.bgColor}`}>
                <Icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h2>
              <p className="text-sm text-gray-500">{category.description}</p>
              
              <div className="mt-6 flex items-center text-sm font-medium">
                {isReady ? (
                  <span className="text-[var(--action-primary)] flex items-center gap-1">
                    관리 페이지로 이동 &rarr;
                  </span>
                ) : (
                  <span className="text-gray-400">업데이트 예정</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
}
