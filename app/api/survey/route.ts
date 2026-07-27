import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serviceClient, hashIp, rateLimit, requestIp } from '@/lib/collect'

export const runtime = 'nodejs'

const surveySchema = z.object({
  name: z.string().max(120).optional(),
  email: z.string().email().max(200).optional(),
  brokerage: z.string().max(120).optional(),
  market: z.string().max(120).optional(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
})

/**
 * Scoring: numeric answers sum into a 0-100-ish score; the plan recommendation
 * is a simple threshold — refine as real responses arrive.
 */
function scoreAnswers(answers: Record<string, string | number | boolean>): { score: number; plan: 'starter' | 'signature' | 'flagship' } {
  let score = 0
  for (const v of Object.values(answers)) {
    if (typeof v === 'number') score += v
    else if (v === true || v === 'yes') score += 10
  }
  const plan = score >= 60 ? 'flagship' : score >= 30 ? 'signature' : 'starter'
  return { score, plan }
}

export async function POST(request: Request) {
  // Optional shared secret so only the Framer webhook can post.
  const expected = process.env.SURVEY_WEBHOOK_SECRET
  if (expected && request.headers.get('x-survey-secret') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!rateLimit(hashIp(requestIp(request)))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }
  const parsed = surveySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const { score, plan } = scoreAnswers(parsed.data.answers)
  const db = serviceClient()
  await db.from('survey_responses').insert({
    respondent_name: parsed.data.name ?? null,
    respondent_email: parsed.data.email ?? null,
    brokerage: parsed.data.brokerage ?? null,
    market: parsed.data.market ?? null,
    answers: parsed.data.answers,
    score,
    recommended_plan: plan,
  })
  return NextResponse.json({ ok: true, score, recommended_plan: plan })
}
