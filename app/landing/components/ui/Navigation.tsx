import Image from 'next/image';

const LOGO_URL = 'https://yknptcjxrizgccxczzuy.supabase.co/storage/v1/object/public/Benefit-lab/Benefit-lab_logo_v0.png';

export default function Navigation() {
  return (
    <nav className="navigation">
      <div className="logo">
        <Image
          src={LOGO_URL}
          alt="혜택 연구소"
          width={120}
          height={32}
          className="h-8 w-auto"
        />
      </div>
    </nav>
  );
}
