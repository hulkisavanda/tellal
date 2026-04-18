import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Oturum açmış kullanıcı: lead’e danışman atar (aynı ofis). */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const body = await request.json()
    const leadId = typeof body.leadId === 'string' ? body.leadId : ''
    const agentId =
      body.agentId === null || body.agentId === ''
        ? null
        : typeof body.agentId === 'string'
          ? body.agentId
          : null

    if (!leadId) {
      return NextResponse.json({ error: 'leadId zorunlu.' }, { status: 400 })
    }

    const { data: officeRows } = await supabase
      .from('offices')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const office = officeRows?.[0]
    if (!office) {
      return NextResponse.json({ error: 'Ofis bulunamadı.' }, { status: 400 })
    }

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, office_id')
      .eq('id', leadId)
      .eq('office_id', office.id)
      .maybeSingle()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead bulunamadı.' }, { status: 404 })
    }

    if (agentId) {
      const { data: agent, error: agentErr } = await supabase
        .from('agents')
        .select('id')
        .eq('id', agentId)
        .eq('office_id', office.id)
        .maybeSingle()

      if (agentErr || !agent) {
        return NextResponse.json({ error: 'Danışman bulunamadı veya bu ofise ait değil.' }, { status: 400 })
      }
    }

    const { error: updErr } = await supabase.from('leads').update({ agent_id: agentId }).eq('id', lead.id)

    if (updErr) {
      console.error('assign lead:', updErr.message)
      return NextResponse.json({ error: 'Atama güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/leads/assign:', e)
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}
