import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getIyzipay } from '@/lib/iyzico/client'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type RetrieveResult = {
  status: string
  paymentStatus?: string
  paymentId?: string
  basketId?: string
  errorMessage?: string
}

function retrieveCheckoutForm(
  conversationId: string,
  token: string
): Promise<RetrieveResult> {
  return new Promise((resolve) => {
    getIyzipay().checkoutForm.retrieve(
      {
        locale: 'tr',
        conversationId,
        token,
      },
      (err: unknown, result: RetrieveResult) => {
        if (err) resolve({ status: 'failure', errorMessage: String(err) })
        else resolve(result)
      }
    )
  })
}

async function getTokenAndConversation(
  request: NextRequest
): Promise<{ token: string | null; conversationId: string | null }> {
  const url = new URL(request.url)
  const qToken = url.searchParams.get('token')
  const qConv = url.searchParams.get('conversationId')

  if (request.method === 'GET') {
    return { token: qToken, conversationId: qConv }
  }

  const contentType = request.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { token?: string; conversationId?: string }
      return {
        token: body.token ?? qToken,
        conversationId: body.conversationId ?? qConv,
      }
    }
    const fd = await request.formData()
    return {
      token: (fd.get('token') as string | null) ?? qToken,
      conversationId: (fd.get('conversationId') as string | null) ?? qConv,
    }
  } catch {
    return { token: qToken, conversationId: qConv }
  }
}

async function handleCallback(request: NextRequest) {
  const url = new URL(request.url)
  const officeId = url.searchParams.get('officeId')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { token, conversationId } = await getTokenAndConversation(request)

  if (!officeId || !token || !conversationId) {
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=missing_params`)
  }

  const result = await retrieveCheckoutForm(conversationId, token)

  if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
    const reason = result.errorMessage || result.paymentStatus || 'failed'
    return NextResponse.redirect(
      `${appUrl}/onboarding?payment=failed&reason=${encodeURIComponent(reason)}`
    )
  }

  if (result.basketId && result.basketId !== officeId) {
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=basket_mismatch`)
  }

  const paymentId = result.paymentId
  if (!paymentId) {
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=no_payment_id`)
  }

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('offices')
    .update({ iyzico_payment_id: paymentId })
    .eq('id', officeId)

  if (error) {
    console.error('iyzico webhook office güncelleme:', error.message)
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=db`)
  }

  return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
}

export async function POST(request: NextRequest) {
  try {
    return await handleCallback(request)
  } catch (e) {
    console.error('iyzico webhook:', e)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=server`)
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handleCallback(request)
  } catch (e) {
    console.error('iyzico webhook GET:', e)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/onboarding?payment=error&reason=server`)
  }
}
