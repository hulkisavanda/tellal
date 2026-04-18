import { type NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { timingSafeEqualString } from '@/lib/security/timing-safe'
import { insertLeadWithServiceRole, isLeadSource } from '@/lib/leads/ingest-shared'
import { normalizePhoneE164 } from '@/lib/messaging/twilio'
import { webhookPlaceholderAck } from '@/lib/api/placeholder-response'
import { getGoogleIntegration } from '@/lib/integrations/google-office'

/**
 * Google Ads lead / özel entegrasyon.
 * Header: X-Tellal-Google-Secret = ofis ayarındaki webhook_secret (veya geriye dönük GOOGLE_LEADS_WEBHOOK_SECRET).
 */
export async function GET() {
  return webhookPlaceholderAck('webhooks.google-leads')
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON gerekli.' }, { status: 400 })
  }

  const officeId = typeof body.office_id === 'string' ? body.office_id : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : ''
  const interest = typeof body.interest === 'string' ? body.interest.trim() : '—'
  const budget = typeof body.budget === 'string' ? body.budget.trim() : '—'
  const sourceRaw = typeof body.source === 'string' ? body.source : 'google_ads'

  if (!officeId || !name || !phoneRaw) {
    return NextResponse.json({ error: 'office_id, name, phone zorunlu.' }, { status: 400 })
  }

  if (!isLeadSource(sourceRaw)) {
    return NextResponse.json({ error: 'Geçersiz source.' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data: office, error: offErr } = await supabase
    .from('offices')
    .select('id, settings')
    .eq('id', officeId)
    .maybeSingle()

  if (offErr || !office) {
    return NextResponse.json({ error: 'Ofis bulunamadı.' }, { status: 404 })
  }

  const settings =
    typeof office.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}
  const g = getGoogleIntegration(settings)

  const expected =
    g && g.active && g.webhook_secret
      ? g.webhook_secret
      : process.env.GOOGLE_LEADS_WEBHOOK_SECRET || null

  if (!expected || expected === 'placeholder') {
    return NextResponse.json(
      { error: 'Ofis için Google webhook gizli anahtarı yok (Ayarlar) ve GOOGLE_LEADS_WEBHOOK_SECRET tanımlı değil.' },
      { status: 503 }
    )
  }

  const sent =
    request.headers.get('x-tellal-google-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    ''

  if (!timingSafeEqualString(sent, expected)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
  }

  const result = await insertLeadWithServiceRole(supabase, {
    office_id: office.id,
    name,
    phone: normalizePhoneE164(phoneRaw),
    source: sourceRaw,
    interest: interest || '—',
    budget: budget || '—',
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: result.id })
}
