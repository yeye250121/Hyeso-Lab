import Image from 'next/image';

export interface PartnersSupportProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

const defaultProps: PartnersSupportProps = {
  title: (
    <>
      하고 싶은 것만<br />딱 골라서 해요
    </>
  ),
  description: (
    <>
      고객 상담부터 관리까지,<br />혜택 연구소가 귀찮은 건 다 해드릴게요.
    </>
  ),
  imageSrc: 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_a_man_looking_phone_icon_v02.png',
  imageAlt: '폰을 보는 사람',
};

export default function PartnersSupport(props: PartnersSupportProps = {}) {
  const { title, description, imageSrc, imageAlt } = { ...defaultProps, ...props };

  return (
    <section className="relative bg-[#fff0f4] pt-16 lg:pt-24 pb-48 lg:pb-56">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center animate-on-scroll opacity-0 translate-y-12 transition-all duration-700 mb-12 lg:mb-16">
          <h3 className="text-2xl lg:text-3xl font-bold text-[#333d4b] leading-tight mb-4">
            {title}
          </h3>
          <p className="text-lg lg:text-xl text-[#4e5968]">
            {description}
          </p>
        </div>
      </div>
      {/* 이미지 - 하단이 Support 섹션 하단(=CTA 상단)과 일치 */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-10 flex items-end">
        <Image
          src={imageSrc!}
          alt={imageAlt!}
          width={320}
          height={320}
          className="w-56 h-56 lg:w-72 lg:h-72 object-contain object-bottom"
        />
      </div>
    </section>
  );
}
