import Image from 'next/image';

export interface BenefitCardItem {
  imageSrc: string;
  imageAlt: string;
  bgColor: string;
  title: React.ReactNode;
  description: React.ReactNode;
  /** 이미지 하단 정렬 (기본: center) */
  imageAlignBottom?: boolean;
  /** 이미지 크기 클래스 (기본: 'w-52 h-52 lg:w-64 lg:h-64') */
  imageClassName?: string;
}

export interface PartnersBenefitsProps {
  sectionTitle?: React.ReactNode;
  benefits?: BenefitCardItem[];
  /** 섹션 타이틀 위에 표시할 로고 URL */
  logoUrl?: string;
  /** 로고 alt 텍스트 */
  logoAlt?: string;
}

const defaultBenefits: BenefitCardItem[] = [
  {
    imageSrc: 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_idea_icon_v02.png',
    imageAlt: '아이디어 아이콘',
    bgColor: '#e8f3ff',
    title: (
      <>
        검증된 방법을<br />
        알려드려요
      </>
    ),
    description: (
      <>
        요즘 뜨는 트렌드와<br />성공하는 가이드라인을 드려요.
      </>
    ),
  },
  {
    imageSrc: 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_money_icon_v01.png',
    imageAlt: '수수료 아이콘',
    bgColor: '#f0faf6',
    title: (
      <>
        수수료는 기본,<br />
        지원금도 받아요
      </>
    ),
    description: (
      <>
        매달 성과가 오르면<br />지원금을 더 드려요.
      </>
    ),
  },
];

const defaultProps: PartnersBenefitsProps = {
  sectionTitle: (
    <>
      피움 파트너만<br />받을 수 있어요
    </>
  ),
  benefits: defaultBenefits,
};

export default function PartnersBenefits(props: PartnersBenefitsProps = {}) {
  const { sectionTitle, benefits, logoUrl, logoAlt } = { ...defaultProps, ...props };

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-16 lg:mb-20 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={logoAlt || 'Logo'}
              width={160}
              height={48}
              className="h-12 w-auto mx-auto mb-6"
            />
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-[#333d4b]">
            {sectionTitle}
          </h2>
        </div>

        {/* Benefit Cards */}
        <div className="space-y-16 lg:space-y-20">
          {benefits?.map((benefit, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center justify-center gap-8 lg:gap-12 animate-on-scroll opacity-0 translate-y-12 transition-all duration-700`}
            >
              <div
                className={`w-[280px] lg:w-[290px] h-[230px] lg:h-[290px] rounded-[24px] flex ${benefit.imageAlignBottom ? 'items-end' : 'items-center'} justify-center flex-shrink-0`}
                style={{ backgroundColor: benefit.bgColor }}
              >
                <Image
                  src={benefit.imageSrc}
                  alt={benefit.imageAlt}
                  width={280}
                  height={280}
                  className={`${benefit.imageClassName || 'w-52 h-52 lg:w-64 lg:h-64'} ${benefit.imageAlignBottom ? 'object-contain object-bottom' : 'object-contain'}`}
                />
              </div>
              <div className="text-center lg:text-left lg:self-start lg:w-[300px]">
                <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] mb-4 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-lg lg:text-xl text-[#4e5968] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
