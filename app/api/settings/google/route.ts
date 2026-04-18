import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const integ = settings.integrations as Record<string, unknown> | undefined
  const google = integ?.google as Record<string, unknown> | undefined

  return NextResponse.json({
    active: google?.active !== false,
    webhook_secret_set: typeof google?.webhook_secret === 'string' && !!google.webhook_secret,
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
  let webhook_secret = typeof body.webhook_secret === 'string' ? body.webhook_secret.trim() : ''
  const active = body.active !== false

  const prev =
    typeof office.settings === 'object' && office.settings !== null
      ? ({ ...(office.settings as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const integ = { ...(typeof prev.integrations === 'object' && prev.integrations !== null
    ? (prev.integrations as Record<string, unknown>)
    : {}) } as Record<string, unknown>

  const existing = integ.google as Record<string, unknown> | undefined
  if (!webhook_secret && existing && typeof existing.webhook_secret === 'string') {
    webhook_secret = existing.webhook_secret
  }

  if (!webhook_secret) {
    return NextResponse.json({ error: 'webhook_secret zorunlu.' }, { status: 400 })
  }

  integ.google = { active, webhook_secret }
  const nextSettings = { ...prev, integrations: integ }

  const { error } = await supabase
    .from('offices')
    .update({ settings: nextSettings })
    .eq('id', office.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
