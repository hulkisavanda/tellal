import { type NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { verifyMetaSignature256 } from '@/lib/security/meta-signature'
import { insertLeadWithServiceRole } from '@/lib/leads/ingest-shared'
import { extractMetaLeadgenMeta } from '@/lib/meta/parse-webhook'
import { fetchLeadgenFields, mapLeadgenFieldsToLead } from '@/lib/meta/fetch-leadgen'
import { normalizePhoneE164 } from '@/lib/messaging/twilio'
import { webhookPlaceholderAck } from '@/lib/api/placeholder-response'
import { getMetaIntegration, metaHubVerifyMatches } from '@/lib/integrations/meta-office'

/**
 * Meta Lead Ads webhook.
 * GET: hub.verify_token — ofis başına Ayarlar’da kayıtlı verify_token veya META_VERIFY_TOKEN (env).
 * POST: imza — önce ofis (page_id → meta_account_id) app secret, yoksa META_APP_SECRET.
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && challenge) {
    if (!token) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const supabase = createServiceRoleClient()
    const { data: offices } = await supabase.from('offices').select('settings')
    for (const row of offices ?? []) {
      const settings =
        typeof row.settings === 'object' && row.settings !== null
          ? (row.settings as Record<string, unknown>)
          : {}
      if (metaHubVerifyMatches(settings, token)) {
        return new NextResponse(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        })
      }
    }

    const envVerify = process.env.META_VERIFY_TOKEN
    if (envVerify && token === envVerify) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    return new NextResponse('Forbidden', { status: 403 })
  }

  return webhookPlaceholderAck('webhooks.meta-leads')
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('x-hub-signature-256')

  let payload: unknown
  try {
    payload = JSON.parse(rawBody) as unknown
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON.' }, { status: 400 })
  }

  const { leadgenId, pageId } = extractMetaLeadgenMeta(payload)
  const supabase = createServiceRoleClient()

  let officeRow: { id: string; settings: Record<string, unknown> } | null = null
  let officeMeta: ReturnType<typeof getMetaIntegration> = null

  if (pageId) {
    const { data: o } = await supabase
      .from('offices')
      .select('id, settings')
      .eq('meta_account_id', pageId)
      .maybeSingle()
    if (o) {
      const st =
        typeof o.settings === 'object' && o.settings !== null
          ? (o.settings as Record<string, unknown>)
          : {}
      officeRow = { id: o.id, settings: st }
      officeMeta = getMetaIntegration(st)
    }
  }

  const appSecret =
    officeMeta && officeMeta.active && officeMeta.app_secret
      ? officeMeta.app_secret
      : process.env.META_APP_SECRET || null

  if (!appSecret || appSecret === 'placeholder') {
    return NextResponse.json(
      { error: 'Meta app secret yok (Ayarlar veya META_APP_SECRET).' },
      { status: 503 }
    )
  }

  if (!verifyMetaSignature256(appSecret, rawBody, sig)) {
    return NextResponse.json({ error: 'Geçersiz imza.' }, { status: 403 })
  }

  if (!leadgenId || !pageId) {
    return NextResponse.json({ ok: true, note: 'leadgen yok; yoklama kabul edildi.' })
  }

  if (!officeRow) {
    console.warn('meta-leads: meta_account_id eşleşen ofis yok', pageId)
    return NextResponse.json({ ok: true, note: 'ofis eşleşmedi (offices.meta_account_id).' })
  }

  const pageToken =
    officeMeta && officeMeta.active && officeMeta.page_access_token
      ? officeMeta.page_access_token
      : process.env.META_PAGE_ACCESS_TOKEN || null

  if (!pageToken || pageToken === 'placeholder') {
    console.warn('meta-leads: page access token yok', leadgenId)
    return NextResponse.json({ ok: true, note: 'Page access token eklenene kadar lead alınamaz.' })
  }

  const graphVersion = officeMeta && officeMeta.active ? officeMeta.graph_api_version : null

  const fields = await fetchLeadgenFields(leadgenId, pageToken, graphVersion)
  const mapped = mapLeadgenFieldsToLead(fields)
  if (!mapped.phone.trim()) {
    return NextResponse.json({ ok: true, note: 'formda telefon alanı yok veya boş.' })
  }

  const phone = normalizePhoneE164(mapped.phone)
  const result = await insertLeadWithServiceRole(supabase, {
    office_id: officeRow.id,
    name: mapped.name,
    phone,
    source: 'meta_ads',
    interest: mapped.interest || '—',
    budget: mapped.budget || '—',
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
