import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { CampaignWizardForm } from '@/components/CampaignWizardForm'

export default async function CampaignWizardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: officeRows } = await supabase
    .from('offices')
    .select('name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0] ?? null
  if (!office) redirect('/onboarding')

  return (
    <DashboardShell userEmail={user.email ?? ''} officeName={office.name} current="campaigns">
      <Link href="/campaigns" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
        ← Kampanya listesi
      </Link>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 mb-6">
        Bu sihirbaz <strong>taslak</strong> kampanya satırı yazar; gerçek reklam hesabı API çağrıları
        sonraki adımda eklenecek.
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <CampaignWizardForm />
      </div>
    </DashboardShell>
  )
}
