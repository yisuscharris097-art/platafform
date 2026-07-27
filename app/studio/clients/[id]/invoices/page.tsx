import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InvoiceForm from '@/components/studio/InvoiceForm'

export const dynamic = 'force-dynamic'

interface InvoiceRow {
  id: string
  kind: string
  amount_cents: number
  status: string
  due_at: string | null
  paid_at: string | null
}

export default async function ClientInvoicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, display_name, billing_flagged').eq('id', id).single()
  if (!client) notFound()
  const c = client as { id: string; display_name: string; billing_flagged: boolean }
  const { data } = await supabase
    .from('invoices')
    .select('id, kind, amount_cents, status, due_at, paid_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
  const invoices = (data ?? []) as InvoiceRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          Invoices · {c.display_name}
          {c.billing_flagged && (
            <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              BILLING FLAGGED
            </span>
          )}
        </h1>
        <Link href={`/studio/clients/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Client</Link>
      </div>

      <InvoiceForm clientId={id} />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Kind', 'Amount', 'Status', 'Due', 'Paid'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 capitalize">{inv.kind.replace('_', ' ')}</td>
                <td className="px-4 py-3">${(inv.amount_cents / 100).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{inv.status}</td>
                <td className="px-4 py-3">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
