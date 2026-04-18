import { type NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { normalizePhoneE164 } from '@/lib/messaging/twilio'
import { webhookPlaceholderAck } from '@/lib/api/placeholder-response'
import {
  getTwilioIntegration,
  twilioInboundMatchesOffice,
} from '@/lib/messaging/twilio-office'

function getWebhookPublicUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}${request.nextUrl.pathname}`
}

function formDataToParams(form: FormData): Record<string, string> {
  const params: Record<string, string> = {}
  form.forEach((value, key) => {
    if (typeof value === 'string' && params[key] === undefined) {
      params[key] = value
    }
  })
  return params
}

/** Gelen SMS / WhatsApp yanıtları — Twilio imzası + lead eşleştirmesi. */
export async function GET() {
  return webhookPlaceholderAck('webhooks.twilio')
}

export async function POST(request: NextRequest) {
  const ct = request.headers.get('content-type') ?? ''
  if (!ct.includes('application/x-www-form-urlencoded')) {
    return NextResponse.json({ error: 'Beklenen: x-www-form-urlencoded' }, { status: 400 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Geçersiz form.' }, { status: 400 })
  }

  const params = formDataToParams(form)
  const signature = request.headers.get('x-twilio-signature') ?? ''
  const toRaw = params.To ?? ''

  const supabase = createServiceRoleClient()

  const { data: offices } = await supabase.from('offices').select('id, settings, whatsapp_number')

  let authToken: string | null = null
  let officeId: string | null = null

  for (const row of offices ?? []) {
    const settings =
      typeof row.settings === 'object' && row.settings !== null
        ? (row.settings as Record<string, unknown>)
        : {}
    const tw = getTwilioIntegration(settings)
    if (!tw?.active) continue
    if (twilioInboundMatchesOffice(toRaw, row.whatsapp_number, tw)) {
      authToken = tw.auth_token
      officeId = row.id
      break
    }
  }

  if (!authToken || !officeId) {
    const envToken = process.env.TWILIO_AUTH_TOKEN
    const envSid = process.env.TWILIO_ACCOUNT_SID
    if (
      envToken &&
      envSid &&
      envToken !== 'placeholder' &&
      envSid !== 'placeholder'
    ) {
      authToken = envToken
    } else {
      return NextResponse.json(
        { error: 'Twilio gelen numara (To) hiçbir ofisle eşleşmedi ve ortam değişkeni yok.' },
        { status: 503 }
      )
    }
  }

  const skipVerify = process.env.TWILIO_SKIP_SIGNATURE_VERIFY === 'true'
  if (!skipVerify) {
    const url = getWebhookPublicUrl(request)
    const valid = twilio.validateRequest(authToken, signature, url, params)
    if (!valid) {
      return NextResponse.json({ error: 'Geçersiz Twilio imzası.' }, { status: 403 })
    }
  }

  const fromRaw = params.From ?? ''
  const body = params.Body ?? ''
  const channel: 'whatsapp' | 'sms' = fromRaw.toLowerCase().startsWith('whatsapp:') ? 'whatsapp' : 'sms'
  const digitsSource = fromRaw.replace(/^whatsapp:/i, '').trim()
  const e164 = normalizePhoneE164(digitsSource)

  let matchQuery = supabase.from('leads').select('id').eq('phone', e164)
  if (officeId) {
    matchQuery = matchQuery.eq('office_id', officeId)
  }
  const { data: byE164 } = await matchQuery.maybeSingle()

  let byRaw: { id: string } | null = null
  if (!byE164 && officeId) {
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', digitsSource)
      .eq('office_id', officeId)
      .maybeSingle()
    byRaw = data
  }

  const matchId = byE164?.id ?? byRaw?.id
  if (!matchId) {
    console.warn('twilio webhook: eşleşen lead yok', e164, officeId)
    return new NextResponse(null, { status: 200 })
  }

  const { error: insErr } = await supabase.from('messages').insert({
    lead_id: matchId,
    channel,
    content: body,
    status: 'delivered',
  })

  if (insErr) {
    console.error('twilio webhook insert:', insErr.message)
  }

  return new NextResponse(null, { status: 200 })
}
