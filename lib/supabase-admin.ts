import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS)
 * Only use in secure server-side code (API routes, server actions)
 * NEVER expose this client to the browser/client-side
 *
 * Use cases:
 * - API routes that need full database access
 * - Server-side operations that require admin privileges
 * - Operations that need to bypass RLS policies
 */
let adminClient: SupabaseClient | null = null

function isMissing(value: string | undefined): boolean {
  return !value || value === 'placeholder' || value.startsWith('your-')
}

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (isMissing(supabaseUrl) || isMissing(serviceRoleKey)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for server-side admin access.'
    )
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Next 는 서버의 fetch(GET) 응답을 기본으로 저장해 두고 다시 쓴다. supabase-js 의 조회도 fetch 라서
      // 그대로 두면 방금 바꾼 값(이름 등)이 다른 요청에서는 예전 값으로 보인다. 관리자용 조회는 항상 새로 받는다.
      // (공개 화면의 캐시는 unstable_cache 로 따로 관리하므로 영향이 없다.)
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    })
  }

  return adminClient
}
