export type GoogleOfficeIntegration = {
  active: boolean
  webhook_secret: string
}

export function getGoogleIntegration(
  settings: Record<string, unknown>
): GoogleOfficeIntegration | null {
  const integ = settings.integrations as Record<string, unknown> | undefined
  const g = integ?.google as Record<string, unknown> | undefined
  if (!g) return null
  const webhook_secret = typeof g.webhook_secret === 'string' ? g.webhook_secret : ''
  if (!webhook_secret) return null
  return {
    active: g.active !== false,
    webhook_secret,
  }
}
