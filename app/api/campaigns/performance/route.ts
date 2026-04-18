import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Ofisteki kampanyaların özet performansı (harici API yok). */
export async function GET() {
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

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, platform, status, daily_budget, spent, leads_count, performance')
    .eq('office_id', office.id)

  const items = campaigns ?? []
  const totals = items.reduce(
    (acc, c) => {
      acc.spent += Number(c.spent)
      acc.leads += c.leads_count
      acc.budget += Number(c.daily_budget)
      return acc
    },
    { spent: 0, leads: 0, budget: 0 }
  )

  return NextResponse.json({
    ok: true,
    totals,
    count: items.length,
    items,
  })
}
