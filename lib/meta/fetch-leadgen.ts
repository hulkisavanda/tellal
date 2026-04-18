/**
 * Leadgen detayını Graph API’den çeker (META_PAGE_ACCESS_TOKEN gerekir).
 * @see https://developers.facebook.com/docs/marketing-api/guides/lead-ads
 */
export async function fetchLeadgenFields(
  leadgenId: string,
  pageAccessToken: string,
  graphVersion?: string | null
): Promise<Record<string, string>> {
  const version = graphVersion?.trim() || process.env.META_GRAPH_API_VERSION || 'v21.0'
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(leadgenId)}?access_token=${encodeURIComponent(pageAccessToken)}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) {
    const t = await res.text()
    console.error('fetchLeadgenFields:', res.status, t)
    return {}
  }
  const data = (await res.json()) as {
    field_data?: { name: string; values?: string[] }[]
  }
  const out: Record<string, string> = {}
  for (const f of data.field_data ?? []) {
    const v = f.values?.[0] ?? ''
    out[f.name.toLowerCase().replace(/\s+/g, '_')] = v
    out[f.name] = v
  }
  return out
}

/** field_data içinden ad / telefon tahmini */
export function mapLeadgenFieldsToLead(fields: Record<string, string>): {
  name: string
  phone: string
  interest: string
  budget: string
} {
  const name =
    fields.full_name ||
    fields['full name'] ||
    fields.name ||
    fields.first_name ||
    'Lead'
  const phone =
    fields.phone_number ||
    fields.phone ||
    fields.mobile ||
    fields.mobile_phone_number ||
    ''
  const interest = fields.interested_in || fields.interest || fields.city || '—'
  const budget = fields.budget || fields.preferred_budget || '—'
  return { name, phone, interest, budget }
}
