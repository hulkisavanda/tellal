import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
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

  const rows = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    rows.push({
      office_id: office.id,
      date,
      leads_count: 2 + (i % 5),
      contacted_count: 1 + (i % 4),
      response_rate: 10 + ((i * 3) % 40),
      conversion_rate: (i * 2) % 15,
      ad_spend: 50 + i * 10,
      revenue_generated: i * 100,
    })
  }

  const { error } = await supabase.from('analytics').upsert(rows, { onConflict: 'office_id,date' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, days: rows.length })
}
