import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import SiteFrame from '@/components/shared/SiteFrame';

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "혜택 연구소",
  description: "집에서 딸깍, 혜택 연구소",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // overflow-x-hidden 은 조상 요소를 스크롤 컨테이너로 만들어 하위 sticky 를
  // 전부 죽인다. clip 은 같은 클리핑을 하되 스크롤 컨테이너를 만들지 않는다.
  return (
    <html lang="ko" className="overflow-x-clip">
      <body className={`${notoSansKR.variable} font-sans antialiased bg-gray-50 overflow-x-clip w-full`}>
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
