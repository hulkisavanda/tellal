import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from '@/lib/leads-ui'

type Search = { status?: string; source?: string }

export default async function LeadsPage({ searchParams }: { searchParams: Search }) {
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

  let leadsQuery = supabase
    .from('leads')
    .select('id, name, phone, status, source, interest, budget, ai_score, created_at')
    .eq('office_id', office.id)

  if (searchParams.status) {
    leadsQuery = leadsQuery.eq('status', searchParams.status)
  }
  if (searchParams.source) {
    leadsQuery = leadsQuery.eq('source', searchParams.source)
  }

  const { data: leads } = await leadsQuery.order('created_at', { ascending: false }).limit(200)

  const rows = leads ?? []

  const statusKeys = Object.keys(LEAD_STATUS_LABEL)
  const sourceKeys = Object.keys(LEAD_SOURCE_LABEL)

  function filterHref(patch: Partial<{ status: string; source: string }>) {
    const statusVal = patch.status !== undefined ? patch.status : searchParams.status
    const sourceVal = patch.source !== undefined ? patch.source : searchParams.source
    const p = new URLSearchParams()
    if (statusVal) p.set('status', statusVal)
    if (sourceVal) p.set('source', sourceVal)
    const q = p.toString()
    return q ? `/leads?${q}` : '/leads'
  }

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="leads">
        <div className="mb-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Durum</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref({ status: '' })}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                !searchParams.status
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              Tümü
            </Link>
            {statusKeys.map((k) => (
              <Link
                key={k}
                href={filterHref({ status: k })}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  searchParams.status === k
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {LEAD_STATUS_LABEL[k] ?? k}
              </Link>
            ))}
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kaynak</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref({ source: '' })}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                !searchParams.source
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              Tümü
            </Link>
            {sourceKeys.map((k) => (
              <Link
                key={k}
                href={filterHref({ source: k })}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${
                  searchParams.source === k
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {LEAD_SOURCE_LABEL[k] ?? k}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Lead listesi</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{rows.length} kayıt</span>
              <Link
                href="/leads/new"
                className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-gray-800"
              >
                + Yeni lead
              </Link>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="p-8 text-gray-500 text-sm">Henüz lead yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ad</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Durum</th>
                    <th className="px-4 py-3 font-medium">Kaynak</th>
                    <th className="px-4 py-3 font-medium">İlgi</th>
                    <th className="px-4 py-3 font-medium">AI skor</th>
                    <th className="px-4 py-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        <Link href={`/leads/${lead.id}`} className="hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {LEAD_SOURCE_LABEL[lead.source] ?? lead.source}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={lead.interest}>
                        {lead.interest}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {lead.ai_score != null ? lead.ai_score : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleString('tr-TR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Veriler Supabase üzerinden, RLS ile yalnızca kendi ofisine ait leadler.
        </p>
    </DashboardShell>
  )
}
