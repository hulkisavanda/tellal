import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/DashboardShell'
import { LeadStatusForm } from '@/components/LeadStatusForm'
import { ScoreLeadButton } from '@/components/ScoreLeadButton'
import { SendMessageForm } from '@/components/SendMessageForm'
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, TONE_LABEL } from '@/lib/leads-ui'
import type { LeadStatus } from '@/types'

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-posta',
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string }
}) {
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

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(
      `
      id,
      name,
      phone,
      source,
      interest,
      budget,
      ai_score,
      ai_reasoning,
      recommended_tone,
      status,
      first_contact_at,
      closed_at,
      sale_value,
      created_at,
      agent_id,
      agents ( id, name, phone )
    `
    )
    .eq('id', params.id)
    .eq('office_id', office.id)
    .maybeSingle()

  if (leadError || !lead) {
    notFound()
  }

  const rawAgent = lead.agents as unknown
  const agent = Array.isArray(rawAgent)
    ? (rawAgent[0] as { id: string; name: string; phone: string } | undefined) ?? null
    : (rawAgent as { id: string; name: string; phone: string } | null)

  const { data: messages } = await supabase
    .from('messages')
    .select('id, channel, content, status, sent_at, sequence_step')
    .eq('lead_id', lead.id)
    .order('sent_at', { ascending: false })
    .limit(50)

  const msgRows = messages ?? []

  return (
    <DashboardShell
      userEmail={user.email ?? ''}
      officeName={office.name}
      current="leads"
      maxWidthClass="max-w-3xl mx-auto"
    >
        <Link
          href="/leads"
          className="inline-block text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Lead listesine dön
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{lead.name}</h1>
              <p className="text-gray-600 mt-1">{lead.phone}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <ScoreLeadButton leadId={lead.id} />
              <LeadStatusForm leadId={lead.id} initialStatus={lead.status as LeadStatus} />
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-6">
            <div>
              <dt className="text-gray-500">Kaynak</dt>
              <dd className="text-gray-900 mt-0.5">
                {LEAD_SOURCE_LABEL[lead.source] ?? lead.source}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Oluşturulma</dt>
              <dd className="text-gray-900 mt-0.5">
                {lead.created_at
                  ? new Date(lead.created_at).toLocaleString('tr-TR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">İlgi</dt>
              <dd className="text-gray-900 mt-0.5">{lead.interest}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Bütçe</dt>
              <dd className="text-gray-900 mt-0.5">{lead.budget}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Durum (özet)</dt>
              <dd className="text-gray-900 mt-0.5">
                {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">AI skor</dt>
              <dd className="text-gray-900 mt-0.5">
                {lead.ai_score != null ? lead.ai_score : '—'}
              </dd>
            </div>
            {lead.ai_reasoning ? (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">AI gerekçe</dt>
                <dd className="text-gray-800 mt-0.5 leading-relaxed">{lead.ai_reasoning}</dd>
              </div>
            ) : null}
            {lead.recommended_tone ? (
              <div>
                <dt className="text-gray-500">Önerilen ton</dt>
                <dd className="text-gray-900 mt-0.5">
                  {TONE_LABEL[lead.recommended_tone] ?? lead.recommended_tone}
                </dd>
              </div>
            ) : null}
            {agent ? (
              <div>
                <dt className="text-gray-500">Danışman</dt>
                <dd className="text-gray-900 mt-0.5">
                  {agent.name} · {agent.phone}
                </dd>
              </div>
            ) : (
              <div>
                <dt className="text-gray-500">Danışman</dt>
                <dd className="text-gray-400 mt-0.5">Atanmadı</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mesaj gönder</h2>
              <p className="text-xs text-gray-500 mt-0.5">Twilio ile (sandbox için alıcı numarasını doğrula)</p>
            </div>
            <SendMessageForm leadId={lead.id} />
          </div>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h3 className="text-sm font-semibold text-gray-900">Geçmiş</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {msgRows.length} kayıt
            </p>
          </div>
          {msgRows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Bu lead için henüz mesaj yok.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {msgRows.map((m) => (
                <li key={m.id} className="px-4 py-3 text-sm">
                  <div className="flex justify-between gap-2 text-xs text-gray-500 mb-1">
                    <span>{CHANNEL_LABEL[m.channel] ?? m.channel}</span>
                    <span>
                      {m.sent_at
                        ? new Date(m.sent_at).toLocaleString('tr-TR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
    </DashboardShell>
  )
}
