'use client'
import { useActionState } from 'react'
import { createRuleAction, type ActionState } from '@/lib/actions/commissions'

const input = 'rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'

export default function RuleForm() {
  const [state, formAction, pending] = useActionState(createRuleAction, { error: null } as ActionState)
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Revenue kind</label>
        <select name="revenue_kind" className={input}>
          {['deposit', 'balance', 'care_monthly', 'renewal', 'change_order'].map((k) => (
            <option key={k} value={k}>{k.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Beneficiary role</label>
        <select name="beneficiary_role" className={input}>
          {['partner', 'developer', 'owner'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Percent (%)</label>
        <input name="percent" type="number" min={0} max={100} step="0.01" required className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Effective from</label>
        <input name="effective_from" type="date" required className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Effective to (optional)</label>
        <input name="effective_to" type="date" className={input} />
      </div>
      <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {pending ? 'Adding…' : 'Add rule version'}
      </button>
      {state.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  )
}
