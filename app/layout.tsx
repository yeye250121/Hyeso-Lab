import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

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
  return (
    <html lang="ko" className="overflow-x-hidden">
      <body className={`${notoSansKR.variable} font-sans antialiased bg-gray-50 overflow-x-hidden w-full`}>
        <div className="max-w-[1100px] mx-auto w-full min-h-screen bg-gray-50 flex flex-col relative shadow-sm overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
