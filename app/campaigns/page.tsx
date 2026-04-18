import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'

export default async function CampaignsPage() {
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

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, platform, status, daily_budget, spent, leads_count, created_at')
    .eq('office_id', office.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = campaigns ?? []

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="campaigns">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 mb-6">
        <strong>Kampanyalar:</strong> Sihirbaz şu an taslak kaydı oluşturur (sentetik); canlı Meta /
        Google Ads API entegrasyonu ayrıca bağlanır. API:{' '}
        <code className="text-xs bg-white px-1 rounded border border-gray-200">/api/campaigns/*</code>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Kampanyalar</h2>
        <Link
          href="/campaigns/wizard"
          className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-gray-800"
        >
          Yeni taslak (sihirbaz)
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-gray-500 text-sm">
            Henüz kampanya kaydı yok. Dış reklam hesapları bağlandığında burada listelenecek.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Günlük bütçe</th>
                  <th className="px-4 py-3 font-medium">Harcama</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.platform}</td>
                    <td className="px-4 py-3 text-gray-600">{c.status}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(c.daily_budget)}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(c.spent)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.leads_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
