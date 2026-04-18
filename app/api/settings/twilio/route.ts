import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTwilioIntegration } from '@/lib/messaging/twilio-office'
import { createTwilioClient } from '@/lib/messaging/twilio'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id, settings')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0]
  if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

  const settings =
    typeof office.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}

  const tw = getTwilioIntegration(settings)
  const sid = tw?.account_sid ?? ''
  return NextResponse.json({
    configured: !!tw,
    active: tw?.active ?? false,
    account_sid_last4: sid.length >= 4 ? sid.slice(-4) : '',
    whatsapp_from: tw?.whatsapp_from ?? '',
    sms_from: tw?.sms_from ?? '',
    auth_token_set: !!(tw && tw.auth_token),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id, settings')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0]
  if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

  const body = await request.json()
  const account_sid = typeof body.account_sid === 'string' ? body.account_sid.trim() : ''
  let auth_token = typeof body.auth_token === 'string' ? body.auth_token.trim() : ''
  const whatsapp_from = typeof body.whatsapp_from === 'string' ? body.whatsapp_from.trim() : ''
  const sms_from = typeof body.sms_from === 'string' ? body.sms_from.trim() : ''
  const active = body.active !== false

  const prev =
    typeof office.settings === 'object' && office.settings !== null
      ? ({ ...(office.settings as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const integ = { ...(typeof prev.integrations === 'object' && prev.integrations !== null
    ? (prev.integrations as Record<string, unknown>)
    : {}) } as Record<string, unknown>

  const existingTw = integ.twilio as Record<string, unknown> | undefined
  if (!auth_token && existingTw && typeof existingTw.auth_token === 'string') {
    auth_token = existingTw.auth_token
  }

  if (!account_sid || !auth_token) {
    return NextResponse.json({ error: 'account_sid ve auth_token zorunlu.' }, { status: 400 })
  }

  try {
    const client = createTwilioClient(account_sid, auth_token)
    await client.api.v2010.accounts(account_sid).fetch()
  } catch {
    return NextResponse.json({ error: 'Twilio kimlik bilgileri doğrulanamadı.' }, { status: 400 })
  }

  integ.twilio = {
    active,
    account_sid,
    auth_token,
    whatsapp_from,
    sms_from,
  }

  const nextSettings = { ...prev, integrations: integ }

  const { error } = await supabase
    .from('offices')
    .update({ settings: nextSettings })
    .eq('id', office.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
