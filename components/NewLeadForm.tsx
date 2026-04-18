'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadSource } from '@/types'

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'manual', label: 'Manuel' },
  { value: 'web_form', label: 'Web form' },
  { value: 'referral', label: 'Referans' },
  { value: 'meta_ads', label: 'Meta' },
  { value: 'google_ads', label: 'Google' },
]

export function NewLeadForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('')
  const [budget, setBudget] = useState('')
  const [source, setSource] = useState<LeadSource>('manual')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, phone, interest, budget, source }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız.')
        setLoading(false)
        return
      }
      router.push(`/leads/${data.id}`)
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">İlgi / talep</label>
        <textarea
          required
          rows={3}
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bütçe</label>
        <input
          required
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="örn. 3-4M TL"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as LeadSource)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : 'Lead oluştur'}
        </button>
      </div>
    </form>
  )
}
