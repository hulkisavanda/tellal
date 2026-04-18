'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ScoreLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/leads/${leadId}/score`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Puanlama başarısız.')
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
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void run()}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Claude analiz ediyor...' : 'AI ile puanla'}
      </button>
      {error ? <p className="text-xs text-red-600 max-w-xs">{error}</p> : null}
    </div>
  )
}
