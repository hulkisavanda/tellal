import { createHmac, timingSafeEqual } from 'node:crypto'

/** Meta `X-Hub-Signature-256` doğrulaması (raw body ile). */
export function verifyMetaSignature256(appSecret: string, rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false
  const expectedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const expected = `sha256=${expectedHex}`
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signatureHeader, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
