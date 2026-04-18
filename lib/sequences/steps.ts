export type ParsedSequenceStep = {
  step: number
  delay_hours: number
  channel: 'whatsapp' | 'sms' | 'email'
  template: string
}

export function addHours(d: Date, hours: number): Date {
  const x = new Date(d)
  x.setTime(x.getTime() + hours * 60 * 60 * 1000)
  return x
}

/** sequences.steps JSON → düz dizi */
export function parseSequenceSteps(raw: unknown): ParsedSequenceStep[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedSequenceStep[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const step = typeof o.step === 'number' ? o.step : Number(o.step ?? 0)
    const delay_hours =
      typeof o.delay_hours === 'number' ? o.delay_hours : Number(o.delay_hours ?? 0) || 0
    const ch = o.channel === 'sms' ? 'sms' : o.channel === 'email' ? 'email' : 'whatsapp'
    const template = typeof o.template === 'string' ? o.template : ''
    if (!template.trim()) continue
    out.push({ step, delay_hours, channel: ch, template })
  }
  out.sort((a, b) => a.step - b.step)
  return out
}
