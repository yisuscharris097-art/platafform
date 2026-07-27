import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ClientRow } from '@/lib/clients'

export const dynamic = 'force-dynamic'

interface MrrRow {
  client_id: string
  amount_cents: number
}

function fmtDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
}

export default async function StudioClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, slug, display_name, brokerage, market, tier, status, host_target, primary_domain, launched_at, sites(last_published_at)')
    .order('created_at', { ascending: true })

  // MRR = paid care_monthly invoices in the current calendar month, per client.
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const { data: mrrRows } = await supabase
    .from('invoices')
    .select('client_id, amount_cents')
    .eq('kind', 'care_monthly')
    .eq('status', 'paid')
    .gte('paid_at', monthStart.toISOString())
  const mrr = new Map<string, number>()
  for (const r of (mrrRows ?? []) as MrrRow[]) {
    mrr.set(r.client_id, (mrr.get(r.client_id) ?? 0) + r.amount_cents)
  }

  const rows = (clients ?? []) as ClientRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Clients</h1>
        <Link href="/studio/clients/new" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          + New client
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-sm text-muted-foreground">
          No clients yet. Run <code className="rounded bg-muted px-1">pnpm seed</code> to load the two
          existing sites, or create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                {['Client', 'Tier', 'Status', 'Host', 'Domain', 'Last publish', 'MRR', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.display_name}</p>
                    <p className="text-xs text-muted-foreground">{c.brokerage ?? c.market ?? c.slug}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{c.tier}</td>
                  <td className="px-4 py-3 capitalize">{c.status}</td>
                  <td className="px-4 py-3 capitalize">{c.host_target}</td>
                  <td className="px-4 py-3">{c.primary_domain ?? '—'}</td>
                  <td className="px-4 py-3">{fmtDate(c.sites?.[0]?.last_published_at ?? null)}</td>
                  <td className="px-4 py-3">
                    {mrr.has(c.id) ? `$${((mrr.get(c.id) ?? 0) / 100).toFixed(0)}/mo` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/studio/clients/${c.id}`} className="text-muted-foreground hover:text-foreground">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
