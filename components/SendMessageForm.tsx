'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SendMessageForm({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ leadId, channel, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Gönderilemedi.')
        setLoading(false)
        return
      }
      setContent('')
      router.refresh()
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm text-gray-600">Kanal</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as 'whatsapp' | 'sms')}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
        >
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
        </select>
      </div>
      <textarea
        required
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Mesaj metni..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Gönderiliyor...' : 'Gönder'}
      </button>
      <p className="text-xs text-gray-400">
        Twilio sandbox / numaralar .env içinde dolu olmalı. Aksi halde hata mesajı görürsün.
      </p>
    </form>
  )
}
