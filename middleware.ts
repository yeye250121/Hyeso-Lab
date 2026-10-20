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

type Role = 'owner' | 'admin' | 'marketer'
const CONSOLES = ['owner', 'admin', 'partners']
const MARKETER_PAGES = ['home', 'link', 'leads', 'library', 'images', 'profile', 'chat']
const MARKETER_ONLY_PAGES = ['home']
const OWNER_ONLY_PAGES = ['members']

function consoleForRole(role: Role) {
  return role === 'owner' ? 'owner' : role === 'marketer' ? 'partners' : 'admin'
}
function consoleHome(role: Role) {
  return role === 'marketer' ? '/partners/home' : `/${consoleForRole(role)}/dashboard`
}
function pageAllowed(role: Role, page: string) {
  if (role === 'marketer') return MARKETER_PAGES.includes(page)
  if (MARKETER_ONLY_PAGES.includes(page)) return false
  if (role === 'admin' && OWNER_ONLY_PAGES.includes(page)) return false
  return true
}

/** 서명·만료가 유효하면 역할을 돌려준다. 아니면 null */
async function readAdminToken(token: string): Promise<Role | null> {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

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
      return null
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    )
    if (!ok) return null
    return payload.role === 'owner' || payload.role === 'marketer' ? payload.role : 'admin'
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, first, second] = pathname.split('/')

  // 로그인·초대 가입은 누구나
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register') || pathname.startsWith('/partners/register')) {
    return NextResponse.next()
  }

  // 콘솔(/owner·/admin·/marketer) 보호: 토큰 검증 → 역할에 맞는 콘솔·페이지인지 확인
  if (CONSOLES.includes(first)) {
    const token = request.cookies.get('admin-token')?.value
    const role = token ? await readAdminToken(token) : null
    if (!role) {
      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin-token')
      return response
    }

    const mine = consoleForRole(role)
    const page = second ?? ''
    if (first !== mine) {
      // 남의 콘솔 주소: 같은 페이지가 내 콘솔에도 있으면 거기로, 아니면 첫 화면으로
      const target = page && pageAllowed(role, page) ? `/${mine}${pathname.slice(first.length + 1)}` : consoleHome(role)
      const url = new URL(target, request.url)
      if (page && pageAllowed(role, page)) url.search = request.nextUrl.search
      return NextResponse.redirect(url)
    }
    if (page && !pageAllowed(role, page)) {
      return NextResponse.redirect(new URL(consoleHome(role), request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/owner/:path*', '/admin/:path*', '/partners/:path*'],
}
