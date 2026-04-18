import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Sentetik optimizasyon önerileri (Claude/API yok); performance jsonb güncellenir. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

  const body = await request.json()
  const campaignId = typeof body.campaignId === 'string' ? body.campaignId : ''

  const { data: officeRows } = await supabase
    .from('offices')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0]
  if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId zorunlu.' }, { status: 400 })
  }

  const { data: camp } = await supabase
    .from('campaigns')
    .select('id, performance, daily_budget')
    .eq('id', campaignId)
    .eq('office_id', office.id)
    .maybeSingle()

  if (!camp) return NextResponse.json({ error: 'Kampanya yok.' }, { status: 404 })

  const prev =
    typeof camp.performance === 'object' && camp.performance !== null
      ? (camp.performance as Record<string, unknown>)
      : {}

  const suggestions = [
    'Bütçeyi hafta içi %10 artırmayı dene (sentetik öneri).',
    'CTA metninde bölge adını vurgula.',
    'Düşük performanslı kreatifi 48 saat içinde yenile.',
  ]

  const nextPerformance = {
    ...prev,
    last_optimization_at: new Date().toISOString(),
    synthetic: true,
    suggestions,
    suggested_daily_budget_delta: Math.round(Number(camp.daily_budget) * 0.1),
  }

  const { error } = await supabase
    .from('campaigns')
    .update({ performance: nextPerformance })
    .eq('id', campaignId)
    .eq('office_id', office.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, suggestions })
}
