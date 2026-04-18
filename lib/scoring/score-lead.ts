import { anthropic, MODEL } from '@/lib/claude/client'
import type { LeadScore } from '@/types'

export type LeadInputForScore = {
  name: string
  interest: string
  budget: string
  source: string
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) return fenced[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) return text.slice(start, end + 1)
  return text.trim()
}

function parseLeadScore(raw: unknown): LeadScore {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz yanıt')
  const o = raw as Record<string, unknown>
  const score = Number(o.score)
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error('Skor 0-100 arası olmalı')
  }
  const category = o.category
  if (category !== 'hot' && category !== 'warm' && category !== 'cold') {
    throw new Error('Geçersiz kategori')
  }
  const reasoning = typeof o.reasoning === 'string' ? o.reasoning : ''
  const tone = o.recommended_tone
  if (tone !== 'urgent' && tone !== 'informative' && tone !== 'casual') {
    throw new Error('Geçersiz ton')
  }
  const pr = Number(o.priority_rank)
  const priority_rank = Number.isFinite(pr) && pr >= 1 && pr <= 5 ? pr : 3

  return {
    score: Math.round(score),
    category,
    reasoning: reasoning.slice(0, 2000),
    recommended_tone: tone,
    priority_rank,
  }
}

export async function scoreLeadWithClaude(
  lead: LeadInputForScore,
  context: { officeName: string; city?: string | null }
): Promise<LeadScore> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key === 'placeholder') {
    throw new Error('ANTHROPIC_API_KEY tanımlı değil.')
  }

  const cityLine = context.city ? `Şehir / bölge: ${context.city}` : ''

  const prompt = `Sen bir gayrimenkul lead analisti'sin.
Aşağıdaki lead verisini analiz et ve YALNIZCA geçerli bir JSON nesnesi döndür (başında/sonunda açıklama yok).

Lead adı: ${lead.name}
İlgi / talep: ${lead.interest}
Bütçe: ${lead.budget}
Kaynak: ${lead.source}
Ofis: ${context.officeName}
${cityLine}

Yanıt formatı (sadece bu anahtarlar, Türkçe reasoning):
{
  "score": <0-100 sayı>,
  "category": "hot" | "warm" | "cold",
  "reasoning": "en fazla 2 cümle Türkçe gerekçe",
  "recommended_tone": "urgent" | "informative" | "casual",
  "priority_rank": <1-5>
}`

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = res.content[0]
  if (block.type !== 'text') {
    throw new Error('Beklenmeyen model yanıtı')
  }

  const jsonStr = extractJsonObject(block.text)
  const parsed = JSON.parse(jsonStr) as unknown
  return parseLeadScore(parsed)
}
