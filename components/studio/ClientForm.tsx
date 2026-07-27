'use client'
import { useActionState } from 'react'
import { CLIENT_TIERS, CLIENT_STATUSES, HOST_TARGETS } from '@/lib/clients'
import type { ActionState } from '@/lib/actions/clients'

export interface ClientFormValues {
  id?: string
  slug: string
  display_name: string
  brokerage: string
  market: string
  license_states: string
  tier: string
  status: string
  host_target: string
  primary_domain: string
}

const EMPTY: ClientFormValues = {
  slug: '', display_name: '', brokerage: '', market: '', license_states: '',
  tier: 'starter', status: 'lead', host_target: 'cloudflare', primary_domain: '',
}

const input = 'w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'
const label = 'block text-xs font-medium text-muted-foreground mb-1'

export default function ClientForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  initial?: ClientFormValues
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  const v = initial ?? EMPTY

  return (
    <form action={formAction} className="max-w-2xl space-y-4 rounded-xl border border-border bg-white p-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Display name *</label>
          <input name="display_name" defaultValue={v.display_name} required className={input} />
        </div>
        <div>
          <label className={label}>Slug *</label>
          <input name="slug" defaultValue={v.slug} required pattern="[a-z0-9-]+" className={input} />
        </div>
        <div>
          <label className={label}>Brokerage</label>
          <input name="brokerage" defaultValue={v.brokerage} className={input} />
        </div>
        <div>
          <label className={label}>Market</label>
          <input name="market" defaultValue={v.market} placeholder="e.g. Palm Beach, FL" className={input} />
        </div>
        <div>
          <label className={label}>License states (comma-separated)</label>
          <input name="license_states" defaultValue={v.license_states} placeholder="FL, NY" className={input} />
        </div>
        <div>
          <label className={label}>Primary domain</label>
          <input name="primary_domain" defaultValue={v.primary_domain} placeholder="agentname.com" className={input} />
        </div>
        <div>
          <label className={label}>Tier</label>
          <select name="tier" defaultValue={v.tier} className={input}>
            {CLIENT_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select name="status" defaultValue={v.status} className={input}>
            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Host target</label>
          <select name="host_target" defaultValue={v.host_target} className={input}>
            {HOST_TARGETS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
