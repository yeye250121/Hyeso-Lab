import { NextRequest, NextResponse } from 'next/server'

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  )
  return bytes.buffer as ArrayBuffer
}

async function hasValidAdminToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const header = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(parts[0]))
    )
    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(parts[1]))
    )

    if (
      header.alg !== 'HS256' ||
      typeof payload.exp !== 'number' ||
      payload.exp * 1000 <= Date.now() ||
      typeof payload.uniqueCode !== 'string' ||
      !payload.uniqueCode.startsWith('S')
    ) {
      return false
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    return crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    )
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 관리자 페이지 보호 (로그인/초대 가입 제외)
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/admin/register')
  ) {
    const token = request.cookies.get('admin-token')?.value

    if (!token || !(await hasValidAdminToken(token))) {
      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin-token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
