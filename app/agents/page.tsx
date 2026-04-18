import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'

export default async function AgentsPage() {
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

  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, phone, regions, is_available, active_lead_count, conversion_rate, created_at')
    .eq('office_id', office.id)
    .order('created_at', { ascending: false })

  const rows = agents ?? []

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="agents">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 mb-6">
        <strong>İskelet modu:</strong> Danışman ekleme/düzenleme formu ve atama kuralları (
        <code className="text-xs bg-amber-100/80 px-1 rounded">/api/leads/assign</code>) sonra
        tamamlanacak.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Danışmanlar</h2>
        <span className="text-sm text-gray-500">{rows.length} kayıt</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 space-y-3">
            <p className="text-gray-500 text-sm">Henüz danışman yok.</p>
            <p className="text-sm text-gray-400">
              Seed veya manuel ekleme ile doldurulabilir; CRUD arayüzü sonraki adımda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium">Müsait</th>
                  <th className="px-4 py-3 font-medium">Aktif lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{a.is_available ? 'Evet' : 'Hayır'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.active_lead_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Lead atama:{' '}
        <Link href="/leads" className="text-gray-800 underline hover:no-underline">
          Lead listesi
        </Link>{' '}
        üzerinden manuel akış; otomatik atama API’si placeholder.
      </p>
    </DashboardShell>
  )
}
