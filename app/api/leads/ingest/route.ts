import { type NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { timingSafeEqualString } from '@/lib/security/timing-safe'
import { insertLeadWithServiceRole, isLeadSource } from '@/lib/leads/ingest-shared'
import { normalizePhoneE164 } from '@/lib/messaging/twilio'

/**
 * Dış sistemlerden lead (form, Zapier, kendi backend’in).
 * Kimlik: `X-Tellal-Webhook-Secret` = `offices.webhook_secret` (Supabase’teki değer).
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'JSON gövdesi gerekli.' }, { status: 400 })
    }

    const headerSecret =
      request.headers.get('x-tellal-webhook-secret') ??
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      ''

    const officeId = typeof body.office_id === 'string' ? body.office_id : ''
    if (!officeId || !headerSecret) {
      return NextResponse.json(
        { error: 'office_id ve X-Tellal-Webhook-Secret (veya Bearer) zorunlu.' },
        { status: 401 }
      )
    }

    const supabase = createServiceRoleClient()
    const { data: office, error: officeErr } = await supabase
      .from('offices')
      .select('id, webhook_secret')
      .eq('id', officeId)
      .maybeSingle()

    if (officeErr || !office) {
      return NextResponse.json({ error: 'Ofis bulunamadı.' }, { status: 404 })
    }

    if (!timingSafeEqualString(headerSecret, office.webhook_secret)) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : ''
    const interest = typeof body.interest === 'string' ? body.interest.trim() : '—'
    const budget = typeof body.budget === 'string' ? body.budget.trim() : '—'
    const sourceRaw = typeof body.source === 'string' ? body.source : 'web_form'

    if (!name || !phoneRaw) {
      return NextResponse.json({ error: 'name ve phone zorunlu.' }, { status: 400 })
    }

    if (!isLeadSource(sourceRaw)) {
      return NextResponse.json({ error: 'Geçersiz source.' }, { status: 400 })
    }

    const phone = normalizePhoneE164(phoneRaw)

    const result = await insertLeadWithServiceRole(supabase, {
      office_id: office.id,
      name,
      phone,
      source: sourceRaw,
      interest: interest || '—',
      budget: budget || '—',
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
    console.error('POST /api/leads/ingest:', e)
    if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ error: 'Sunucu yapılandırması eksik (service role).' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    method: 'POST',
    auth: 'Header X-Tellal-Webhook-Secret veya Authorization: Bearer <offices.webhook_secret>',
  })
}
