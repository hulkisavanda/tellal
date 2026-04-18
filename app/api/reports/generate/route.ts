import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Lead/mesaj özetini üretir; isteğe bağlı analytics satırını günceller (sentetik rollup). */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0]
  if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const upsertAnalytics = body.upsertToday === true

  const { data: leads } = await supabase
    .from('leads')
    .select('id, status, source, created_at')
    .eq('office_id', office.id)

  const leadIds = (leads ?? []).map((l) => l.id)
  const { data: messages } =
    leadIds.length > 0
      ? await supabase.from('messages').select('id, status, lead_id').in('lead_id', leadIds)
      : { data: [] as { id: string; status: string; lead_id: string }[] }

  const byStatus: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  for (const l of leads ?? []) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
    bySource[l.source] = (bySource[l.source] ?? 0) + 1
  }

  const msgTotal = messages?.length ?? 0
  const msgFailed = messages?.filter((m) => m.status === 'failed').length ?? 0

  const summary = {
    lead_total: leads?.length ?? 0,
    by_status: byStatus,
    by_source: bySource,
    outbound_messages: msgTotal,
    outbound_failed: msgFailed,
    generated_at: new Date().toISOString(),
    synthetic: false,
  }

  const leadList = leads ?? []
  if (upsertAnalytics && leadList.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const contacted = leadList.filter((l) => l.status !== 'new').length
    const responseApprox =
      msgTotal > 0 ? Math.min(100, Math.round(((msgTotal - msgFailed) / msgTotal) * 100)) : 0
    const closed = byStatus['closed'] ?? 0

    await supabase.from('analytics').upsert(
      {
        office_id: office.id,
        date: today,
        leads_count: leadList.length,
        contacted_count: contacted,
        response_rate: responseApprox,
        conversion_rate: closed ? Math.round((closed / leadList.length) * 100) : 0,
        ad_spend: 0,
        revenue_generated: 0,
      },
      { onConflict: 'office_id,date' }
    )
  }

  return NextResponse.json({ ok: true, summary })
}
