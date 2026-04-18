import { NextRequest, NextResponse } from 'next/server'

/**
 * E-posta ile rapor gönderimi. RESEND_API_KEY yoksa 200 + not (test ortamı).
 */
export async function POST(request: NextRequest) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: 'RESEND_API_KEY tanımlı değil; gönderim atlandı (test).',
    })
  }

  const body = await request.json().catch(() => ({}))
  const to = typeof body.to === 'string' ? body.to : ''
  if (!to) {
    return NextResponse.json({ error: 'to (e-posta) zorunlu.' }, { status: 400 })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const subject = typeof body.subject === 'string' ? body.subject : 'Tellal rapor özeti'
    const text = typeof body.text === 'string' ? body.text : 'Özet ektedir.'

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tellal <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Resend hatası'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
