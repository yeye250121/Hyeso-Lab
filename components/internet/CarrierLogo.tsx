'use client';

import { useState } from 'react';

// 통신사 로고. 파일이 없거나 깨지면 이름 텍스트로 대신한다.
export default function CarrierLogo({
  src,
  name,
  className = '',
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`inline-flex items-center justify-center text-[15px] font-bold text-[#333d4b] ${className}`}>
        {name}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
