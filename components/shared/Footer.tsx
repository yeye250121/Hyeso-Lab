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
    representative: string;
    businessNumber: string;
    address: string;
    phone: string;
  };
  linkSections?: FooterLinkSection[];
  showCopyright?: boolean;
}

const defaultCompanyInfo = {
  name: '씨씨엔',
  representative: '이경태',
  businessNumber: '118-19-02349',
  address: '경상남도 창원시 진해구 신항2로 114, 423호(용원동, 다인로얄팰리스 부산신항2차)',
  phone: '010-7469-4385',
};

const defaultLinkSections: FooterLinkSection[] = [
  {
    title: '서비스',
    links: [
      { text: '카드 혜택', href: '/card' },
      { text: '인터넷 혜택', href: '/internet' },
      { text: '휴대폰 혜택', href: '/phone' },
      { text: 'CCTV 혜택', href: '/cctv' },
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
  logoSrc = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/sign/HYESO-LAB/logos/hyeso-lab_logo_pic_text_black.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wYzEzYTRlNC02NWI3LTRlODEtYWVhZC03OTA0NzkzODYyYmIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJIWUVTTy1MQUIvbG9nb3MvaHllc28tbGFiX2xvZ29fcGljX3RleHRfYmxhY2sucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MzQzOTY5NywiZXhwIjoxNzg0MDQ0NDk3fQ.0OSrIdhjHpi-MpWgqlIvh-cZprpWIJx4t6M7gHdQ10Y',
  companyInfo = defaultCompanyInfo,
  linkSections = defaultLinkSections,
  showCopyright = true,
}: FooterProps) {
  return (
    <footer className="bg-[#f8f9fa] py-12 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-10">
          {/* Company Info */}
          <div className="space-y-4">
            <Image
              src={logoSrc}
              alt="혜택 연구소"
              width={166}
              height={50}
              className="h-[50px] w-auto brightness-0 opacity-60 transition-opacity"
            />
            <div className="space-y-1 text-sm text-gray-500">
              <p>{companyInfo.name} | 대표자 : {companyInfo.representative}</p>
              <p>사업자등록번호 : {companyInfo.businessNumber}</p>
              <p>주소 : {companyInfo.address}</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            {linkSections.map((section, index) => (
              <div key={index}>
                <h4 className="text-gray-800 font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link href={link.href} className="hover:text-gray-900 transition-colors">
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
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} 혜택 연구소. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
