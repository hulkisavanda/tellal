'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadStatus } from '@/types'

const OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Yeni' },
  { value: 'contacted', label: 'Arandı' },
  { value: 'responded', label: 'Yanıt verdi' },
  { value: 'appointment', label: 'Randevu' },
  { value: 'closed', label: 'Kapandı' },
  { value: 'cold', label: 'Soğuk' },
]

export function LeadStatusForm({
  leadId,
  initialStatus,
}: {
  leadId: string
  initialStatus: LeadStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState<LeadStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (status === initialStatus) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kaydedilemedi.')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={loading || status === initialStatus}
        onClick={() => void save()}
        className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
      >
        {loading ? 'Kaydediliyor...' : 'Durumu kaydet'}
      </button>
      {error ? <p className="text-sm text-red-600 sm:ml-2">{error}</p> : null}
    </div>
  )
}
