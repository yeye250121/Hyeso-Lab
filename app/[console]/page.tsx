import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken } from '@/lib/admin/auth'
import { consoleHome } from '@/lib/admin/console'

// /owner, /admin, /marketer 자체에는 화면이 없다. 역할에 맞는 첫 화면으로 보낸다.
export const dynamic = 'force-dynamic'

export default function ConsoleIndex() {
  const token = cookies().get('admin-token')?.value
  const admin = token ? verifyAdminToken(token) : null
  redirect(admin ? consoleHome(admin.role) : '/admin/login')
}
