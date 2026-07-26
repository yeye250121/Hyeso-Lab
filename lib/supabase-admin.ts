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
    })
  }

  return adminClient
}
