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
    .select('id, settings')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const office = officeRows?.[0]
  if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

  const settings =
    typeof office.settings === 'object' && office.settings !== null
      ? (office.settings as Record<string, unknown>)
      : {}
  const a = settings.automation as Record<string, unknown> | undefined

  return NextResponse.json({
    enabled: a?.enabled === true,
    on_new_lead_sequence_id:
      typeof a?.on_new_lead_sequence_id === 'string' ? a.on_new_lead_sequence_id : '',
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
  const enabled = body.enabled === true
  const sequenceId =
    typeof body.on_new_lead_sequence_id === 'string' ? body.on_new_lead_sequence_id.trim() : ''

  if (sequenceId) {
    const { data: seq } = await supabase
      .from('sequences')
      .select('id')
      .eq('id', sequenceId)
      .eq('office_id', office.id)
      .maybeSingle()
    if (!seq) {
      return NextResponse.json({ error: 'Sekans bu ofise ait değil.' }, { status: 400 })
    }
  }

  const prev =
    typeof office.settings === 'object' && office.settings !== null
      ? ({ ...(office.settings as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const nextSettings = {
    ...prev,
    automation: {
      enabled,
      on_new_lead_sequence_id: sequenceId || null,
    },
  }

  const { error } = await supabase
    .from('offices')
    .update({ settings: nextSettings })
    .eq('id', office.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, enabled, on_new_lead_sequence_id: sequenceId })
}
