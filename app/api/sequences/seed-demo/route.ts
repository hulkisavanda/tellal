import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEMO_STEPS = [
  {
    step: 1,
    delay_hours: 0,
    channel: 'whatsapp',
    template: 'Merhaba {{name}}, talebiniz için teşekkürler. Size nasıl yardımcı olabiliriz?',
  },
  {
    step: 2,
    delay_hours: 24,
    channel: 'whatsapp',
    template: 'Merhaba {{name}}, dün ilettiğiniz {{interest}} talebini hatırlatmak istedik.',
  },
]

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

  const { data: existing } = await supabase
    .from('sequences')
    .select('id')
    .eq('office_id', office.id)
    .eq('name', 'Demo takip (test)')
    .maybeSingle()

  if (existing?.id) {
    return NextResponse.json({ ok: true, id: existing.id, note: 'Zaten var.' })
  }

  const { data, error } = await supabase
    .from('sequences')
    .insert({
      office_id: office.id,
      name: 'Demo takip (test)',
      steps: DEMO_STEPS,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
