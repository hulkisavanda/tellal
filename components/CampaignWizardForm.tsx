'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function CampaignWizardForm() {
  const router = useRouter()
  const [name, setName] = useState('Test kampanyası')
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta')
  const [dailyBudget, setDailyBudget] = useState(100)
  const [notes, setNotes] = useState('Sentetik taslak.')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const r = await fetch('/api/campaigns/wizard', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          platform,
          daily_budget: dailyBudget,
          notes,
          steps_completed: ['platform', 'budget', 'creative_stub'],
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMessage({ type: 'err', text: j.error ?? 'Kaydedilemedi' })
        return
      }
      router.push('/campaigns')
      router.refresh()
    } catch {
      setMessage({ type: 'err', text: 'Ağ hatası' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Kampanya adı
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Platform
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as 'meta' | 'google')}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="meta">Meta</option>
          <option value="google">Google</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Günlük bütçe
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={dailyBudget}
          onChange={(e) => setDailyBudget(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          Notlar
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor…' : 'Taslak olarak kaydet'}
      </button>
      {message?.type === 'err' ? (
        <p className="text-sm text-red-600">{message.text}</p>
      ) : null}
    </form>
  )
}
