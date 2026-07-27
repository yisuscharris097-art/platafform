'use client'
import { useActionState } from 'react'
import { saveIntegration, type ActionState } from '@/lib/actions/cms'

export interface IntegrationValue {
  value: string
  enabled: boolean
}

const PROVIDERS: { key: 'ga4' | 'meta_pixel' | 'gtm' | 'calendly'; label: string; placeholder: string }[] = [
  { key: 'ga4', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX' },
  { key: 'meta_pixel', label: 'Meta Pixel', placeholder: '1234567890' },
  { key: 'gtm', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX' },
  { key: 'calendly', label: 'Calendly link', placeholder: 'https://calendly.com/you/intro' },
]

function ProviderRow({ provider, label, placeholder, initial }: { provider: string; label: string; placeholder: string; initial: IntegrationValue | undefined }) {
  const [state, formAction, pending] = useActionState(saveIntegration, { error: null } as ActionState)
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-4">
      <input type="hidden" name="provider" value={provider} />
      <div className="w-44 text-sm font-medium">{label}</div>
      <input
        name="value"
        defaultValue={initial?.value ?? ''}
        placeholder={placeholder}
        className="min-w-56 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="enabled" defaultChecked={initial?.enabled ?? false} /> Enabled
      </label>
      <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
        {pending ? 'Saving…' : 'Save'}
      </button>
      {state.ok && <span className="text-xs text-green-700">Saved ✓</span>}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  )
}

export default function IntegrationsForm({ existing }: { existing: Record<string, IntegrationValue> }) {
  return (
    <div className="space-y-3">
      {PROVIDERS.map((p) => (
        <ProviderRow key={p.key} provider={p.key} label={p.label} placeholder={p.placeholder} initial={existing[p.key]} />
      ))}
    </div>
  )
}
