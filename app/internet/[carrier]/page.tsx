import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import CarrierConfigurator from '@/components/internet/CarrierConfigurator';
import InternetNotes from '@/components/internet/InternetNotes';
import { getCarriers, getInternetProducts } from '@/lib/internetApi';

export const revalidate = 3600;

type Props = {
  params: { carrier: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: Props) {
  const carriers = await getCarriers();
  const c = carriers.find((x) => x.id === params.carrier);
  return {
    title: c ? `${c.name} 인터넷 요금제 | 혜택 연구소` : '인터넷 | 혜택 연구소',
    description: c ? `${c.name} 인터넷·TV 조건을 고르면 월 요금과 사은품이 바로 보여요.` : undefined,
  };
}

export default async function CarrierPage({ params, searchParams }: Props) {
  const [carriers, products] = await Promise.all([getCarriers(), getInternetProducts()]);
  const carrier = carriers.find((c) => c.id === params.carrier);
  if (!carrier) notFound();

  const mine = products.filter((p) => p.carrier_id === carrier.id);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-6 pb-16">
        <div className="pt-4">
          <Link href="/internet" className="inline-flex items-center gap-0.5 text-sm text-gray-500 hover:text-[#333d4b]">
            <ChevronLeft className="w-4 h-4" /> 인터넷 홈
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#333d4b]">{carrier.name} 인터넷</h1>
          <p className="mt-1 text-sm text-gray-500">조건을 고르면 월 요금과 사은품이 바로 계산돼요.</p>
        </div>

        <div className="pt-8">
          <CarrierConfigurator
            key={carrier.id}
            carrier={carrier}
            carriers={carriers}
            products={mine}
            initial={{ addon: first(searchParams?.addon), speed: first(searchParams?.speed), name: first(searchParams?.name) }}
          />
        </div>

        <div className="pt-16 lg:max-w-[calc(100%-380px)]">
          <InternetNotes />
        </div>
      </main>
      <Footer />
    </div>
  );
}
