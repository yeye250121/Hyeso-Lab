'use client';

import { useEffect } from 'react';
import { pushRecentProduct, type RecentProduct } from '@/components/shared/localActivity';

// 상세 페이지에 마운트되면 "최근 본 상품"에 기록한다. 화면에는 아무것도 그리지 않는다.
export default function RecordRecentProduct({ product }: { product: Omit<RecentProduct, 'viewedAt'> }) {
  useEffect(() => {
    pushRecentProduct(product);
    // 같은 상품 페이지 안에서 다시 기록할 이유는 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);
  return null;
}
