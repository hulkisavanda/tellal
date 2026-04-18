import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Platform = 'meta' | 'google'

/** Sihirbaz taslağı → campaigns tablosunda draft kayıt (harici API yok). */
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
  const platform = (body.platform === 'google' ? 'google' : 'meta') as Platform
  const daily_budget =
    typeof body.daily_budget === 'number'
      ? body.daily_budget
      : Number(body.daily_budget ?? 0) || 0

  if (!name) return NextResponse.json({ error: 'name zorunlu.' }, { status: 400 })

  const wizardPayload = {
    steps_completed: body.steps_completed ?? ['platform', 'budget', 'creative_stub'],
    notes: typeof body.notes === 'string' ? body.notes : '',
    synthetic: true,
    saved_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      office_id: office.id,
      platform,
      name,
      status: 'draft',
      daily_budget,
      spent: 0,
      leads_count: 0,
      performance: { wizard: wizardPayload },
    })
    .select('id')
    .single()

  if (error) {
    console.error('campaigns wizard:', error.message)
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, status: 'draft' })
}
