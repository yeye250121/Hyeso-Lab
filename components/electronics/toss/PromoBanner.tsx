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
      className="flex items-center justify-between gap-4 rounded-2xl lg:rounded-3xl bg-gradient-to-r from-[#fff3f6] to-[#ffe4ec] hover:to-[#ffdce7] transition-colors px-6 py-9 lg:h-[320px] lg:py-0 lg:pl-[120px] lg:pr-[150px]"
    >
      <div className="min-w-0">
        <p className="text-[24px] lg:text-[30px] font-bold text-[#333d4b] leading-[1.3] tracking-[-0.01em] break-keep">
          내 지원금
          <br />
          눌러서 받기
        </p>
        <p className="mt-2.5 lg:mt-4 text-[14px] lg:text-[17px] text-[#4e5968]">당일 현금으로 받으세요</p>
      </div>
      <Image
        src={MONEYGUN_URL}
        alt=""
        width={720}
        height={468}
        sizes="(min-width: 1024px) 264px, 150px"
        priority
        className="w-[150px] lg:w-[264px] h-auto shrink-0"
      />
    </Link>
  );
}
