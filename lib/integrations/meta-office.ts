import { timingSafeEqualString } from '@/lib/security/timing-safe'

export type MetaOfficeIntegration = {
  active: boolean
  app_secret: string
  verify_token: string
  page_access_token: string
  graph_api_version: string | null
}

function readMeta(settings: Record<string, unknown>): MetaOfficeIntegration | null {
  const integ = settings.integrations as Record<string, unknown> | undefined
  const meta = integ?.meta as Record<string, unknown> | undefined
  if (!meta) return null
  const app_secret = typeof meta.app_secret === 'string' ? meta.app_secret : ''
  const verify_token = typeof meta.verify_token === 'string' ? meta.verify_token : ''
  const page_access_token = typeof meta.page_access_token === 'string' ? meta.page_access_token : ''
  const graph_api_version =
    typeof meta.graph_api_version === 'string' && meta.graph_api_version
      ? meta.graph_api_version
      : null
  if (!page_access_token && !verify_token && !app_secret) return null
  return {
    active: meta.active !== false,
    app_secret,
    verify_token,
    page_access_token,
    graph_api_version,
  }
}

export function getMetaIntegration(settings: Record<string, unknown>): MetaOfficeIntegration | null {
  const m = readMeta(settings)
  if (!m || !m.active) return null
  return m
}

export function metaHubVerifyMatches(settings: Record<string, unknown>, hubToken: string): boolean {
  const m = readMeta(settings)
  if (m?.verify_token && timingSafeEqualString(m.verify_token, hubToken)) return true
  return false
}
