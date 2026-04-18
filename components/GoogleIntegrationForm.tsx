'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

type GStatus = {
  active: boolean
  webhook_secret_set: boolean
}

export function GoogleIntegrationForm() {
  const [status, setStatus] = useState<GStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [active, setActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/settings/google', { credentials: 'same-origin' })
      const j = (await r.json()) as GStatus & { error?: string }
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Yüklenemedi' })
        return
      }
      setStatus(j)
      setActive(j.active !== false)
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
      const r = await fetch('/api/settings/google', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_secret: webhookSecret,
          active,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Kaydedilemedi' })
        return
      }
      setMessage({ type: 'ok', text: 'Google webhook ayarlari kaydedildi.' })
      setWebhookSecret('')
      await load()
    } catch {
      setMessage({ type: 'err', text: 'Ağ hatası' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Yükleniyor…</p>

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      {status ? (
        <p className="text-xs text-gray-500">
          Webhook secret: {status.webhook_secret_set ? 'kayitli' : 'yok'}
        </p>
      ) : null}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Webhook secret</label>
        <input
          type="password"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="X-Tellal-Google-Secret ile eslesen deger"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Aktif
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
      {message ? (
        <p className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  )
}
