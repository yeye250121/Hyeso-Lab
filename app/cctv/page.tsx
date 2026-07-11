import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function CctvPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-24">
        <h1 className="text-3xl font-bold">📹 CCTV 연구</h1>
        <p className="mt-4">CCTV 혜택 페이지 준비 중...</p>
      </main>
      <Footer />
    </>
  );
}
