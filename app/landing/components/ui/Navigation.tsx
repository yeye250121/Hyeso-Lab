import Image from 'next/image';

const LOGO_URL = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/blooom_logo';

export default function Navigation() {
  return (
    <nav className="navigation">
      <div className="logo">
        <Image
          src={LOGO_URL}
          alt="Piooom"
          width={120}
          height={32}
          className="h-8 w-auto"
        />
      </div>
    </nav>
  );
}
