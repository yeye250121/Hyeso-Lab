import Link from 'next/link';

export interface PartnersCTAProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  ctaText?: string;
  ctaHref?: string;
  imageSrc?: string;
  imageAlt?: string;
}

const defaultProps: PartnersCTAProps = {
  title: (
    <>
      혜택 연구소와 함께<br />더 크게 성장해요
    </>
  ),
  description: '지금 바로 파트너가 되어보세요.',
  ctaText: '30초 만에 시작하기',
  ctaHref: '/partners/login',
};

export default function PartnersCTA(props: PartnersCTAProps = {}) {
  const { title, description, ctaText, ctaHref, imageSrc, imageAlt } = { ...defaultProps, ...props };

  return (
    <section className="relative bg-[#191f28] pt-20 lg:pt-40 pb-48 lg:pb-32 overflow-hidden">
      {/* 배경 이미지 - 모바일에서만 표시 */}
      {imageSrc && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:hidden">
          <img
            src={imageSrc}
            alt={imageAlt || ''}
            className="w-48 h-48 object-contain"
          />
        </div>
      )}
      <div className="max-w-[1100px] mx-auto px-6 text-center relative z-10">
        <div className="animate-on-scroll opacity-0 translate-y-12 transition-all duration-700">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-white/60 text-lg mb-10">
            {description}
          </p>
          <Link
            href={ctaHref!}
            className="inline-flex items-center gap-2 bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
          >
            {ctaText}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
