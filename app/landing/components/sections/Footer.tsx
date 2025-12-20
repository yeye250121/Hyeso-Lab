import Image from 'next/image';
import Link from 'next/link';

interface FooterLink {
  text: string;
  href: string;
}

interface FooterLinkSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logoSrc?: string;
  companyInfo?: {
    name: string;
    businessNumber: string;
    address: string;
    phone: string;
  };
  linkSections?: FooterLinkSection[];
  showCopyright?: boolean;
}

const defaultCompanyInfo = {
  name: '케어온',
  businessNumber: '609-41-95762',
  address: '경상남도 창원시 진해구 여명로25번나길 27, 1동 301호',
  phone: '010-7469-4385',
};

const defaultLinkSections: FooterLinkSection[] = [
  {
    title: '서비스',
    links: [
      { text: '파트너 로그인', href: '/partners/login' },
      { text: '파트너 가입', href: '/partners/register' },
    ],
  },
  {
    title: '문의',
    links: [
      { text: '상담 신청', href: '/landing' },
    ],
  },
];

export default function Footer({
  logoSrc = 'https://hvwgs4k77hcs8ntu.public.blob.vercel-storage.com/piooom_logo',
  companyInfo = defaultCompanyInfo,
  linkSections = defaultLinkSections,
  showCopyright = true,
}: FooterProps) {
  return (
    <footer className="bg-[#333d4b] py-12 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          {/* Company Info */}
          <div className="space-y-4">
            <Image
              src={logoSrc}
              alt="Piooom"
              width={80}
              height={24}
              className="h-6 w-auto brightness-0 invert"
            />
            {/* 사업자 정보 삭제됨 */}
          </div>

          {/* Links */}
          <div className="flex gap-16">
            {linkSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-[#8b95a1] text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="hover:text-white transition-colors">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {showCopyright && (
          <div className="mt-12 pt-8 border-t border-[#4e5968]">
            <p className="text-[#6b7684] text-sm text-center">
              © {new Date().getFullYear()} Piooom. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
