import type { SupabaseClient } from '@supabase/supabase-js'
import {
  twilioDeliverToLeadPhone,
  renderMessageTemplate,
  insertOutboundMessage,
} from '@/lib/messaging/send-to-lead'
import { addHours, parseSequenceSteps, type ParsedSequenceStep } from '@/lib/sequences/steps'

export async function createSequenceEnrollment(
  supabase: SupabaseClient,
  params: {
    office_id: string
    lead_id: string
    sequence_id: string
    steps: ParsedSequenceStep[]
  }
): Promise<{ id: string } | { error: string }> {
  if (params.steps.length === 0) {
    return { error: 'Sekans adımı yok.' }
  }

  const firstDelay = params.steps[0]?.delay_hours ?? 0
  const next_run_at = addHours(new Date(), firstDelay).toISOString()

  const { data: existing } = await supabase
    .from('sequence_enrollments')
    .select('id')
    .eq('lead_id', params.lead_id)
    .eq('sequence_id', params.sequence_id)
    .maybeSingle()

  if (existing?.id) {
    return { id: existing.id }
  }

  const { data, error } = await supabase
    .from('sequence_enrollments')
    .insert({
      office_id: params.office_id,
      lead_id: params.lead_id,
      sequence_id: params.sequence_id,
      step_index: 0,
      next_run_at,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    console.error('createSequenceEnrollment:', error.message)
    return { error: 'Sekans kaydı oluşturulamadı.' }
  }
  return { id: data.id }
}

export async function processEnrollmentOnce(
  supabase: SupabaseClient,
  enrollmentId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: row, error: fetchErr } = await supabase
    .from('sequence_enrollments')
    .select('id, office_id, lead_id, sequence_id, step_index, status')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (fetchErr || !row || row.status !== 'active') {
    return { error: 'Kayıt yok veya aktif değil.' }
  }

  const { data: seq } = await supabase
    .from('sequences')
    .select('id, steps, is_active')
    .eq('id', row.sequence_id)
    .maybeSingle()

  if (!seq?.is_active) {
    await supabase.from('sequence_enrollments').update({ status: 'cancelled' }).eq('id', enrollmentId)
    return { error: 'Sekans pasif.' }
  }

  const steps = parseSequenceSteps(seq.steps)
  const idx = row.step_index
  if (idx < 0 || idx >= steps.length) {
    await supabase.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollmentId)
    return { ok: true }
  }

  const step = steps[idx]!

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, phone, interest, office_id')
    .eq('id', row.lead_id)
    .maybeSingle()

  if (!lead || lead.office_id !== row.office_id) {
    return { error: 'Lead bulunamadı.' }
  }

  const { data: office } = await supabase
    .from('offices')
    .select('settings')
    .eq('id', row.office_id)
    .maybeSingle()

  const settings =
    typeof office?.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}

  const text = renderMessageTemplate(step.template, {
    name: lead.name,
    phone: lead.phone,
    interest: lead.interest ?? '—',
  })

  let twilioOk = true
  if (step.channel === 'email') {
    await insertOutboundMessage(supabase, {
      lead_id: lead.id,
      channel: 'email',
      content: text,
      status: 'sent',
      sequence_step: step.step,
    })
  } else {
    try {
      await twilioDeliverToLeadPhone({
        officeSettings: settings,
        leadPhone: lead.phone,
        channel: step.channel,
        body: text,
      })
      await insertOutboundMessage(supabase, {
        lead_id: lead.id,
        channel: step.channel,
        content: text,
        status: 'sent',
        sequence_step: step.step,
      })
    } catch (e) {
      twilioOk = false
      const msg = e instanceof Error ? e.message : 'Twilio hatası'
      console.error('processEnrollmentOnce twilio:', msg)
      await insertOutboundMessage(supabase, {
        lead_id: lead.id,
        channel: step.channel,
        content: text,
        status: 'failed',
        sequence_step: step.step,
      })
    }
  }

  if (!twilioOk && step.channel !== 'email') {
    const retryAt = addHours(new Date(), 1).toISOString()
    await supabase.from('sequence_enrollments').update({ next_run_at: retryAt }).eq('id', enrollmentId)
    return { ok: true }
  }

  const nextIdx = idx + 1
  if (nextIdx >= steps.length) {
    await supabase
      .from('sequence_enrollments')
      .update({ status: 'completed', step_index: nextIdx })
      .eq('id', enrollmentId)
    return { ok: true }
  }

  const nextDelay = steps[nextIdx]!.delay_hours
  const next_run_at = addHours(new Date(), nextDelay).toISOString()

  await supabase
    .from('sequence_enrollments')
    .update({ step_index: nextIdx, next_run_at })
    .eq('id', enrollmentId)

  return { ok: true }
}

export async function processDueSequenceEnrollments(supabase: SupabaseClient): Promise<{
  processed: number
  errors: string[]
}> {
  const nowIso = new Date().toISOString()
  const { data: due } = await supabase
    .from('sequence_enrollments')
    .select('id')
    .eq('status', 'active')
    .lte('next_run_at', nowIso)
    .limit(50)

  let processed = 0
  const errors: string[] = []
  for (const d of due ?? []) {
    const r = await processEnrollmentOnce(supabase, d.id)
    if ('error' in r) errors.push(`${d.id}: ${r.error}`)
    else processed++
  }
  return { processed, errors }
}
