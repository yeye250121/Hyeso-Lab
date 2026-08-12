import Link from 'next/link';
import { ChevronRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCategoryTree, getProductsForCategory } from '@/lib/electronicsApi';
import { categoryIcon } from '@/components/electronics/categoryIcons';
import ProductCard from '@/components/electronics/ProductCard';

// 카탈로그는 실시간성이 필요 없다. 관리자 수정 시 revalidateTag 로 즉시 갱신한다.
export const revalidate = 3600;

export const metadata = {
  title: '가전 렌탈 | 혜택 연구소',
  description: '정수기·공기청정기·비데까지, 약정과 관리방법에 따라 실제로 월 얼마인지 비교해 보세요.',
};

export default async function ElectronicsHubPage() {
  const [tree, popular] = await Promise.all([
    getCategoryTree(),
    getProductsForCategory('water-purifier'),
  ]);

  const top = popular.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="bg-gradient-to-b from-[#f6f8fb] to-white border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-20">
            <p className="text-[var(--action-primary)] font-bold mb-3">가전 렌탈</p>
            <h1 className="text-3xl lg:text-[42px] font-bold text-[#333d4b] leading-tight">
              월 렌탈료만 보면
              <br />
              진짜 비용을 알 수 없어요
            </h1>
            <p className="mt-5 text-gray-500 text-base lg:text-lg leading-relaxed">
              약정 기간과 관리 방법에 따라 같은 모델도 월 1~2만원씩 차이 납니다.
              <br className="hidden sm:block" />
              혜택 연구소는 총 납부액까지 함께 계산해서 보여드려요.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/electronics/water-purifier"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white font-bold transition-colors"
              >
                정수기 비교하기
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/electronics/apply"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#333d4b] font-bold transition-colors"
              >
                상담 신청
              </Link>
            </div>

            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Wallet, title: '총 납부액 표시', desc: '월 렌탈료 × 약정기간까지 함께' },
                { icon: Sparkles, title: '7개 브랜드 비교', desc: '코웨이·SK매직·쿠쿠·LG 등' },
                { icon: ShieldCheck, title: '조건별 실제 가격', desc: '약정·관리방법 선택 시 즉시 반영' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                  <Icon className="w-5 h-5 text-[var(--action-primary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#333d4b] text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 카테고리 */}
        <section className="max-w-[1100px] mx-auto px-6 py-14 lg:py-20">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#333d4b] mb-2">어떤 가전을 찾으세요?</h2>
          <p className="text-gray-500 mb-10">카테고리를 골라 조건별 렌탈료를 비교해 보세요.</p>

          <div className="space-y-10">
            {tree.map((group) => (
              <div key={group.slug}>
                <h3 className="text-sm font-bold text-gray-400 mb-4 tracking-wide">{group.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.children.map((cat) => {
                    const Icon = categoryIcon(cat.slug);
                    const ready = cat.productCount > 0;
                    return (
                      <Link
                        key={cat.slug}
                        href={`/electronics/${cat.slug}`}
                        className="group relative flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:border-[var(--action-primary)] hover:shadow-md transition-all"
                      >
                        <span
                          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${
                            ready
                              ? 'bg-[#fff1f5] text-[var(--action-primary)]'
                              : 'bg-gray-50 text-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-[#333d4b] text-[15px] truncate">
                            {cat.name}
                          </span>
                          <span className="block text-xs text-gray-400 mt-0.5">
                            {ready ? `${cat.productCount}개 모델` : '준비 중'}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 인기 모델 */}
        {top.length > 0 && (
          <section className="bg-[#f8f9fb] border-t border-gray-100">
            <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-20">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#333d4b]">월 렌탈료가 낮은 정수기</h2>
                  <p className="text-gray-500 mt-2">전체 조건 중 가장 저렴한 요금제 기준입니다.</p>
                </div>
                <Link
                  href="/electronics/water-purifier"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[#333d4b] transition-colors shrink-0"
                >
                  전체보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {top.map((p) => (
                  <ProductCard key={p.id} product={p} categorySlug="water-purifier" />
                ))}
              </div>

              <Link
                href="/electronics/water-purifier"
                className="sm:hidden mt-6 flex items-center justify-center gap-1 h-12 rounded-xl border border-gray-200 bg-white font-bold text-[#333d4b]"
              >
                전체보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
