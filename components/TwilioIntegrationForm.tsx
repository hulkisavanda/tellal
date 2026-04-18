'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

type TwilioStatus = {
  configured: boolean
  active: boolean
  account_sid_last4: string
  whatsapp_from: string
  sms_from: string
  auth_token_set: boolean
}

export function TwilioIntegrationForm() {
  const [status, setStatus] = useState<TwilioStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [whatsappFrom, setWhatsappFrom] = useState('')
  const [smsFrom, setSmsFrom] = useState('')
  const [active, setActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/settings/twilio', { credentials: 'same-origin' })
      const j = (await r.json()) as TwilioStatus & { error?: string }
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Yüklenemedi' })
        setStatus(null)
        return
      }
      setStatus(j)
      if (j.configured) {
        setWhatsappFrom(j.whatsapp_from ?? '')
        setSmsFrom(j.sms_from ?? '')
        setActive(j.active !== false)
      }
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
      const r = await fetch('/api/settings/twilio', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_sid: accountSid,
          auth_token: authToken,
          whatsapp_from: whatsappFrom,
          sms_from: smsFrom,
          active,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Kaydedilemedi' })
        return
      }
      setMessage({ type: 'ok', text: 'Twilio kaydedildi.' })
      setAuthToken('')
      setAccountSid('')
      await load()
    } catch {
      setMessage({ type: 'err', text: 'Ağ hatası' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Yükleniyor…</p>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      {status?.configured ? (
        <p className="text-sm text-gray-600">
          Hesap (son 4): <strong>{status.account_sid_last4}</strong> · Token:{' '}
          {status.auth_token_set ? 'kayitli' : 'yok'}
        </p>
      ) : null}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Account SID</label>
        <input
          value={accountSid}
          onChange={(e) => setAccountSid(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder={status?.configured ? 'Degistirmek icin yeni SID' : ''}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Auth token</label>
        <input
          type="password"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder={status?.auth_token_set ? 'Yenilemek icin yeni token' : 'Zorunlu'}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">WhatsApp from</label>
        <input
          value={whatsappFrom}
          onChange={(e) => setWhatsappFrom(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="whatsapp:+1..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">SMS from</label>
        <input
          value={smsFrom}
          onChange={(e) => setSmsFrom(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
