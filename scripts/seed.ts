/**
 * Milestone 2 seed — loads the studio's two existing client sites so the admin
 * has real data to look at (brief §7.2). Idempotent (upserts by slug).
 * Placeholder facts (domains, MRR) — edit from /studio once running.
 *
 *   npx pnpm seed     (requires .env.local with service role key)
 */
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)')
  process.exit(1)
}
const db = createClient(URL, SERVICE, { auth: { persistSession: false } })

interface SeedClient {
  slug: string
  display_name: string
  brokerage: string | null
  market: string
  tier: 'starter' | 'signature' | 'flagship'
  status: 'live'
  host_target: 'vercel' | 'cloudflare'
  primary_domain: string
  care_monthly_cents: number
}

const CLIENTS: SeedClient[] = [
  {
    slug: 'andrea-larsen',
    display_name: 'Andrea Larsen',
    brokerage: null,
    market: 'South Florida',
    tier: 'flagship',
    status: 'live',
    host_target: 'vercel',
    primary_domain: 'andrealarsen.example.com', // placeholder — set the real one in /studio
    care_monthly_cents: 9900,
  },
  {
    slug: 'luxeshots',
    display_name: 'LuxeShots',
    brokerage: null,
    market: 'Palm Beach, FL',
    tier: 'signature',
    status: 'live',
    host_target: 'cloudflare',
    primary_domain: 'luxeshots.example.com', // placeholder — set the real one in /studio
    care_monthly_cents: 4900,
  },
]

async function main(): Promise<void> {
  await db.from('organizations').upsert({ name: 'Relay Studios', slug: 'relay-studios' }, { onConflict: 'slug' })

  for (const c of CLIENTS) {
    const { data, error } = await db
      .from('clients')
      .upsert(
        {
          slug: c.slug,
          display_name: c.display_name,
          brokerage: c.brokerage,
          market: c.market,
          tier: c.tier,
          status: c.status,
          host_target: c.host_target,
          primary_domain: c.primary_domain,
          launched_at: new Date().toISOString(),
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single()
    if (error || !data) throw error ?? new Error('upsert failed')
    const clientId = (data as { id: string }).id

    await db.from('sites').upsert(
      { client_id: clientId, template: 'default', last_published_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    )

    // One paid care invoice this month so the MRR column has real numbers.
    const { data: existing } = await db
      .from('invoices')
      .select('id')
      .eq('client_id', clientId)
      .eq('kind', 'care_monthly')
      .limit(1)
    if (!existing || existing.length === 0) {
      await db.from('invoices').insert({
        client_id: clientId,
        kind: 'care_monthly',
        amount_cents: c.care_monthly_cents,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
    }
    console.log(`✅ ${c.display_name} (${c.tier}, ${c.host_target})`)
  }
  console.log('Seed done — open /studio')
}

main().catch((e: unknown) => {
  console.error('seed failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
