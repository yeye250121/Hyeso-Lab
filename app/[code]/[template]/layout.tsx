import type { Metadata } from 'next';

type Props = {
  params: { code: string; template: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { template } = params;

  if (template === 'kb-card') {
    return {
      title: 'KB국민 화물복지카드 - 유가보조금 지원',
      description: '연회비 무료, 유가보조금 및 주유 할인 혜택',
      keywords: 'KB국민카드, 화물복지카드, 유가보조금, 주유할인',
      openGraph: {
        title: 'KB국민 화물복지카드 - 유가보조금 지원',
        description: '연회비 무료, 유가보조금 및 주유 할인 혜택',
        type: 'website',
      },
    };
  }

  // Default to KT CCTV (or explicit kt-cctv check)
  return {
    title: 'KT CCTV - 10초만에 알아보기',
    description: 'KT텔레캅 CCTV 무료 견적 상담 신청',
    keywords: 'CCTV, KT텔레캅, KT CCTV, 보안, 방범',
    openGraph: {
      title: 'KT CCTV - 10초만에 알아보기',
      description: 'KT텔레캅 CCTV 무료 견적 상담 신청',
      type: 'website',
    },
  };
}

export default function TemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
