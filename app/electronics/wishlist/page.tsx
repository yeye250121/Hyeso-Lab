import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ShopGnb from '@/components/electronics/toss/ShopGnb';
import WishlistView from '@/components/electronics/toss/WishlistView';
import { buildGnbTabs } from '@/components/electronics/toss/gnbTabs';

// 정적 세그먼트라 /electronics/[category] 보다 우선한다.
// 'wishlist' 슬러그를 가진 카테고리는 만들지 말 것.
export const revalidate = 3600;

export const metadata = {
  title: '찜 목록 | 혜택 연구소',
  description: '찜해둔 렌탈 상품을 한곳에서 다시 확인하세요.',
};

export default async function WishlistPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <ShopGnb tabs={await buildGnbTabs()} />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pt-6 pb-24">
        <h1 className="text-xl font-bold text-[#333d4b] mb-6">찜 목록</h1>
        <WishlistView />
      </main>
      <Footer />
    </div>
  );
}
