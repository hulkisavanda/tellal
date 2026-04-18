import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { NewLeadForm } from '@/components/NewLeadForm'

export default async function NewLeadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0] ?? null
  if (!office) redirect('/onboarding')

  return (
    <DashboardShell
      userEmail={user.email ?? ''}
      officeName={office.name}
      current="leads"
      maxWidthClass="max-w-3xl mx-auto"
    >
        <Link href="/leads" className="inline-block text-sm text-gray-600 hover:text-gray-900 mb-6">
          ← Lead listesine dön
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Yeni lead ekle</h1>
          <NewLeadForm />
        </div>
    </DashboardShell>
  )
}
