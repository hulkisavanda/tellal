import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twilioDeliverToLeadPhone, insertOutboundMessage } from '@/lib/messaging/send-to-lead'

type Channel = 'whatsapp' | 'sms'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const body = await request.json()
    const leadId = typeof body.leadId === 'string' ? body.leadId : ''
    const channel = body.channel as Channel
    const text = typeof body.content === 'string' ? body.content.trim() : ''

    if (!leadId || !text) {
      return NextResponse.json({ error: 'leadId ve content zorunlu.' }, { status: 400 })
    }

    if (channel !== 'whatsapp' && channel !== 'sms') {
      return NextResponse.json({ error: 'Kanal whatsapp veya sms olmalı.' }, { status: 400 })
    }

    const { data: officeRows } = await supabase
      .from('offices')
      .select('id, settings')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const office = officeRows?.[0]
    if (!office) {
      return NextResponse.json({ error: 'Ofis bulunamadı.' }, { status: 400 })
    }

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('id, phone, office_id')
      .eq('id', leadId)
      .eq('office_id', office.id)
      .maybeSingle()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead bulunamadı.' }, { status: 404 })
    }

    const settings =
      typeof office.settings === 'object' && office.settings !== null
        ? (office.settings as Record<string, unknown>)
        : {}

    await twilioDeliverToLeadPhone({
      officeSettings: settings,
      leadPhone: lead.phone,
      channel,
      body: text,
    })

    const messageId = await insertOutboundMessage(supabase, {
      lead_id: lead.id,
      channel,
      content: text,
      status: 'sent',
    })

    return NextResponse.json({ ok: true, messageId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata'
    console.error('POST /api/messages/send:', e)
    if (msg.includes('Twilio') || msg.includes('twilio') || msg.includes('yapılandırılmadı')) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
