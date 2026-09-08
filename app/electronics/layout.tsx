import { ToastHost } from '@/components/electronics/toss/toast';

// 가전렌탈 섹션 공용 레이아웃. 찜/장바구니 토스트가 어느 페이지에서든 뜨도록
// ToastHost 를 여기서 마운트한다.
export default function ElectronicsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastHost />
    </>
  );
}
