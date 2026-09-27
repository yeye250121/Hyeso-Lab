'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// 페이지가 searchParams 를 서버에서 읽으면 정적 생성이 풀려 요청마다 서버가 돈다.
// 대신 정적으로 만든 화면 위에서, 하이드레이션 뒤에 URL 의 쿼리를 읽어 상태로 밀어 넣는다.
// useSearchParams 는 Suspense 경계가 필요하므로 여기서 감싼다. 화면에는 아무것도 그리지 않는다.

type Values = Record<string, string | undefined>;

function Reader({ keys, onChange }: { keys: string[]; onChange: (v: Values) => void }) {
  const params = useSearchParams();
  const serialized = keys.map((k) => `${k}=${params.get(k) ?? ''}`).join('&');
  useEffect(() => {
    const v: Values = {};
    for (const k of keys) v[k] = params.get(k) ?? undefined;
    onChange(v);
    // keys 배열은 호출부에서 리터럴로 고정한다. 값이 바뀔 때만 다시 알린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);
  return null;
}

export default function SearchParamSync(props: { keys: string[]; onChange: (v: Values) => void }) {
  return (
    <Suspense fallback={null}>
      <Reader {...props} />
    </Suspense>
  );
}
