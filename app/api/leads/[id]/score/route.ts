import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreLeadWithClaude } from '@/lib/scoring/score-lead'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const { data: officeRows } = await supabase
      .from('offices')
      .select('id, name, settings')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const office = officeRows?.[0]
    if (!office) {
      return NextResponse.json({ error: 'Ofis bulunamadı.' }, { status: 400 })
    }

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, name, interest, budget, source, office_id')
      .eq('id', id)
      .eq('office_id', office.id)
      .maybeSingle()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead bulunamadı.' }, { status: 404 })
    }

    const settings = office.settings as Record<string, unknown> | null
    const city =
      settings && typeof settings.city === 'string' ? settings.city : null

    const scored = await scoreLeadWithClaude(
      {
        name: lead.name,
        interest: lead.interest,
        budget: lead.budget,
        source: lead.source,
      },
      { officeName: office.name, city }
    )

    const { error: upErr } = await supabase
      .from('leads')
      .update({
        ai_score: scored.score,
        ai_reasoning: scored.reasoning,
        recommended_tone: scored.recommended_tone,
      })
      .eq('id', lead.id)

    if (upErr) {
      console.error('lead score update:', upErr.message)
      return NextResponse.json({ error: 'Skor kaydedilemedi.' }, { status: 500 })
    }

    return NextResponse.json({
      score: scored.score,
      category: scored.category,
      reasoning: scored.reasoning,
      recommended_tone: scored.recommended_tone,
      priority_rank: scored.priority_rank,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
    console.error('POST /api/leads/[id]/score:', e)
    if (msg.includes('ANTHROPIC')) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
