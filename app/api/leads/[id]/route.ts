import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadStatus } from '@/types'

const STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'responded',
  'appointment',
  'closed',
  'cold',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const body = await request.json()
    const status = body.status as LeadStatus

    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    }

    const { error } = await supabase.from('leads').update({ status }).eq('id', id)

    if (error) {
      console.error('lead patch:', error.message)
      return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/leads/[id]:', e)
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}
