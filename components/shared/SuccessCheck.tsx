'use client';

import dynamic from 'next/dynamic';

// lottie-web 은 불러오는 순간 document 를 쓰므로 서버 렌더에서 제외한다.
// 애니메이션 본체는 SuccessCheckInner 에 있다.
const Inner = dynamic(() => import('./SuccessCheckInner'), {
  ssr: false,
  loading: () => <div className="mx-auto" style={{ width: 120, height: 120 }} />,
});

export default function SuccessCheck({
  done,
  onFinished,
  size = 120,
}: {
  done: boolean;
  /** 체크 애니메이션이 끝났을 때. 완료 문구를 이때 보여주면 자연스럽다 */
  onFinished?: () => void;
  size?: number;
}) {
  return <Inner done={done} onFinished={onFinished} size={size} />;
}
