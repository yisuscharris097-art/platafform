import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CORS_HEADERS, hashIp, rateLimit, requestIp, resolveClientId, serviceClient } from '@/lib/collect'

export const runtime = 'nodejs'

const eventSchema = z.object({
  client: z.string().min(2).max(60), // client slug baked into the snippet
  type: z.enum(['pageview', 'listing_view', 'gallery_open', 'call_click', 'whatsapp_click', 'form_submit']),
  path: z.string().max(500).optional(),
  session: z.string().max(80).optional(),
  listing_id: z.string().uuid().optional(),
  referrer: z.string().max(500).optional(),
  utm: z.record(z.string(), z.string()).optional(),
})

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  const ipHash = hashIp(requestIp(request))
  if (!rateLimit(ipHash)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: CORS_HEADERS })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400, headers: CORS_HEADERS })
  }
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400, headers: CORS_HEADERS })

  const clientId = await resolveClientId(parsed.data.client)
  if (!clientId) return NextResponse.json({ error: 'unknown_client' }, { status: 404, headers: CORS_HEADERS })

  const ua = request.headers.get('user-agent') ?? ''
  const device = /mobile|iphone|android/i.test(ua) ? 'mobile' : 'desktop'
  const country = request.headers.get('x-vercel-ip-country') ?? null

  const db = serviceClient()
  await db.from('events').insert({
    client_id: clientId,
    session_id: parsed.data.session ?? null,
    type: parsed.data.type,
    path: parsed.data.path ?? null,
    listing_id: parsed.data.listing_id ?? null,
    referrer: parsed.data.referrer ?? null,
    utm: parsed.data.utm ?? {},
    country,
    device,
  })

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS })
}
