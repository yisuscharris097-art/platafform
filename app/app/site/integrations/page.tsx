import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import IntegrationsForm, { type IntegrationValue } from '@/components/app/IntegrationsForm'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const me = await getMyClient()
  if (!me) return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('provider, config, enabled')
    .eq('client_id', me.id)
  const rows = (data ?? []) as { provider: string; config: { value?: string }; enabled: boolean }[]
  const byProvider = new Map<string, IntegrationValue>(
    rows.map((r) => [r.provider, { value: r.config.value ?? '', enabled: r.enabled }]),
  )
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Integrations</h1>
      <IntegrationsForm existing={Object.fromEntries(byProvider)} />
    </div>
  )
}
