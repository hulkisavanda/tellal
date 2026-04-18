import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runLeadAutomationAfterInsert } from '@/lib/leads/automation'
import type { LeadSource } from '@/types'

const SOURCES: LeadSource[] = ['meta_ads', 'google_ads', 'web_form', 'referral', 'manual']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const interest = typeof body.interest === 'string' ? body.interest.trim() : ''
    const budget = typeof body.budget === 'string' ? body.budget.trim() : ''
    const source = (typeof body.source === 'string' ? body.source : 'manual') as LeadSource

    if (!name || !phone || !interest || !budget) {
      return NextResponse.json(
        { error: 'Ad, telefon, ilgi ve bütçe alanları zorunlu.' },
        { status: 400 }
      )
    }

    if (!SOURCES.includes(source)) {
      return NextResponse.json({ error: 'Geçersiz kaynak.' }, { status: 400 })
    }

    const { data: officeRows } = await supabase
      .from('offices')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const office = officeRows?.[0]
    if (!office) {
      return NextResponse.json({ error: 'Önce ofis kurulumunu tamamla.' }, { status: 400 })
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        office_id: office.id,
        name,
        phone,
        interest,
        budget,
        source,
        status: 'new',
      })
      .select('id')
      .single()

    if (error) {
      console.error('lead insert:', error.message)
      return NextResponse.json({ error: 'Lead kaydedilemedi.' }, { status: 500 })
    }

    try {
      await runLeadAutomationAfterInsert(supabase, office.id, lead.id)
    } catch (e) {
      console.error('runLeadAutomationAfterInsert:', e)
    }

    return NextResponse.json({ id: lead.id })
  } catch (e) {
    console.error('POST /api/leads:', e)
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}
