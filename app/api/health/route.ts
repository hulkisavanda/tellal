import { NextResponse } from 'next/server'

/**
 * Dağıtım sağlığı: gizli değerleri ifşa etmez; sadece tanımlı mı kontrol eder.
 */
export async function GET() {
  const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const appUrl = !!process.env.NEXT_PUBLIC_APP_URL

  const ok = supabaseUrl && supabaseAnon && serviceRole

  return NextResponse.json(
    {
      ok,
      checks: {
        nextPublicSupabaseUrl: supabaseUrl,
        nextPublicSupabaseAnonKey: supabaseAnon,
        supabaseServiceRoleKey: serviceRole,
        nextPublicAppUrl: appUrl,
      },
      note: 'Twilio / Meta / iyzico anahtarları isteğe bağlı; webhook ve ödeme için ayrıca doldur.',
    },
    { status: ok ? 200 : 503 }
  )
}
