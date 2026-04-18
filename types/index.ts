export type PlanType = 'starter' | 'growth' | 'fullstack'
export type LeadStatus = 'new' | 'contacted' | 'responded' | 'appointment' | 'closed' | 'cold'
export type LeadCategory = 'hot' | 'warm' | 'cold'
export type LeadSource = 'meta_ads' | 'google_ads' | 'web_form' | 'referral' | 'manual'
export type MessageChannel = 'whatsapp' | 'sms' | 'email'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'
export type CampaignPlatform = 'meta' | 'google'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type RecommendedTone = 'urgent' | 'informative' | 'casual'

export interface Office {
  id: string
  name: string
  plan_type: PlanType
  meta_account_id: string | null
  google_account_id: string | null
  meta_access_token: string | null
  google_access_token: string | null
  whatsapp_number: string | null
  webhook_secret: string
  iyzico_customer_id: string | null
  iyzico_payment_id: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface Agent {
  id: string
  office_id: string
  name: string
  phone: string
  regions: string[]
  is_available: boolean
  active_lead_count: number
  conversion_rate: number
  created_at: string
}

export interface Lead {
  id: string
  office_id: string
  agent_id: string | null
  name: string
  phone: string
  source: LeadSource
  interest: string
  budget: string
  ai_score: number | null
  ai_reasoning: string | null
  recommended_tone: RecommendedTone | null
  status: LeadStatus
  first_contact_at: string | null
  closed_at: string | null
  sale_value: number | null
  created_at: string
}

export interface Message {
  id: string
  lead_id: string
  channel: MessageChannel
  content: string
  status: MessageStatus
  sequence_step: number | null
  sent_at: string
}

export interface Sequence {
  id: string
  office_id: string
  name: string
  steps: SequenceStep[]
  is_active: boolean
  created_at: string
}

export interface SequenceStep {
  step: number
  delay_hours: number
  channel: MessageChannel
  template: string
}

export interface Campaign {
  id: string
  office_id: string
  platform: CampaignPlatform
  external_id: string | null
  name: string
  status: CampaignStatus
  daily_budget: number
  spent: number
  leads_count: number
  performance: CampaignPerformance
  created_at: string
}

export interface CampaignPerformance {
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  conversions?: number
}

export interface Analytics {
  id: string
  office_id: string
  date: string
  leads_count: number
  contacted_count: number
  response_rate: number
  conversion_rate: number
  ad_spend: number
  revenue_generated: number
}

export interface LeadScore {
  score: number
  category: LeadCategory
  reasoning: string
  recommended_tone: RecommendedTone
  priority_rank: number
}
