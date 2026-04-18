export type TwilioOfficeIntegration = {
  active: boolean
  account_sid: string
  auth_token: string
  whatsapp_from: string
  sms_from: string
}

function readTwilioFromSettings(settings: Record<string, unknown>): TwilioOfficeIntegration | null {
  const integ = settings.integrations as Record<string, unknown> | undefined
  const tw = integ?.twilio as Record<string, unknown> | undefined
  if (!tw) return null
  const account_sid = typeof tw.account_sid === 'string' ? tw.account_sid : ''
  const auth_token = typeof tw.auth_token === 'string' ? tw.auth_token : ''
  const whatsapp_from = typeof tw.whatsapp_from === 'string' ? tw.whatsapp_from : ''
  const sms_from = typeof tw.sms_from === 'string' ? tw.sms_from : ''
  if (!account_sid || !auth_token) return null
  return {
    active: tw.active !== false,
    account_sid,
    auth_token,
    whatsapp_from,
    sms_from,
  }
}

/** Ofis ayarlarından Twilio (varsa). */
export function getTwilioIntegration(
  settings: Record<string, unknown>
): TwilioOfficeIntegration | null {
  const row = readTwilioFromSettings(settings)
  if (!row || !row.active) return null
  return row
}

function stripWhatsAppPrefix(s: string): string {
  return s.replace(/^whatsapp:/i, '').trim()
}

function normPhone(s: string): string {
  return stripWhatsAppPrefix(s).replace(/\s/g, '')
}

/** Gelen To ile ofis hattı / ayarlardaki whatsapp_from eşleşir mi? */
export function twilioInboundMatchesOffice(
  toRaw: string,
  officeWhatsappDb: string | null,
  tw: TwilioOfficeIntegration
): boolean {
  const to = normPhone(toRaw)
  const candidates: string[] = []
  if (tw.whatsapp_from) candidates.push(normPhone(tw.whatsapp_from))
  if (officeWhatsappDb) candidates.push(normPhone(officeWhatsappDb))
  for (const c of candidates) {
    if (c && to === c) return true
  }
  return false
}
