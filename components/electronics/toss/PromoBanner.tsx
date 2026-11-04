import Image from 'next/image';
import Link from 'next/link';

// 가전렌탈 홈 상단 배너 한 장: 옅은 분홍 배경, 왼쪽 문구, 오른쪽 머니건 이미지. 누르면 상담 신청.
// 원본(스토리지 icons/moneygun_icon.png)은 체크무늬가 그려진 불투명 PNG 라, 배경을 걷어낸 사본을 public 에 둔다.
const MONEYGUN_URL = '/electronics/moneygun.png';

export default function PromoBanner() {
  return (
    <Link
      href="/apply"
      data-testid="promo-banner"
      className="flex items-center justify-between gap-4 rounded-2xl bg-[#fff1f5] hover:bg-[#ffe9ef] transition-colors px-6 py-6 lg:px-10 lg:py-8"
    >
      <div className="min-w-0">
        <p className="text-[22px] lg:text-[28px] font-bold text-[#333d4b] leading-[1.3] tracking-[-0.01em] break-keep">
          내 지원금
          <br />
          눌러서 받기
        </p>
        <p className="mt-2 text-[13px] lg:text-[15px] text-gray-500">당일 현금으로 받으세요</p>
      </div>
      <Image
        src={MONEYGUN_URL}
        alt=""
        width={720}
        height={468}
        sizes="(min-width: 1024px) 200px, 136px"
        priority
        className="w-[136px] lg:w-[200px] h-auto shrink-0"
      />
    </Link>
  );
}
