'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

type Seq = { id: string; name: string }

export function AutomationSettingsForm({ sequences }: { sequences: Seq[] }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [sequenceId, setSequenceId] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/settings/automation', { credentials: 'same-origin' })
      const j = (await r.json()) as {
        enabled?: boolean
        on_new_lead_sequence_id?: string
        error?: string
      }
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Yüklenemedi' })
        return
      }
      setEnabled(j.enabled === true)
      setSequenceId(typeof j.on_new_lead_sequence_id === 'string' ? j.on_new_lead_sequence_id : '')
      setMessage(null)
    } catch {
      setMessage({ type: 'err', text: 'Ağ hatası' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const r = await fetch('/api/settings/automation', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          on_new_lead_sequence_id: sequenceId,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Kaydedilemedi' })
        return
      }
      setMessage({ type: 'ok', text: 'Otomasyon ayarları kaydedildi.' })
    } catch {
      setMessage({ type: 'err', text: 'Ağ hatası' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      {loading ? (
        <p className="text-sm text-gray-500">Yükleniyor…</p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            Yeni lead gelince sekansa otomatik kaydet
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sekans
            </label>
            <select
              value={sequenceId}
              onChange={(e) => setSequenceId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">— Seçin —</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving || (enabled && !sequenceId)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </>
      )}
      {message ? (
        <p className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  )
}
