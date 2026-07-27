'use client'
import { useActionState } from 'react'
import { createInvoiceAction, type ActionState } from '@/lib/actions/invoices'

const input = 'rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'

export default function InvoiceForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(createInvoiceAction, { error: null } as ActionState)
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Kind</label>
        <select name="kind" className={input}>
          {['deposit', 'balance', 'renewal', 'change_order'].map((k) => (
            <option key={k} value={k}>{k.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Amount (USD)</label>
        <input name="amount_usd" type="number" min={1} step="0.01" required className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Due (days)</label>
        <input name="due_days" type="number" min={0} defaultValue={7} className={input} />
      </div>
      <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {pending ? 'Creating…' : 'Create invoice'}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  )
}
