import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSequenceEnrollment, processEnrollmentOnce } from '@/lib/sequences/enrollment'
import { parseSequenceSteps } from '@/lib/sequences/steps'

/** Lead'i sekansa alır; ilk adım gecikme 0 ise hemen gönderir. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 })

    const body = await request.json()
    const leadId = typeof body.leadId === 'string' ? body.leadId : ''
    const sequenceId = typeof body.sequenceId === 'string' ? body.sequenceId : ''

    if (!leadId || !sequenceId) {
      return NextResponse.json({ error: 'leadId ve sequenceId zorunlu.' }, { status: 400 })
    }

    const { data: officeRows } = await supabase
      .from('offices')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const office = officeRows?.[0]
    if (!office) return NextResponse.json({ error: 'Ofis yok.' }, { status: 400 })

    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .eq('office_id', office.id)
      .maybeSingle()

    if (!lead) return NextResponse.json({ error: 'Lead bulunamadı.' }, { status: 404 })

    const { data: seq } = await supabase
      .from('sequences')
      .select('id, steps, is_active, office_id')
      .eq('id', sequenceId)
      .maybeSingle()

    if (!seq || seq.office_id !== office.id) {
      return NextResponse.json({ error: 'Sekans bulunamadı.' }, { status: 404 })
    }
    if (!seq.is_active) {
      return NextResponse.json({ error: 'Sekans pasif.' }, { status: 400 })
    }

    const steps = parseSequenceSteps(seq.steps)
    if (steps.length === 0) {
      return NextResponse.json({ error: 'Sekansta geçerli adım yok.' }, { status: 400 })
    }

    const created = await createSequenceEnrollment(supabase, {
      office_id: office.id,
      lead_id: leadId,
      sequence_id: sequenceId,
      steps,
    })

    if ('error' in created) {
      return NextResponse.json({ error: created.error }, { status: 400 })
    }

    if (steps[0]?.delay_hours === 0) {
      await processEnrollmentOnce(supabase, created.id)
    }

    return NextResponse.json({ ok: true, enrollmentId: created.id })
  } catch (e) {
    console.error('POST /api/messages/sequence:', e)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
