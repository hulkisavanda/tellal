import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { TwilioIntegrationForm } from '@/components/TwilioIntegrationForm'
import { MetaIntegrationForm } from '@/components/MetaIntegrationForm'
import { GoogleIntegrationForm } from '@/components/GoogleIntegrationForm'
import { AutomationSettingsForm } from '@/components/AutomationSettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id, name, plan_type, whatsapp_number, settings')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0] ?? null
  if (!office) redirect('/onboarding')

  const { data: sequenceRows } = await supabase
    .from('sequences')
    .select('id, name')
    .eq('office_id', office.id)
    .order('name', { ascending: true })

  const settings =
    typeof office.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}

  const settingsDisplay = (() => {
    const clone = JSON.parse(JSON.stringify(settings)) as Record<string, unknown>
    const integ = clone.integrations as Record<string, unknown> | undefined
    const tw = integ?.twilio as Record<string, unknown> | undefined
    if (tw && typeof tw.auth_token === 'string' && tw.auth_token) {
      tw.auth_token = '***'
    }
    const meta = integ?.meta as Record<string, unknown> | undefined
    if (meta) {
      for (const k of ['app_secret', 'verify_token', 'page_access_token'] as const) {
        if (typeof meta[k] === 'string' && meta[k]) meta[k] = '***'
      }
    }
    const google = integ?.google as Record<string, unknown> | undefined
    if (google && typeof google.webhook_secret === 'string' && google.webhook_secret) {
      google.webhook_secret = '***'
    }
    return clone
  })()

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="settings">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 mb-6">
        <strong>Not:</strong> Twilio, Meta ve Google alanları ofis kaydına yazılır (RLS ile yalnızca
        hesabın). Üretimde gizli anahtarlar için ortam değişkeni yedekleri hâlâ kullanılabilir.
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ofis</h2>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Ofis adı
          </label>
          <input
            type="text"
            readOnly
            value={office.name}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Plan
          </label>
          <input
            type="text"
            readOnly
            value={office.plan_type}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            WhatsApp (DB)
          </label>
          <input
            type="text"
            readOnly
            value={office.whatsapp_number ?? '—'}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            settings (json özet — gizli alanlar maskelenir)
          </label>
          <textarea
            readOnly
            rows={4}
            value={JSON.stringify(settingsDisplay, null, 2)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700"
          />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-10 mb-3">Twilio</h3>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
        <TwilioIntegrationForm />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-10 mb-3">Meta Lead Ads</h3>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
        <MetaIntegrationForm />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-10 mb-3">Google lead webhook</h3>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
        <GoogleIntegrationForm />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-10 mb-3">Otomasyon (yeni lead → sekans)</h3>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
        <AutomationSettingsForm sequences={sequenceRows ?? []} />
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mt-10 mb-3">Diğer</h3>
      <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
        <li>
          Lead ingest — <code className="text-xs bg-gray-100 px-1 rounded">POST /api/leads/ingest</code> (header{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">X-Tellal-Webhook-Secret</code> ={' '}
          <code className="text-xs bg-gray-100 px-1 rounded">offices.webhook_secret</code>)
        </li>
        <li>
          Sağlık — <code className="text-xs bg-gray-100 px-1 rounded">GET /api/health</code>
        </li>
      </ul>
    </DashboardShell>
  )
}
