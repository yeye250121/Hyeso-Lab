import AdminLayout from '@/components/admin/AdminLayout'
import LibraryShell from '@/components/admin/library/LibraryShell'

export default function LibraryPage() {
  return (
    <AdminLayout>
      <LibraryShell activeId={null} />
    </AdminLayout>
  )
}
