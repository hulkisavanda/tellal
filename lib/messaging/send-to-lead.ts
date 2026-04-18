import type { SupabaseClient } from '@supabase/supabase-js'
import { createTwilioClient, getTwilioFromEnv, normalizePhoneE164 } from '@/lib/messaging/twilio'
import { getTwilioIntegration } from '@/lib/messaging/twilio-office'

export type SendChannel = 'whatsapp' | 'sms'

export function renderMessageTemplate(
  template: string,
  vars: { name: string; phone: string; interest: string }
): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, vars.name)
    .replace(/\{\{\s*phone\s*\}\}/gi, vars.phone)
    .replace(/\{\{\s*interest\s*\}\}/gi, vars.interest)
}

export async function twilioDeliverToLeadPhone(params: {
  officeSettings: Record<string, unknown>
  leadPhone: string
  channel: SendChannel
  body: string
}): Promise<void> {
  const { officeSettings, leadPhone, channel, body } = params

  if (process.env.TWILIO_DRY_RUN === 'true') {
    return
  }

  const officeTwilio = getTwilioIntegration(officeSettings)

  let twilioClient: ReturnType<typeof createTwilioClient>
  if (officeTwilio?.active && officeTwilio.account_sid && officeTwilio.auth_token) {
    twilioClient = createTwilioClient(officeTwilio.account_sid, officeTwilio.auth_token)
  } else {
    twilioClient = getTwilioFromEnv()
  }

  const toE164 = normalizePhoneE164(leadPhone)

  if (channel === 'whatsapp') {
    const from =
      officeTwilio?.active && officeTwilio.whatsapp_from
        ? officeTwilio.whatsapp_from
        : process.env.TWILIO_WHATSAPP_NUMBER
    if (!from || from === 'placeholder') {
      throw new Error('WhatsApp gönderen numara yapılandırılmadı.')
    }
    const fromW = from.startsWith('whatsapp:') ? from : `whatsapp:${from.trim()}`
    const toW = `whatsapp:${toE164}`
    await twilioClient.messages.create({ from: fromW, to: toW, body })
  } else {
    const from =
      officeTwilio?.active && officeTwilio.sms_from
        ? officeTwilio.sms_from
        : process.env.TWILIO_SMS_NUMBER
    if (!from || from === 'placeholder') {
      throw new Error('SMS gönderen numara yapılandırılmadı.')
    }
    await twilioClient.messages.create({ from, to: toE164, body })
  }
}

export async function insertOutboundMessage(
  supabase: SupabaseClient,
  params: {
    lead_id: string
    channel: SendChannel | 'email'
    content: string
    status?: 'sent' | 'delivered' | 'read' | 'failed'
    sequence_step?: number | null
  }
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      lead_id: params.lead_id,
      channel: params.channel,
      content: params.content,
      status: params.status ?? 'sent',
      sequence_step: params.sequence_step ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}
