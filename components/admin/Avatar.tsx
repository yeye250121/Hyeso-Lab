// 관리자 프로필 사진. 사진이 없으면 이름 첫 글자를 보여준다.
export default function Avatar({
  name,
  url,
  size = 36,
}: {
  name: string
  url?: string | null
  size?: number
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) }
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={style} className="rounded-full object-cover shrink-0 bg-bg-primary" />
  }
  return (
    <span
      style={style}
      className="rounded-full shrink-0 flex items-center justify-center bg-bg-primary border border-border text-action-primary font-semibold"
      aria-hidden
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}
