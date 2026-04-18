import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIyzipay, PLANS } from '@/lib/iyzico/client'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { PlanKey } from '@/lib/iyzico/client'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapman gerekiyor.' }, { status: 401 })
    }

    const { officeData, selectedPlan, agentData } = await request.json()
    const plan = PLANS[selectedPlan as PlanKey]

    if (!plan) {
      return NextResponse.json({ error: 'Geçersiz paket.' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Ofisi oluştur
    const { data: office, error: officeError } = await admin
      .from('offices')
      .insert({
        name: officeData.name,
        plan_type: selectedPlan,
        whatsapp_number: officeData.whatsapp_number,
        user_id: user.id,
        settings: { city: officeData.city, phone: officeData.phone },
      })
      .select()
      .single()

    if (officeError) {
      console.error('Office oluşturma hatası:', officeError.message)
      return NextResponse.json({ error: 'Ofis oluşturulamadı.' }, { status: 500 })
    }

    // İlk danışmanı ekle
    if (agentData.name && agentData.phone) {
      const regions = agentData.regions
        ? agentData.regions.split(',').map((r: string) => r.trim()).filter(Boolean)
        : []

      await admin.from('agents').insert({
        office_id: office.id,
        name: agentData.name,
        phone: agentData.phone,
        regions,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const conversationId = `tellal-${office.id}-${Date.now()}`
    const callbackUrl = `${appUrl}/api/webhooks/iyzico?officeId=${office.id}&plan=${selectedPlan}&conversationId=${encodeURIComponent(conversationId)}`

    // iyzico ödeme formu başlat
    const paymentRequest = {
      locale: 'tr',
      conversationId,
      price: plan.price,
      paidPrice: plan.price,
      currency: plan.currency,
      basketId: office.id,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: user.id,
        name: officeData.name || 'Tellal Kullanıcı',
        surname: 'Kullanıcı',
        gsmNumber: officeData.phone || '+905551234567',
        email: user.email!,
        identityNumber: '11111111111', // Sandbox için
        registrationAddress: officeData.city || 'Türkiye',
        ip: '85.34.78.112',
        city: officeData.city || 'İstanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: officeData.name || 'Tellal Kullanıcı',
        city: officeData.city || 'İstanbul',
        country: 'Turkey',
        address: officeData.city || 'Türkiye',
      },
      billingAddress: {
        contactName: officeData.name || 'Tellal Kullanıcı',
        city: officeData.city || 'İstanbul',
        country: 'Turkey',
        address: officeData.city || 'Türkiye',
      },
      basketItems: [
        {
          id: selectedPlan,
          name: plan.name,
          category1: 'Yazılım',
          itemType: 'VIRTUAL',
          price: plan.price,
        },
      ],
    }

    const result = await new Promise<{ status: string; paymentPageUrl?: string; errorMessage?: string }>((resolve) => {
      getIyzipay().checkoutFormInitialize.create(paymentRequest, (err: unknown, result: { status: string; paymentPageUrl?: string; errorMessage?: string }) => {
        if (err) resolve({ status: 'failure', errorMessage: String(err) })
        else resolve(result)
      })
    })

    if (result.status !== 'success' || !result.paymentPageUrl) {
      console.error('iyzico hata:', result.errorMessage)
      return NextResponse.json({ error: 'Ödeme başlatılamadı.' }, { status: 500 })
    }

    return NextResponse.json({ url: result.paymentPageUrl })
  } catch (err) {
    console.error('Onboarding checkout hatası:', err)
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}
