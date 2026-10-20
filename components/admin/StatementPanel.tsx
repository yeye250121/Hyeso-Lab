'use client'

import { useState } from 'react'
import { Check, Copy, FileOutput, Send } from 'lucide-react'
import api from '@/lib/admin/api'
import { formatDateTime } from '@/components/admin/labels'

// 명세서 만들기 → 복사 → 전달 완료 표시. 상담 신청·신청서 상세에서 같이 쓴다.
// 지금은 카카오톡으로 사람이 붙여넣어 보내는 방식이고, 알림톡 심사가 끝나면
// "전달 완료" 자리에 자동 발송이 들어간다.
export default function StatementPanel({
  endpoint,
  sentAt: initialSentAt,
  onSent,
  giftAmount: initialGift = null,
}: {
  /** 예: /admin/applications/<id>/statement */
  endpoint: string
  sentAt: string | null
  onSent?: (res: { sentAt: string; status?: string }) => void
  /** 이미 저장된 사은품 안내 금액(원) */
  giftAmount?: number | null
}) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sentAt, setSentAt] = useState(initialSentAt)
  const [marking, setMarking] = useState(false)
  const [gift, setGift] = useState(initialGift != null ? String(initialGift) : '')
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)

  // 담당자에게 알림톡으로 보낸다: 사은품 저장 → 보안 링크 생성 → 발송 → 전달 시각 기록
  const sendToVendor = async () => {
    setSending(true)
    setSendMsg(null)
    try {
      const giftAmount = gift.trim() === '' ? null : Number(gift.replace(/[^\d]/g, ''))
      const res = await api.post(endpoint, { giftAmount, send: true })
      setSentAt(res.data.sentAt)
      onSent?.(res.data)
      const a = res.data.alimtalk as { success: boolean; skipped?: boolean; error?: string } | undefined
      setSendMsg(a?.success ? '담당자에게 알림톡을 보냈어요.' : a?.skipped ? `링크는 만들었지만 알림톡은 건너뛰었어요 (${a.error})` : `알림톡 실패: ${a?.error ?? '원인 미확인'}`)
      // 사은품이 본문에 반영되도록 다시 만든다
      if (text !== null) await build()
    } catch (e) {
      setSendMsg(e instanceof Error ? e.message : '전송 실패')
    } finally {
      setSending(false)
    }
  }

  const build = async () => {
    setLoading(true)
    try {
      const res = await api.get(endpoint)
      setText(res.data.text)
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const markSent = async () => {
    setMarking(true)
    try {
      const res = await api.post(endpoint, { send: false })
      setSentAt(res.data.sentAt)
      onSent?.(res.data)
    } finally {
      setMarking(false)
    }
  }

  return (
    <section data-testid="statement-panel">
      <div className="flex items-center justify-between mb-2">
        <p className="text-small font-semibold text-text-primary">명세서</p>
        {sentAt && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3.5 h-3.5" /> {formatDateTime(sentAt)} 전달
          </span>
        )}
      </div>

      {text === null ? (
        <button onClick={build} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-50">
          <FileOutput className="w-4 h-4" />
          {loading ? '만드는 중…' : '명세서 만들기'}
        </button>
      ) : (
        <>
          <textarea readOnly value={text} rows={14} className="w-full px-3 py-2 rounded-button bg-bg-primary border border-border text-xs leading-relaxed text-text-primary font-mono resize-y" />
          <div className="mt-2 flex gap-2">
            <button onClick={copy} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-button bg-action-primary text-white text-small font-medium">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '복사됨' : '복사하기'}
            </button>
            <button onClick={markSent} disabled={marking} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-button border border-border text-small font-medium text-text-primary disabled:opacity-50">
              <Send className="w-4 h-4" />
              {sentAt ? '다시 전달로 표시' : '전달 완료로 표시'}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">계좌번호·생년월일이 포함됩니다. 담당자에게만 전달하세요.</p>

          <div className="mt-4 rounded-button border border-border p-3 space-y-2">
            <p className="text-small font-semibold text-text-primary">담당자에게 알림톡으로 보내기</p>
            <div className="flex items-center gap-2">
              <input
                value={gift}
                onChange={(e) => setGift(e.target.value.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                placeholder="사은품 안내 금액 (원)"
                className="flex-1 px-3 py-2 rounded-button bg-bg-primary border border-border text-small text-text-primary"
              />
              <button onClick={sendToVendor} disabled={sending} className="px-4 py-2 rounded-button bg-action-primary text-white text-small font-medium disabled:opacity-50 whitespace-nowrap">
                {sending ? '보내는 중…' : sentAt ? '다시 보내기' : '보내기'}
              </button>
            </div>
            <p className="text-xs text-text-secondary">요약(접수번호·고객·상품·렌탈 이용·사은품)과 120시간 뒤 만료되는 전체 명세서 링크가 담당자 번호로 갑니다. 금액을 비우면 ‘협의 후 안내’로 나갑니다.</p>
            {sendMsg && <p className="text-xs text-text-primary">{sendMsg}</p>}
          </div>
        </>
      )}
    </section>
  )
}
