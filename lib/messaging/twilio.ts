import twilio from 'twilio'

let envClient: ReturnType<typeof twilio> | null = null

export function createTwilioClient(accountSid: string, authToken: string) {
  return twilio(accountSid, authToken)
}

/** Tek kiracılı / geliştirme: TWILIO_* ortam değişkenleri */
export function getTwilioFromEnv() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token || sid === 'placeholder' || token === 'placeholder') {
    throw new Error('Twilio ortam değişkenleri tanımlı değil.')
  }
  if (!envClient) {
    envClient = twilio(sid, token)
  }
  return envClient
}

/** @deprecated Bunun yerine ofis kimlik bilgisi veya getTwilioFromEnv kullan */
export function getTwilio() {
  return getTwilioFromEnv()
}

/** Basit E.164 (+90…) normalize — Twilio WhatsApp için */
export function normalizePhoneE164(phone: string): string {
  const t = phone.trim()
  if (t.startsWith('+')) return t
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length >= 12) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('5')) return `+90${digits}`
  if (digits.length >= 10) return `+${digits}`
  return t
}
