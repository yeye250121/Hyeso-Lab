import { Suspense } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import LibraryShell from '@/components/admin/library/LibraryShell'

export default function LibraryDocPage({ params }: { params: { id: string } }) {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <LibraryShell activeId={params.id} />
      </Suspense>
    </AdminLayout>
  )
}
