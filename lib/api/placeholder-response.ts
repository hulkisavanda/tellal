import { NextResponse } from 'next/server'

/** Dış entegrasyon henüz yokken API uçları için ortak yanıt (501). */
export function placeholderJson(feature: string, details?: string) {
  return NextResponse.json(
    {
      ok: false,
      status: 'placeholder' as const,
      feature,
      message: details ?? 'Bu uç nokta henüz gerçek entegrasyon ile doldurulmadı.',
    },
    { status: 501 }
  )
}

/** Webhook sağlık / doğrulama için 200 + placeholder (dış servis retry döngüsüne girmesin diye). */
export function webhookPlaceholderAck(feature: string) {
  return NextResponse.json({
    ok: true,
    placeholder: true,
    feature,
    message:
      'Placeholder: Meta/Google/Twilio imza doğrulaması ve iş mantığı sonra eklenecek.',
  })
}
