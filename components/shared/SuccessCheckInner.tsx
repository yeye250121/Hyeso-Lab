'use client';

import { useEffect, useRef } from 'react';
import { useLottie } from 'lottie-react';
import animationData from './check-success.json';

// 접수 완료 체크 애니메이션(로티 JSON: check-success.json).
// 0~36 프레임은 원형 로딩(반복), 36~90 프레임은 원판이 커지며 체크가 뻗어 나오고
// 주변으로 물방울이 터지는 구간. done 이 true 가 되는 순간 반복을 멈추고 완료 구간을
// 한 번 재생한다. onFinished 는 체크가 다 그려지는 60프레임에 부른다(문구가 이때 뜨는 게
// 자연스럽고, 물방울이 사라질 때까지 기다리면 늦다).
const SPIN = [0, 36] as const;
const DONE = [36, 90] as const;
const CHECK_DRAWN = 60;

export default function SuccessCheckInner({
  done,
  onFinished,
  size,
}: {
  done: boolean;
  onFinished?: () => void;
  size: number;
}) {
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;
  const doneRef = useRef(done);
  doneRef.current = done;
  const firedRef = useRef(false);
  const fire = () => {
    if (firedRef.current || !doneRef.current) return;
    firedRef.current = true;
    finishedRef.current?.();
  };

  const lottie = useLottie({
    src: animationData,
    autoplay: true,
    loop: !done,
    segment: done ? DONE : SPIN,
    subscriptions: {
      frame: ({ currentFrame }) => {
        if (currentFrame >= CHECK_DRAWN) fire();
      },
      complete: fire,
    },
  });

  const { setLoop, playSegments } = lottie;
  useEffect(() => {
    if (!done) return;
    setLoop(false);
    playSegments(DONE);
  }, [done, setLoop, playSegments]);

  return (
    <div
      ref={lottie.setDisplayRef}
      style={{ width: size, height: size }}
      className="mx-auto"
      data-testid="success-check"
      data-done={done}
    />
  );
}
