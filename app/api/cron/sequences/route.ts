import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { processDueSequenceEnrollments } from '@/lib/sequences/enrollment'

/**
 * Vercel Cron veya harici scheduler: Authorization: Bearer CRON_SECRET
 * veya query ?token=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET tanımlı değil.' }, { status: 503 })
  }

  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : request.nextUrl.searchParams.get('token')
  if (token !== secret) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { processed, errors } = await processDueSequenceEnrollments(supabase)
    return NextResponse.json({ ok: true, processed, errors })
  } catch (e) {
    console.error('cron sequences:', e)
    return NextResponse.json({ error: 'İşlem hatası.' }, { status: 500 })
  }
}
