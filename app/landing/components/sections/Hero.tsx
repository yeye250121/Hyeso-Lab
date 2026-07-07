interface HeroProps {
  logoSrc?: string;
  logoAlt?: string;
  logoHeight?: number;
}

const defaultProps: HeroProps = {
  logoSrc: 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png',
  logoAlt: '혜택 연구소',
  logoHeight: 50,
};

export default function Hero(props: HeroProps = {}) {
  const { logoSrc, logoAlt, logoHeight } = { ...defaultProps, ...props };

  return (
    <section className="hero">
      <div className="logo">
        <img
          src={logoSrc}
          alt={logoAlt}
          style={{ height: `${logoHeight}px`, width: 'auto' }}
        />
      </div>
    </section>
  );
}
