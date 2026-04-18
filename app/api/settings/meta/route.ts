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
    .select('id, meta_account_id, settings')
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
  const meta = integ?.meta as Record<string, unknown> | undefined

  return NextResponse.json({
    meta_account_id: office.meta_account_id ?? '',
    active: meta?.active !== false,
    verify_token_set: typeof meta?.verify_token === 'string' && !!meta.verify_token,
    page_access_token_set: typeof meta?.page_access_token === 'string' && !!meta.page_access_token,
    app_secret_set: typeof meta?.app_secret === 'string' && !!meta.app_secret,
    graph_api_version: typeof meta?.graph_api_version === 'string' ? meta.graph_api_version : '',
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
  const meta_account_id = typeof body.meta_account_id === 'string' ? body.meta_account_id.trim() : ''
  let verify_token = typeof body.verify_token === 'string' ? body.verify_token.trim() : ''
  let page_access_token = typeof body.page_access_token === 'string' ? body.page_access_token.trim() : ''
  let app_secret = typeof body.app_secret === 'string' ? body.app_secret.trim() : ''
  const graph_api_version =
    typeof body.graph_api_version === 'string' ? body.graph_api_version.trim() : ''
  const active = body.active !== false

  const prev =
    typeof office.settings === 'object' && office.settings !== null
      ? ({ ...(office.settings as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const integ = { ...(typeof prev.integrations === 'object' && prev.integrations !== null
    ? (prev.integrations as Record<string, unknown>)
    : {}) } as Record<string, unknown>

  const existingMeta = integ.meta as Record<string, unknown> | undefined
  if (!verify_token && existingMeta && typeof existingMeta.verify_token === 'string') {
    verify_token = existingMeta.verify_token
  }
  if (!page_access_token && existingMeta && typeof existingMeta.page_access_token === 'string') {
    page_access_token = existingMeta.page_access_token
  }
  if (!app_secret && existingMeta && typeof existingMeta.app_secret === 'string') {
    app_secret = existingMeta.app_secret
  }

  integ.meta = {
    active,
    verify_token,
    page_access_token,
    app_secret,
    ...(graph_api_version ? { graph_api_version } : {}),
  }

  const nextSettings = { ...prev, integrations: integ }

  const { error } = await supabase
    .from('offices')
    .update({
      meta_account_id: meta_account_id || null,
      settings: nextSettings,
    })
    .eq('id', office.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
