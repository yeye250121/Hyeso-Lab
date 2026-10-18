import { randomBytes } from 'crypto'

// 알림톡 링크용 짧은 토큰. 0/O/1/I/l 처럼 헷갈리는 글자는 뺀다(전화로 불러줄 수 있게).
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

export function generateShortToken(length = 8): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export function isShortToken(v: string): boolean {
  return new RegExp(`^[${ALPHABET}]{6,16}$`).test(v)
}
