'use client'

// 상태 배지 모양의 셀렉트. 표 셀과 모바일 카드에서 같이 쓴다.
export default function StatusSelect({
  value,
  options,
  onChange,
  testId,
}: {
  value: string
  options: Record<string, { label: string; cls: string }>
  onChange: (next: string) => void
  testId?: string
}) {
  const st = options[value] ?? Object.values(options)[0]
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      data-testid={testId}
      className={`h-7 pl-2.5 pr-6 rounded-full text-[12px] font-medium border-0 cursor-pointer appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%238b95a1' stroke-width='1.5'/></svg>")] bg-no-repeat bg-[right_8px_center] ${st.cls}`}
    >
      {Object.entries(options).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  )
}
