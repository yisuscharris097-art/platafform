import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import { payInvoice, openBillingPortal } from '@/lib/actions/invoices'

export const dynamic = 'force-dynamic'

interface InvoiceRow {
  id: string
  kind: string
  amount_cents: number
  currency: string
  status: string
  due_at: string | null
  paid_at: string | null
  created_at: string
}

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  open: 'bg-amber-100 text-amber-700',
  draft: 'bg-muted text-muted-foreground',
  void: 'bg-muted text-muted-foreground',
  uncollectible: 'bg-red-100 text-red-700',
}

export default async function BillingPage() {
  const me = await getMyClient()
  if (!me) return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  const supabase = await createClient()
  const [{ data }, { data: clientRow }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, kind, amount_cents, currency, status, due_at, paid_at, created_at')
      .eq('client_id', me.id)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('stripe_customer_id').eq('id', me.id).maybeSingle(),
  ])
  const invoices = (data ?? []) as InvoiceRow[]
  const hasPortal = Boolean((clientRow as { stripe_customer_id: string | null } | null)?.stripe_customer_id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Billing</h1>
        {hasPortal && (
          <form action={openBillingPortal}>
            <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium">
              Payment method & history ↗
            </button>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Invoice', 'Amount', 'Status', 'Due', ''].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 capitalize">{inv.kind.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-medium">
                  ${(inv.amount_cents / 100).toLocaleString()} {inv.currency.toUpperCase()}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[inv.status] ?? ''}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right">
                  {inv.status === 'open' && (
                    <form action={payInvoice}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                        Pay now
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No invoices yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
