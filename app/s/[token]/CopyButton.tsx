'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }}
      className="mt-4 w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--action-primary)] hover:bg-[var(--action-primary-hover)] text-white text-[15px] font-semibold transition-colors"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? '복사됐어요' : '명세서 복사하기'}
    </button>
  )
}
