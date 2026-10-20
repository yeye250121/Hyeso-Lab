'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from './store'
import { consoleForRole, type ConsoleName } from './console'

// 클라이언트 컴포넌트가 현재 콘솔(/owner·/admin·/marketer)에 맞는 링크를 만들 때 쓴다.
// 주소에 콘솔이 없으면(로그인 직후 등) 역할로 정한다.
export function useConsole(): { console: ConsoleName; path: (p: string) => string } {
  const params = useParams<{ console?: string }>()
  const role = useAuthStore((s) => s.admin?.role)
  const fromUrl = params?.console
  const name: ConsoleName =
    fromUrl === 'owner' || fromUrl === 'admin' || fromUrl === 'partners' ? fromUrl : consoleForRole(role ?? 'admin')
  return { console: name, path: (p: string) => `/${name}${p.startsWith('/') ? p : `/${p}`}` }
}
