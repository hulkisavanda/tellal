import { placeholderJson } from '@/lib/api/placeholder-response'

/** Fal.ai görsel üretim (placeholder). */
export async function POST() {
  return placeholderJson('media.fal', 'FAL_API_KEY ile görsel üretimi burada çağrılacak.')
}
