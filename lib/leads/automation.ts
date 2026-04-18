import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createSequenceEnrollment,
  processEnrollmentOnce,
} from '@/lib/sequences/enrollment'
import { parseSequenceSteps } from '@/lib/sequences/steps'

export async function runLeadAutomationAfterInsert(
  supabase: SupabaseClient,
  office_id: string,
  lead_id: string
): Promise<void> {
  const { data: office } = await supabase
    .from('offices')
    .select('settings')
    .eq('id', office_id)
    .maybeSingle()

  const settings =
    typeof office?.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}

  const automation = settings.automation as Record<string, unknown> | undefined
  if (!automation || automation.enabled !== true) return

  const sequenceId =
    typeof automation.on_new_lead_sequence_id === 'string'
      ? automation.on_new_lead_sequence_id.trim()
      : ''
  if (!sequenceId) return

  const { data: seq } = await supabase
    .from('sequences')
    .select('id, office_id, steps, is_active')
    .eq('id', sequenceId)
    .maybeSingle()

  if (!seq || seq.office_id !== office_id || !seq.is_active) return

  const steps = parseSequenceSteps(seq.steps)
  const created = await createSequenceEnrollment(supabase, {
    office_id,
    lead_id,
    sequence_id: sequenceId,
    steps,
  })

  if ('error' in created) {
    console.warn('runLeadAutomationAfterInsert:', created.error)
    return
  }

  if (steps[0]?.delay_hours === 0) {
    await processEnrollmentOnce(supabase, created.id)
  }
}
