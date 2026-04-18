/** Meta webhook JSON’undan leadgen_id ve page_id çıkarmayı dener. */
export function extractMetaLeadgenMeta(payload: unknown): { leadgenId: string | null; pageId: string | null } {
  if (!payload || typeof payload !== 'object') return { leadgenId: null, pageId: null }
  const o = payload as Record<string, unknown>
  const entry = Array.isArray(o.entry) ? o.entry[0] : null
  if (!entry || typeof entry !== 'object') return { leadgenId: null, pageId: null }
  const e = entry as Record<string, unknown>
  const changes = Array.isArray(e.changes) ? e.changes[0] : null
  if (!changes || typeof changes !== 'object') return { leadgenId: null, pageId: null }
  const c = changes as Record<string, unknown>
  const value = c.value && typeof c.value === 'object' ? (c.value as Record<string, unknown>) : null
  if (!value) return { leadgenId: null, pageId: null }
  const leadgenId = typeof value.leadgen_id === 'string' ? value.leadgen_id : null
  const pageId =
    typeof value.page_id === 'string'
      ? value.page_id
      : typeof value.pageid === 'string'
        ? value.pageid
        : null
  return { leadgenId, pageId }
}
