import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Manuel / API ile kampanya oluşturma (Meta/Google dış API çağrısı yok). */
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

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const platform = body.platform === 'google' ? 'google' : 'meta'
  const status =
    body.status === 'active' || body.status === 'paused' || body.status === 'ended'
      ? body.status
      : 'draft'
  const daily_budget = Number(body.daily_budget ?? 0) || 0
  const external_id = typeof body.external_id === 'string' ? body.external_id : null

  if (!name) return NextResponse.json({ error: 'name zorunlu.' }, { status: 400 })

  const performance =
    typeof body.performance === 'object' && body.performance !== null
      ? body.performance
      : { synthetic: true, created_via: 'api' }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      office_id: office.id,
      platform,
      external_id,
      name,
      status,
      daily_budget,
      spent: Number(body.spent ?? 0) || 0,
      leads_count: Number(body.leads_count ?? 0) || 0,
      performance,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
