'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SequenceDemoActions() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function seedDemo() {
    setBusy(true)
    setNote(null)
    try {
      const r = await fetch('/api/sequences/seed-demo', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const j = await r.json()
      if (!r.ok) {
        setNote(j.error ?? 'İstek başarısız')
        return
      }
      setNote(j.note === 'Zaten var.' ? 'Demo sekans zaten mevcut.' : 'Demo sekans oluşturuldu.')
      router.refresh()
    } catch {
      setNote('Ağ hatası')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={seedDemo}
        disabled={busy}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? 'İşleniyor…' : 'Demo sekansı ekle (test)'}
      </button>
      {note ? <span className="text-sm text-gray-600">{note}</span> : null}
    </div>
  )
}
