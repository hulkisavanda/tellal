'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ReportsDemoActions() {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function seedAnalytics() {
    setBusy('seed')
    setMsg(null)
    try {
      const r = await fetch('/api/reports/seed-demo', { method: 'POST', credentials: 'same-origin' })
      const j = await r.json()
      if (!r.ok) {
        setMsg(j.error ?? 'Başarısız')
        return
      }
      setMsg(`${j.days ?? 0} gün örnek analytics yazıldı.`)
      router.refresh()
    } catch {
      setMsg('Ağ hatası')
    } finally {
      setBusy(null)
    }
  }

  async function rollupToday() {
    setBusy('rollup')
    setMsg(null)
    try {
      const r = await fetch('/api/reports/generate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upsertToday: true }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMsg(j.error ?? 'Başarısız')
        return
      }
      setMsg('Bugünün analytics satırı güncellendi.')
      router.refresh()
    } catch {
      setMsg('Ağ hatası')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={seedAnalytics}
          disabled={busy !== null}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'seed' ? '…' : '14 gün örnek veri (test)'}
        </button>
        <button
          type="button"
          onClick={rollupToday}
          disabled={busy !== null}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {busy === 'rollup' ? '…' : 'Bugünü leadlerden güncelle'}
        </button>
      </div>
      {msg ? <p className="text-sm text-gray-600">{msg}</p> : null}
    </div>
  )
}
