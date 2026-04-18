'use client'

import { useState } from 'react'
import type { PlanKey } from '@/lib/iyzico/client'

const STEPS = ['Ofis Bilgileri', 'Paket Seçimi', 'İlk Danışman', 'Ödeme']

const PLANS = {
  starter: {
    name: 'Starter',
    price: '$300/ay',
    features: ['Lead otomasyonu', 'AI lead puanlama', 'WhatsApp & SMS takip', 'Temel raporlama'],
  },
  growth: {
    name: 'Growth',
    price: '$700/ay',
    features: ["Starter'ın tüm özellikleri", 'Kampanya kurulum sihirbazı', 'Meta & Google Ads', 'Gelişmiş raporlama'],
  },
  fullstack: {
    name: 'Full Stack',
    price: '$1200/ay',
    features: ["Growth'ın tüm özellikleri", 'Reklam yönetimi', 'AI kampanya optimizasyonu', 'Aylık otomatik rapor'],
  },
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [officeData, setOfficeData] = useState({
    name: '',
    city: '',
    phone: '',
    whatsapp_number: '',
  })

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('growth')

  const [agentData, setAgentData] = useState({
    name: '',
    phone: '',
    regions: '',
  })

  async function handleFinish() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officeData, selectedPlan, agentData }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu.')
        setLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar dene.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900">tellal.</h1>
          <p className="text-gray-500 mt-1">Platformu kuruyoruz</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                i < step ? 'bg-gray-900 text-white' :
                i === step ? 'bg-gray-900 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:block ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 h-px w-8 sm:w-16 ${i < step ? 'bg-gray-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* ADIM 1: Ofis Bilgileri */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ofis bilgilerini gir</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ofis Adı</label>
                <input
                  type="text"
                  value={officeData.name}
                  onChange={e => setOfficeData(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Ege Gayrimenkul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                <input
                  type="text"
                  value={officeData.city}
                  onChange={e => setOfficeData(p => ({ ...p, city: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="İzmir"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={officeData.phone}
                  onChange={e => setOfficeData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="+90 555 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Numarası</label>
                <input
                  type="tel"
                  value={officeData.whatsapp_number}
                  onChange={e => setOfficeData(p => ({ ...p, whatsapp_number: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="+90 555 123 45 67"
                />
              </div>
            </div>
          )}

          {/* ADIM 2: Paket Seçimi */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Paketini seç</h2>
              <div className="grid gap-3">
                {(Object.entries(PLANS) as [PlanKey, typeof PLANS.starter][]).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPlan === key ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        <ul className="mt-2 space-y-1">
                          {plan.features.map((f, i) => (
                            <li key={i} className="text-sm text-gray-500 flex items-center gap-1">
                              <span className="text-gray-400">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{plan.price}</p>
                        {selectedPlan === key && (
                          <span className="text-xs text-gray-900 font-medium">Seçildi ✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADIM 3: İlk Danışman */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">İlk danışmanı ekle</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danışman Adı</label>
                <input
                  type="text"
                  value={agentData.name}
                  onChange={e => setAgentData(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Mehmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={agentData.phone}
                  onChange={e => setAgentData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="+90 555 111 11 11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bölgeler <span className="text-gray-400 font-normal">(virgülle ayır)</span>
                </label>
                <input
                  type="text"
                  value={agentData.regions}
                  onChange={e => setAgentData(p => ({ ...p, regions: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Bornova, Karşıyaka, Çiğli"
                />
              </div>
            </div>
          )}

          {/* ADIM 4: Ödeme */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Özet & Ödeme</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ofis</span>
                  <span className="font-medium">{officeData.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Şehir</span>
                  <span className="font-medium">{officeData.city || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paket</span>
                  <span className="font-medium">{PLANS[selectedPlan].name} — {PLANS[selectedPlan].price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Danışman</span>
                  <span className="font-medium">{agentData.name || '—'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                iyzico güvenli ödeme sayfasına yönlendirileceksin. Test kartlarını iyzico sandbox dokümantasyonundan kullan.
              </p>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          )}

          {/* Butonlar */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                ← Geri
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="bg-gray-900 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-800"
              >
                Devam →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="bg-gray-900 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Yönlendiriliyor...' : 'Ödemeye Geç →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
