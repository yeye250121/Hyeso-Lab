import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

export const metadata = {
  title: '개인정보처리방침 | 혜택 연구소',
  robots: { index: false },
}

// 짧은 개인정보처리방침. 눈에 띄는 자리엔 안 두고 푸터 작은 링크로만 연결한다.
export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 w-full max-w-[720px] mx-auto px-6 py-12 text-[14px] leading-relaxed text-[#4e5968]">
        <h1 className="text-[22px] font-semibold text-[#191f28]">개인정보처리방침</h1>
        <p className="mt-2 text-[12px] text-[#8b95a1]">시행일 2026년 10월 26일</p>

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">1. 수집하는 정보</h2>
            <p className="mt-1.5">상담 신청 시 이름·휴대폰 번호, 신청서 작성 시 가입에 필요한 정보(생년월일, 설치 주소, 사은품·자동이체 계좌 등)를 입력받습니다. 사이트 이용 통계를 위해 방문 페이지·유입 경로·기기 정보가 자동으로 수집됩니다.</p>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">2. 이용 목적</h2>
            <p className="mt-1.5">상담 연락, 인터넷·가전렌탈 가입 접수, 사은품 지급, 알림톡 안내, 서비스 개선을 위한 통계에 사용합니다.</p>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">3. 제3자 제공</h2>
            <p className="mt-1.5">가입 접수를 위해 제휴 접수 대행사와 해당 통신사·렌탈사에 접수에 필요한 범위에서 정보를 전달합니다.</p>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">4. 보유 기간</h2>
            <p className="mt-1.5">목적 달성 후 지체 없이 파기합니다. 관계 법령에 따라 보관이 필요한 거래 기록은 그 기간 동안 보관합니다.</p>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">5. 통계 도구와 쿠키</h2>
            <p className="mt-1.5">방문 통계를 위해 Google Analytics와 Vercel Web Analytics를 사용합니다. Google Analytics는 쿠키로 익명의 방문자 식별값을 저장하며, 브라우저 설정에서 쿠키를 거부할 수 있습니다.</p>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#333d4b]">6. 문의</h2>
            <p className="mt-1.5">피움 · 010-7469-4385 · 경상남도 창원시 진해구 충장로 68-1, 2층 1호</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
