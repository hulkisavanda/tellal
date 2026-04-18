import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadSource } from '@/types'
import { runLeadAutomationAfterInsert } from '@/lib/leads/automation'

const SOURCES: LeadSource[] = ['meta_ads', 'google_ads', 'web_form', 'referral', 'manual']

export type IngestLeadInput = {
  office_id: string
  name: string
  phone: string
  source: LeadSource
  interest: string
  budget: string
}

export function isLeadSource(s: string): s is LeadSource {
  return SOURCES.includes(s as LeadSource)
}

export async function insertLeadWithServiceRole(
  supabase: SupabaseClient,
  input: IngestLeadInput
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      office_id: input.office_id,
      name: input.name,
      phone: input.phone,
      source: input.source,
      interest: input.interest,
      budget: input.budget,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) {
    console.error('insertLeadWithServiceRole:', error.message)
    return { error: 'Lead kaydedilemedi.' }
  }

  try {
    await runLeadAutomationAfterInsert(supabase, input.office_id, data.id)
  } catch (e) {
    console.error('runLeadAutomationAfterInsert:', e)
  }

  return { id: data.id }
}
