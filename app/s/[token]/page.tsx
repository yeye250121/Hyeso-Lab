import type { Metadata } from 'next'
import { viewStatementByToken } from '@/lib/admin/statementLinks'
import CopyButton from './CopyButton'

// 담당자 전용 명세서 페이지. 알림톡 버튼(/s/<token>)으로만 들어오고 검색엔진에 노출하지 않는다.
// 토큰이 만료·폐기됐거나 없으면 안내만 보여준다.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '접수 명세서 | 혜택연구소', robots: { index: false, follow: false } }

function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export default async function StatementPage({ params }: { params: { token: string } }) {
  const view = await viewStatementByToken(params.token)

  return (
    <div className="min-h-screen bg-[#f2f4f6]">
      <main className="max-w-[560px] mx-auto px-5 py-8">
        <p className="text-[13px] font-bold text-[var(--action-primary)]">혜택연구소</p>
        {view.status === 'ok' ? (
          <>
            <h1 className="mt-1 text-[22px] font-bold text-[#191f28]">접수 명세서 {view.refNo}</h1>
            <p className="mt-1 text-[13px] text-gray-500">이 링크는 {kst(view.expiresAt)}까지 열람할 수 있어요. 고객 개인정보가 포함되어 있으니 접수 외 용도로 저장하지 말아 주세요.</p>
            <pre className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-white px-5 py-5 text-[14px] leading-relaxed text-[#333d4b] font-sans shadow-[0_4px_16px_rgba(0,0,0,0.04)]" data-testid="statement-text">
              {view.text}
            </pre>
            <CopyButton text={view.text} />
          </>
        ) : (
          <>
            <h1 className="mt-1 text-[22px] font-bold text-[#191f28]">{view.status === 'expired' ? '링크가 만료됐어요' : '명세서를 찾을 수 없어요'}</h1>
            <p className="mt-2 text-[14px] text-gray-500 leading-relaxed">
              {view.status === 'expired' ? '담당자 전용 링크는 발송 후 일정 시간이 지나면 닫혀요.' : '주소가 잘못됐거나 이미 삭제된 명세서예요.'}
              <br />
              혜택연구소 담당자에게 다시 요청해 주세요. 010-7469-4385
            </p>
          </>
        )}
      </main>
    </div>
  )
}
