import { notFound } from 'next/navigation'
import ClientForm, { type ClientFormValues } from '@/components/studio/ClientForm'
import { updateClientAction } from '@/lib/actions/clients'
import { createClient } from '@/lib/supabase/server'

interface DbClient {
  id: string
  slug: string
  display_name: string
  brokerage: string | null
  market: string | null
  license_states: string[]
  tier: string
  status: string
  host_target: string
  primary_domain: string | null
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, slug, display_name, brokerage, market, license_states, tier, status, host_target, primary_domain')
    .eq('id', id)
    .single()
  if (!data) notFound()
  const c = data as DbClient

  const initial: ClientFormValues = {
    id: c.id,
    slug: c.slug,
    display_name: c.display_name,
    brokerage: c.brokerage ?? '',
    market: c.market ?? '',
    license_states: c.license_states.join(', '),
    tier: c.tier,
    status: c.status,
    host_target: c.host_target,
    primary_domain: c.primary_domain ?? '',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit · {c.display_name}</h1>
        <div className="flex gap-4 text-sm">
          <a href={`/studio/clients/${c.id}/intake`} className="text-muted-foreground hover:text-foreground">Intake →</a>
          <a href={`/studio/clients/${c.id}/invoices`} className="text-muted-foreground hover:text-foreground">Invoices →</a>
        </div>
      </div>
      <ClientForm action={updateClientAction} initial={initial} submitLabel="Save changes" />
    </div>
  )
}
