// 신청서 상단 진행 표시. 현재 단계는 번호 원, 지난 단계는 핑크 점, 남은 단계는 회색 점.
export default function ProgressDots({ steps, step }: { steps: readonly string[]; step: number }) {
  return (
    <div className="flex items-center gap-2 pt-8 pb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
              i === step
                ? 'w-6 h-6 bg-[var(--action-primary)] text-white'
                : i < step
                  ? 'w-2.5 h-2.5 bg-[var(--action-primary)]'
                  : 'w-2.5 h-2.5 bg-gray-200'
            }`}
          >
            {i === step ? i + 1 : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
