import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

export function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

/** CORS for static client sites (targets B/C) posting cross-origin. */
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Brief §8: never store a raw IP — hash it with a ROTATING salt (env salt +
 * UTC date), so hashes cannot be correlated across days.
 */
export function hashIp(ip: string): string {
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${process.env.COLLECT_IP_SALT ?? 'dev-salt'}:${day}:${ip}`).digest('hex')
}

// Per-IP-hash rate limit (fixed window). In-memory per instance — enough to
// stop abuse on a single Vercel instance; a shared store can replace it later.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120
const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(ipHash: string): boolean {
  const now = Date.now()
  const b = buckets.get(ipHash)
  if (!b || now > b.resetAt) {
    buckets.set(ipHash, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  b.count += 1
  return b.count <= MAX_PER_WINDOW
}

export function requestIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd ? (fwd.split(',')[0] ?? '').trim() : 'unknown'
}

const slugCache = new Map<string, string>()

/** Resolve a client slug (the snippet's public identifier) to its id. */
export async function resolveClientId(slug: string): Promise<string | null> {
  const cached = slugCache.get(slug)
  if (cached) return cached
  const db = serviceClient()
  const { data } = await db.from('clients').select('id').eq('slug', slug).maybeSingle()
  const id = (data as { id: string } | null)?.id ?? null
  if (id) slugCache.set(slug, id)
  return id
}
