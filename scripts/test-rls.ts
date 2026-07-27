/**
 * RLS role test (brief §4): logs in as each role and asserts what it CANNOT
 * reach. Run AFTER applying supabase/migrations to a fresh project:
 *
 *   npx pnpm test:rls          (requires .env.local with URL + anon + service keys)
 *
 * Seeds idempotent fixtures with the service role, then signs in with password
 * per role (passwords are a test-only convenience; the app itself uses magic
 * links). Exits 1 if any assertion fails.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !ANON || !SERVICE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (.env.local)')
  process.exit(1)
}

const PASSWORD = 'Rls-test-password-1!'
const FIXTURE = {
  owner: 'rls.owner@test.relay',
  partnerA: 'rls.partner.a@test.relay',
  partnerB: 'rls.partner.b@test.relay',
  developer: 'rls.developer@test.relay',
  clientUser: 'rls.client.a@test.relay',
} as const

const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } })

type Ids = Record<keyof typeof FIXTURE, string> & { clientA: string; clientB: string }

async function ensureUser(email: string, role: string): Promise<string> {
  const created = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true })
  let id = created.data.user?.id
  if (!id) {
    const { data } = await admin.from('users').select('id').eq('email', email).single()
    id = (data as { id: string } | null)?.id
  }
  if (!id) throw new Error(`could not ensure user ${email}`)
  await admin.from('users').upsert({ id, email, role })
  return id
}

async function seed(): Promise<Ids> {
  const owner = await ensureUser(FIXTURE.owner, 'owner')
  const partnerA = await ensureUser(FIXTURE.partnerA, 'partner')
  const partnerB = await ensureUser(FIXTURE.partnerB, 'partner')
  const developer = await ensureUser(FIXTURE.developer, 'developer')
  const clientUser = await ensureUser(FIXTURE.clientUser, 'client')

  const upsertClient = async (slug: string, originatedBy: string, portalUserId: string | null) => {
    const { data, error } = await admin
      .from('clients')
      .upsert({ slug, display_name: slug, tier: 'starter', status: 'building', originated_by: originatedBy, portal_user_id: portalUserId }, { onConflict: 'slug' })
      .select('id')
      .single()
    if (error) throw error
    return (data as { id: string }).id
  }
  const clientA = await upsertClient('rls-client-a', partnerA, clientUser)
  const clientB = await upsertClient('rls-client-b', partnerB, null)

  await admin.from('sites').upsert({ client_id: clientA }, { onConflict: 'client_id' })
  await admin.from('leads').insert({ client_id: clientB, name: 'Secret lead of B', email: 'x@y.z' })
  const { data: rule } = await admin
    .from('commission_rules')
    .insert({ revenue_kind: 'deposit', beneficiary_role: 'partner', percent_bps: 1000, effective_from: '2026-01-01', created_by: owner })
    .select('id')
    .single()
  const { data: inv } = await admin
    .from('invoices')
    .insert({ client_id: clientA, kind: 'deposit', amount_cents: 150000, status: 'paid' })
    .select('id')
    .single()
  if (rule && inv) {
    await admin.from('commission_entries').insert({
      invoice_id: (inv as { id: string }).id,
      beneficiary_user_id: partnerA,
      rule_id: (rule as { id: string }).id,
      amount_cents: 15000,
    })
  }
  return { owner, partnerA, partnerB, developer, clientUser, clientA, clientB }
}

async function loginAs(email: string): Promise<SupabaseClient> {
  const c = createClient(URL!, ANON!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`login failed for ${email}: ${error.message}`)
  return c
}

let failures = 0
function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '  ✅' : '  ❌'} ${label}${ok ? '' : `  ← ${detail}`}`)
  if (!ok) failures += 1
}

async function main(): Promise<void> {
  console.log('Seeding fixtures (service role)…')
  const ids = await seed()

  console.log('\nOWNER — sees everything')
  {
    const c = await loginAs(FIXTURE.owner)
    const clients = await c.from('clients').select('id').in('id', [ids.clientA, ids.clientB])
    check('owner sees both clients', (clients.data?.length ?? 0) === 2)
    const rules = await c.from('commission_rules').select('id')
    check('owner reads commission_rules', (rules.data?.length ?? 0) >= 1)
  }

  console.log('\nPARTNER A — only originated clients, own entries; NO rules')
  {
    const c = await loginAs(FIXTURE.partnerA)
    const mine = await c.from('clients').select('id')
    const seesA = (mine.data ?? []).some((r) => (r as { id: string }).id === ids.clientA)
    const seesB = (mine.data ?? []).some((r) => (r as { id: string }).id === ids.clientB)
    check('partner A sees client A', seesA)
    check('partner A CANNOT see client B', !seesB)
    const rules = await c.from('commission_rules').select('id')
    check('partner CANNOT read commission_rules', (rules.data?.length ?? 0) === 0)
    const ins = await c.from('commission_rules').insert({ revenue_kind: 'deposit', beneficiary_role: 'partner', percent_bps: 5000, effective_from: '2026-01-01' })
    check('partner CANNOT insert commission_rules', ins.error !== null)
    const own = await c.from('commission_entries').select('id')
    check('partner sees own commission entries', (own.data?.length ?? 0) >= 1)
    const leaksB = await c.from('leads').select('id').eq('client_id', ids.clientB)
    check("partner A CANNOT read client B's leads", (leaksB.data?.length ?? 0) === 0)
  }

  console.log('\nPARTNER B — cannot see A')
  {
    const c = await loginAs(FIXTURE.partnerB)
    const a = await c.from('clients').select('id').eq('id', ids.clientA)
    check('partner B CANNOT see client A', (a.data?.length ?? 0) === 0)
  }

  console.log('\nDEVELOPER — all clients, NO commission rules editor')
  {
    const c = await loginAs(FIXTURE.developer)
    const clients = await c.from('clients').select('id').in('id', [ids.clientA, ids.clientB])
    check('developer sees both clients', (clients.data?.length ?? 0) === 2)
    const ins = await c.from('commission_rules').insert({ revenue_kind: 'balance', beneficiary_role: 'developer', percent_bps: 100, effective_from: '2026-01-01' })
    check('developer CANNOT insert commission_rules', ins.error !== null)
    const rules = await c.from('commission_rules').select('id')
    check('developer CANNOT read commission_rules', (rules.data?.length ?? 0) === 0)
  }

  console.log('\nCLIENT — own row and children only; never revenue internals')
  {
    const c = await loginAs(FIXTURE.clientUser)
    const clients = await c.from('clients').select('id')
    check('client sees exactly their own client', (clients.data?.length ?? 0) === 1 && (clients.data?.[0] as { id: string } | undefined)?.id === ids.clientA)
    const b = await c.from('clients').select('id').eq('id', ids.clientB)
    check('client CANNOT see other clients', (b.data?.length ?? 0) === 0)
    const site = await c.from('sites').select('id').eq('client_id', ids.clientA)
    check('client sees own site', (site.data?.length ?? 0) === 1)
    const leaksB = await c.from('leads').select('id').eq('client_id', ids.clientB)
    check("client CANNOT read another client's leads", (leaksB.data?.length ?? 0) === 0)
    const rules = await c.from('commission_rules').select('id')
    check('client CANNOT read commission_rules', (rules.data?.length ?? 0) === 0)
    const entries = await c.from('commission_entries').select('id')
    check('client CANNOT read commission_entries', (entries.data?.length ?? 0) === 0)
    const upd = await c.from('clients').update({ display_name: 'hacked' }).eq('id', ids.clientA).select('id')
    check('client CANNOT update their client row (M1: read-only)', upd.error !== null || (upd.data?.length ?? 0) === 0)
  }

  console.log(failures === 0 ? '\n🎉 RLS: all assertions passed' : `\n💥 RLS: ${failures} assertion(s) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e: unknown) => {
  console.error('test-rls crashed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
