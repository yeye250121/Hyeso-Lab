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
    representative?: string;
    businessNumber: string;
    /** 통신판매업 신고번호 */
    mailOrderNumber?: string;
    address: string;
    phone: string;
  };
  linkSections?: FooterLinkSection[];
  showCopyright?: boolean;
  /** 좁은 한 컬럼(파트너 랜딩 등)에서는 데스크톱에서도 세로로 쌓는다 */
  compact?: boolean;
}

const defaultCompanyInfo = {
  name: '피움',
  representative: '신예준',
  businessNumber: '573-07-03391',
  mailOrderNumber: '2026-창원진해-0365',
  address: '경상남도 창원시 진해구 충장로 68-1, 2층 1호(충무동)',
  phone: '010-7469-4385',
};

const defaultLinkSections: FooterLinkSection[] = [
  {
    title: '서비스',
    links: [
      { text: '카드 혜택', href: '/card' },
      { text: '인터넷 혜택', href: '/internet' },
      { text: '가전렌탈 혜택', href: '/electronics' },
    ],
  },
  {
    title: '문의',
    links: [
      { text: '상담 신청', href: '/apply' },
    ],
  },
];

export default function Footer({
  logoSrc = 'https://urxbdqmrsfzmztkacfiv.supabase.co/storage/v1/object/public/HYESO-LAB/logos/hyeso.png',
  companyInfo = defaultCompanyInfo,
  linkSections = defaultLinkSections,
  showCopyright = true,
  compact = false,
}: FooterProps) {
  return (
    <footer className={`bg-[#f8f9fa] py-12 ${compact ? '' : 'lg:py-16'}`}>
      <div className="max-w-[1100px] mx-auto px-6">
        <div className={`flex flex-col justify-between gap-10 ${compact ? '' : 'lg:flex-row'}`}>
          {/* Company Info */}
          <div className="space-y-4">
            <Image
              src={logoSrc}
              alt="혜택 연구소"
              width={720}
              height={264}
              className="h-5 w-auto opacity-80"
            />
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                {companyInfo.name}
                {companyInfo.representative && ` | 대표자 : ${companyInfo.representative}`}
              </p>
              <p>사업자등록번호 : {companyInfo.businessNumber}</p>
              {companyInfo.mailOrderNumber && <p>통신판매업 신고번호 : {companyInfo.mailOrderNumber}</p>}
              <p>주소 : {companyInfo.address}</p>
              <p className="pt-1 text-xs text-gray-500">
                <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
              </p>
            </div>
          </div>

          {/* Links */}
          <div className={`flex ${compact ? 'gap-10' : 'gap-16'}`}>
            {linkSections.map((section, index) => (
              <div key={index}>
                <h3 className="text-gray-800 font-semibold mb-4">{section.title}</h3>
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
            <p className="text-gray-500 text-sm text-center">
              © {new Date().getFullYear()} 혜택 연구소. All rights reserved.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
