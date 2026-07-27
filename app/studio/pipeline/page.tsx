import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLIENT_STATUSES, type ClientRow } from '@/lib/clients'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, slug, display_name, brokerage, market, tier, status, host_target, primary_domain, launched_at, sites(last_published_at)')
  const rows = (data ?? []) as ClientRow[]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Pipeline</h1>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CLIENT_STATUSES.map((status) => {
          const inCol = rows.filter((c) => c.status === status)
          return (
            <div key={status} className="rounded-xl border border-border bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {status} · {inCol.length}
              </p>
              <div className="space-y-2">
                {inCol.map((c) => (
                  <Link
                    key={c.id}
                    href={`/studio/clients/${c.id}`}
                    className="block rounded-lg border border-border p-3 hover:border-foreground/40"
                  >
                    <p className="text-sm font-medium">{c.display_name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {c.tier} · {c.host_target}
                    </p>
                  </Link>
                ))}
                {inCol.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
