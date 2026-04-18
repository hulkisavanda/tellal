import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { ReportsDemoActions } from '@/components/ReportsDemoActions'

export default async function ReportsPage() {
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

  const { data: analytics } = await supabase
    .from('analytics')
    .select('date, leads_count, contacted_count, response_rate, conversion_rate, ad_spend, revenue_generated')
    .eq('office_id', office.id)
    .order('date', { ascending: false })
    .limit(30)

  const rows = analytics ?? []

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="reports">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 mb-6 space-y-3">
        <p>
          <strong>Raporlar:</strong> Özet JSON{' '}
          <code className="text-xs bg-white px-1 rounded border border-gray-200">POST /api/reports/generate</code>
          ; e-posta gönderimi{' '}
          <code className="text-xs bg-white px-1 rounded border border-gray-200">/api/reports/send</code>{' '}
          (Resend yapılandırılmışsa).
        </p>
        <ReportsDemoActions />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Günlük özet</h2>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-gray-500 text-sm">
            <code className="text-xs bg-gray-100 px-1 rounded">analytics</code> tablosunda veri
            yok. ETL veya manuel doldurma sonrası burada görünür.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Temas</th>
                  <th className="px-4 py-3 font-medium">Yanıt %</th>
                  <th className="px-4 py-3 font-medium">Harcama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={String(r.date)} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 text-gray-900">{r.date}</td>
                    <td className="px-4 py-3 text-gray-600">{r.leads_count}</td>
                    <td className="px-4 py-3 text-gray-600">{r.contacted_count}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(r.response_rate)}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(r.ad_spend)}</td>
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
