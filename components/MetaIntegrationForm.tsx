'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

type MetaStatus = {
  meta_account_id: string
  active: boolean
  verify_token_set: boolean
  page_access_token_set: boolean
  app_secret_set: boolean
  graph_api_version: string
}

export function MetaIntegrationForm() {
  const [status, setStatus] = useState<MetaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [pageId, setPageId] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [pageAccessToken, setPageAccessToken] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [graphVersion, setGraphVersion] = useState('v21.0')
  const [active, setActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/settings/meta', { credentials: 'same-origin' })
      const j = (await r.json()) as MetaStatus & { error?: string }
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Yüklenemedi' })
        return
      }
      setStatus(j)
      setPageId(j.meta_account_id ?? '')
      setGraphVersion(j.graph_api_version || 'v21.0')
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
      const r = await fetch('/api/settings/meta', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_account_id: pageId,
          verify_token: verifyToken,
          page_access_token: pageAccessToken,
          app_secret: appSecret,
          graph_api_version: graphVersion,
          active,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Kaydedilemedi' })
        return
      }
      setMessage({ type: 'ok', text: 'Meta ayarlari kaydedildi.' })
      setVerifyToken('')
      setPageAccessToken('')
      setAppSecret('')
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
          Verify: {status.verify_token_set ? 'kayitli' : 'yok'} · Page token:{' '}
          {status.page_access_token_set ? 'kayitli' : 'yok'} · App secret:{' '}
          {status.app_secret_set ? 'kayitli' : 'yok'}
        </p>
      ) : null}
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Sayfa ID (meta_account_id)</label>
        <input
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Verify token</label>
        <input
          type="password"
          value={verifyToken}
          onChange={(e) => setVerifyToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Yeni veya bos birak onceki kalir"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Page access token</label>
        <input
          type="password"
          value={pageAccessToken}
          onChange={(e) => setPageAccessToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">App secret</label>
        <input
          type="password"
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase">Graph API version</label>
        <input
          value={graphVersion}
          onChange={(e) => setGraphVersion(e.target.value)}
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
