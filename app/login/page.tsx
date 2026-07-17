'use client'

import Navbar from "@/components/shared/Navbar"
import Footer from "@/components/shared/Footer"
import { ShieldCheck } from "lucide-react"

export default function GeneralUserLoginPage() {
  const handleKakaoLogin = () => {
    alert('카카오 본인인증 로그인 기능은 준비 중입니다.')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">본인인증 로그인</h1>
          <p className="text-gray-500 text-sm mb-8">
            안전한 혜택 확인을 위해 카카오 본인인증이 필요합니다.
          </p>

          <button 
            onClick={handleKakaoLogin}
            className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] font-semibold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors mb-4"
          >
            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current">
              <path d="M16 4.64C8.6 4.64 2.6 9.38 2.6 15.22c0 3.8 2.66 7.14 6.64 9.06-.2.72-1.32 4.96-1.34 5.06-.06.28.1.34.28.22.2-.12 5.02-3.4 7-4.78.28.02.56.02.82.02 7.4 0 13.4-4.74 13.4-10.58S23.4 4.64 16 4.64z" />
            </svg>
            카카오톡으로 시작하기
          </button>
          
          <p className="text-xs text-gray-400 mt-6">
            현재 개발 진행 중인 기능입니다. (추후 구현 예정)
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
