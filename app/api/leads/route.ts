import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CORS_HEADERS, hashIp, rateLimit, requestIp, resolveClientId, serviceClient } from '@/lib/collect'

export const runtime = 'nodejs'

const leadSchema = z.object({
  client: z.string().min(2).max(60),
  name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),
  intent: z.string().max(60).optional(),
  listing_id: z.string().uuid().optional(),
  source: z.string().max(120).optional(),
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
  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400, headers: CORS_HEADERS })
  if (!parsed.data.email && !parsed.data.phone) {
    return NextResponse.json({ error: 'contact_required' }, { status: 400, headers: CORS_HEADERS })
  }

  const clientId = await resolveClientId(parsed.data.client)
  if (!clientId) return NextResponse.json({ error: 'unknown_client' }, { status: 404, headers: CORS_HEADERS })

  const db = serviceClient()
  await db.from('leads').insert({
    client_id: clientId,
    name: parsed.data.name ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    intent: parsed.data.intent ?? null,
    listing_id: parsed.data.listing_id ?? null,
    source: parsed.data.source ?? null,
    utm: parsed.data.utm ?? {},
  })
  await db.from('events').insert({ client_id: clientId, type: 'form_submit', path: parsed.data.source ?? null })

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS })
}
