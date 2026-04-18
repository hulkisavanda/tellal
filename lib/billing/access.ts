import type { PlanType } from '@/types'

export type OfficeBillingRow = {
  iyzico_payment_id: string | null
  plan_type: PlanType
  settings: Record<string, unknown> | null
}

export function hasPaidAccess(office: OfficeBillingRow): boolean {
  if (office.iyzico_payment_id && office.iyzico_payment_id.trim()) {
    return true
  }
  const settings = office.settings
  const billing = settings?.billing as Record<string, unknown> | undefined
  if (billing?.waive_payment_check === true) return true
  if (process.env.ALLOW_UNPAID_ACCESS === 'true') return true
  return false
}
