import Iyzipay from 'iyzipay'

let iyzipayInstance: InstanceType<typeof Iyzipay> | null = null

/** Build sırasında env boşken SDK doğrulaması patlamasın diye ilk API çağrısında oluşturulur */
export function getIyzipay(): InstanceType<typeof Iyzipay> {
  if (!iyzipayInstance) {
    const apiKey = process.env.IYZICO_API_KEY
    const secretKey = process.env.IYZICO_SECRET_KEY
    if (!apiKey || !secretKey) {
      throw new Error('IYZICO_API_KEY ve IYZICO_SECRET_KEY tanımlı olmalı.')
    }
    iyzipayInstance = new Iyzipay({
      apiKey,
      secretKey,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    })
  }
  return iyzipayInstance
}

export const PLANS = {
  starter: {
    name: 'Tellal Starter',
    price: '9000.00', // ~$300 TL karşılığı — gerçek fiyatı sonra ayarlarsın
    currency: 'TRY',
    features: ['Lead otomasyonu', 'AI lead puanlama', 'WhatsApp & SMS takip', 'Temel raporlama'],
    displayPrice: '₺9.000/ay',
  },
  growth: {
    name: 'Tellal Growth',
    price: '21000.00',
    currency: 'TRY',
    features: ["Starter'ın tüm özellikleri", 'Kampanya kurulum sihirbazı', 'Meta & Google Ads', 'Gelişmiş raporlama'],
    displayPrice: '₺21.000/ay',
  },
  fullstack: {
    name: 'Tellal Full Stack',
    price: '36000.00',
    currency: 'TRY',
    features: ["Growth'ın tüm özellikleri", 'Reklam yönetimi', 'AI kampanya optimizasyonu', 'Aylık otomatik rapor'],
    displayPrice: '₺36.000/ay',
  },
} as const

export type PlanKey = keyof typeof PLANS
