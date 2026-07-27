import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'

export const dynamic = 'force-dynamic'

interface EventRow {
  session_id: string | null
  type: string
  path: string | null
  listing_id: string | null
  referrer: string | null
}

function top(list: (string | null)[], n = 5): [string, number][] {
  const counts = new Map<string, number>()
  for (const v of list) {
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, n)
}

export default async function ClientDashboardPage() {
  const me = await getMyClient()
  if (!me) return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  const supabase = await createClient()

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const [{ data: evData }, { count: unread }, { data: listings }] = await Promise.all([
    supabase.from('events').select('session_id, type, path, listing_id, referrer').eq('client_id', me.id).gte('created_at', since).limit(5000),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('client_id', me.id).is('read_at', null),
    supabase.from('listings').select('id, address').eq('client_id', me.id),
  ])
  const events = (evData ?? []) as EventRow[]
  const addr = new Map((listings ?? []).map((l) => [(l as { id: string }).id, (l as { address: string }).address]))

  const visitors = new Set(events.filter((e) => e.session_id).map((e) => e.session_id)).size
  const pageviews = events.filter((e) => e.type === 'pageview').length
  const topPages = top(events.filter((e) => e.type === 'pageview').map((e) => e.path))
  const topListings = top(events.filter((e) => e.type === 'listing_view').map((e) => e.listing_id))
  const referrers = top(events.map((e) => e.referrer))

  const card = 'rounded-xl border border-border bg-white p-5'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard — {me.display_name}</h1>
        <Link href="/app/leads" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Leads {unread ? <span className="ml-1 rounded-full bg-white/20 px-1.5">{unread}</span> : null}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}><p className="text-xs uppercase text-muted-foreground">Visitors · 30d</p><p className="mt-1 text-3xl font-bold">{visitors}</p></div>
        <div className={card}><p className="text-xs uppercase text-muted-foreground">Pageviews · 30d</p><p className="mt-1 text-3xl font-bold">{pageviews}</p></div>
        <div className={card}><p className="text-xs uppercase text-muted-foreground">Unread leads</p><p className="mt-1 text-3xl font-bold">{unread ?? 0}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { title: 'Top pages', rows: topPages },
          { title: 'Top listings', rows: topListings.map(([id, n]) => [addr.get(id) ?? id, n] as [string, number]) },
          { title: 'Where they came from', rows: referrers },
        ].map((col) => (
          <div key={col.title} className={card}>
            <p className="mb-2 text-sm font-medium">{col.title}</p>
            {col.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet — install the snippet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {col.rows.map(([label, n]) => (
                  <li key={label} className="flex justify-between gap-2">
                    <span className="truncate">{label}</span>
                    <span className="text-muted-foreground">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className={card}>
        <p className="text-sm font-medium">Tracking snippet</p>
        <p className="mt-1 text-xs text-muted-foreground">Already installed on sites we build. For anything else:</p>
        <code className="mt-2 block overflow-x-auto rounded bg-muted p-3 text-xs">
          {`<script src="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/collect.js" data-client="${me.slug}" defer></script>`}
        </code>
      </div>
    </div>
  )
}
