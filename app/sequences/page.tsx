import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { SequenceDemoActions } from '@/components/SequenceDemoActions'

export default async function SequencesPage() {
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

  const { data: sequences } = await supabase
    .from('sequences')
    .select('id, name, is_active, steps, created_at')
    .eq('office_id', office.id)
    .order('created_at', { ascending: false })

  const rows = sequences ?? []

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="sequences">
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 mb-6 space-y-2">
        <p>
          <strong>Sekanslar:</strong> Adımlar <code className="text-xs bg-blue-100/80 px-1 rounded">sequence_enrollments</code> ile işlenir; Vercel Cron veya harici scheduler{' '}
          <code className="text-xs bg-blue-100/80 px-1 rounded">GET /api/cron/sequences</code> (
          <code className="text-xs bg-blue-100/80 px-1 rounded">Authorization: Bearer CRON_SECRET</code>
          ) ile periyodik çalıştırılmalıdır.
        </p>
        <p className="text-xs text-blue-900/90">
          Yeni lead otomasyonu için{' '}
          <Link href="/settings" className="underline font-medium">
            Ayarlar → Otomasyon
          </Link>
          .
        </p>
        <SequenceDemoActions />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Takip sekansları</h2>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {rows.length === 0 ? (
          <p className="p-8 text-gray-500 text-sm">
            Henüz sekans yok. <code className="text-xs bg-gray-100 px-1 rounded">sequences</code>{' '}
            tablosuna kayıt eklendiğinde burada listelenir.
          </p>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{s.name}</p>
                <span className="text-xs text-gray-500">{s.is_active ? 'Aktif' : 'Pasif'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono truncate">
                steps: {JSON.stringify(s.steps)}
              </p>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Tek seferlik mesaj: lead detayı veya{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">POST /api/messages/send</code>.
      </p>
    </DashboardShell>
  )
}
