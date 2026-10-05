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
}: {
  /** 예: /admin/applications/<id>/statement */
  endpoint: string
  sentAt: string | null
  onSent?: (res: { sentAt: string; status?: string }) => void
}) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sentAt, setSentAt] = useState(initialSentAt)
  const [marking, setMarking] = useState(false)

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
      const res = await api.post(endpoint)
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
        </>
      )}
    </section>
  )
}
