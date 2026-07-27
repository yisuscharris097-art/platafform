import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import MarkReadButton from '@/components/app/MarkReadButton'

export const dynamic = 'force-dynamic'

interface LeadRow {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  intent: string | null
  source: string | null
  created_at: string
  read_at: string | null
}

export default async function LeadsPage() {
  const me = await getMyClient()
  if (!me) return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('id, name, email, phone, message, intent, source, created_at, read_at')
    .eq('client_id', me.id)
    .order('created_at', { ascending: false })
    .limit(200)
  const leads = (data ?? []) as LeadRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Leads</h1>
        <a href="/api/leads/export" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium">
          Export CSV
        </a>
      </div>

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className={`rounded-xl border p-4 ${l.read_at ? 'border-border bg-white' : 'border-foreground/30 bg-white shadow-sm'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!l.read_at && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                <p className="font-medium">{l.name ?? l.email ?? l.phone ?? 'Anonymous'}</p>
                {l.intent && <span className="rounded bg-muted px-2 py-0.5 text-xs capitalize">{l.intent}</span>}
              </div>
              <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[l.email, l.phone].filter(Boolean).join(' · ')}
              {l.source ? ` · via ${l.source}` : ''}
            </p>
            {l.message && <p className="mt-2 text-sm">{l.message}</p>}
            {!l.read_at && <MarkReadButton id={l.id} />}
          </div>
        ))}
        {leads.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
            No leads yet — they arrive here the moment your site forms are submitted.
          </div>
        )}
      </div>
    </div>
  )
}
