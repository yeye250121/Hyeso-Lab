// 카테고리 서랍/그리드 로딩용 스켈레톤 조각들
export function SkeletonCircle({ className = '' }: { className?: string }) {
  return <span className={`block rounded-full bg-gray-100 animate-pulse ${className}`} />;
}

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <span className={`block rounded-xl bg-gray-100 animate-pulse ${className}`} />;
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <SkeletonBox className="aspect-[5/6] rounded-2xl" />
          <SkeletonBox className="mt-2.5 h-4 w-4/5" />
          <SkeletonBox className="mt-1.5 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
