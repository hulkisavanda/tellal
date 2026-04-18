import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { hasPaidAccess } from '@/lib/billing/access'
import type { PlanType } from '@/types'

const PLAN_LABEL: Record<PlanType, string> = {
  starter: 'Starter',
  growth: 'Growth',
  fullstack: 'Full Stack',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: officeRows, error: officeFetchError } = await supabase
    .from('offices')
    .select('id, name, plan_type, settings, iyzico_payment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0] ?? null

  if (officeFetchError || !office) {
    redirect('/onboarding')
  }

  const officeId = office.id

  const [{ count: leadTotal }, { count: agentTotal }] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('office_id', officeId),
    supabase.from('agents').select('*', { count: 'exact', head: true }).eq('office_id', officeId),
  ])

  const city =
    typeof office.settings === 'object' &&
    office.settings !== null &&
    'city' in office.settings &&
    typeof (office.settings as { city?: unknown }).city === 'string'
      ? (office.settings as { city: string }).city
      : null

  const billingOk = hasPaidAccess({
    iyzico_payment_id: office.iyzico_payment_id,
    plan_type: office.plan_type as PlanType,
    settings:
      typeof office.settings === 'object' && office.settings !== null
        ? (office.settings as Record<string, unknown>)
        : null,
  })

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="dashboard">
        {!billingOk ? (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Ödeme / erişim:</strong> Bu ortamda ücretli erişim kaydı görünmüyor. Geliştirme
            için{' '}
            <code className="text-xs bg-amber-100/80 px-1 rounded">ALLOW_UNPAID_ACCESS=true</code>{' '}
            kullanabilir veya iyzico ödemesi sonrası{' '}
            <code className="text-xs bg-amber-100/80 px-1 rounded">iyzico_payment_id</code> alanını
            doldurabilirsiniz. Ayarlarda faturalama muafiyeti de tanımlanabilir (
            <code className="text-xs bg-amber-100/80 px-1 rounded">settings.billing.waive_payment_check</code>
            ).
          </div>
        ) : null}

        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <p className="text-sm text-gray-600">
            Modüller aşağıda; sekanslar ve raporlar test verisiyle denenebilir, canlı reklam API’leri
            ayrıca bağlanır.
          </p>
          <Link
            href="/leads"
            className="inline-flex justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Lead listesine git →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{office.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Paket: <span className="text-gray-800">{PLAN_LABEL[office.plan_type as PlanType]}</span>
              {city ? (
                <>
                  {' '}
                  · <span className="text-gray-800">{city}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/leads"
              className="rounded-xl bg-gray-50 border border-gray-100 p-4 hover:border-gray-300 transition-colors block"
            >
              <p className="text-sm text-gray-500">Leadler</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{leadTotal ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">Detay için tıkla</p>
            </Link>
            <Link
              href="/agents"
              className="rounded-xl bg-gray-50 border border-gray-100 p-4 hover:border-gray-300 transition-colors block"
            >
              <p className="text-sm text-gray-500">Danışmanlar</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{agentTotal ?? 0}</p>
              <p className="text-xs text-gray-400 mt-2">Listeyi aç →</p>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/campaigns"
              className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              <span className="font-medium text-gray-900">Kampanyalar</span>
              <span className="block text-xs text-gray-500 mt-1">Taslak sihirbaz + liste</span>
            </Link>
            <Link
              href="/sequences"
              className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              <span className="font-medium text-gray-900">Takip sekansları</span>
              <span className="block text-xs text-gray-500 mt-1">Twilio + cron ile adımlar</span>
            </Link>
            <Link
              href="/reports"
              className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              <span className="font-medium text-gray-900">Raporlar</span>
              <span className="block text-xs text-gray-500 mt-1">Analytics özeti ve test verisi</span>
            </Link>
            <Link
              href="/settings"
              className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              <span className="font-medium text-gray-900">Ayarlar</span>
              <span className="block text-xs text-gray-500 mt-1">API anahtarları ve ofis</span>
            </Link>
          </div>
        </div>
    </DashboardShell>
  )
}
