import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'
import MarkEntryPaidButton from '@/components/studio/MarkEntryPaidButton'

export const dynamic = 'force-dynamic'

interface EntryRow {
  id: string
  amount_cents: number
  status: string
  paid_at: string | null
  created_at: string
  beneficiary_user_id: string
  users: { email: string; name: string | null; role: string } | null
  invoices: { kind: string; clients: { display_name: string } | null } | null
}

export default async function StatementsPage() {
  const me = await getSessionUser()
  if (!me) return null
  const isOwner = me.role === 'owner'

  const supabase = await createClient()
  // RLS scopes this automatically: owner sees all, partner/developer see own.
  const { data } = await supabase
    .from('commission_entries')
    .select('id, amount_cents, status, paid_at, created_at, beneficiary_user_id, users:beneficiary_user_id(email, name, role), invoices:invoice_id(kind, clients:client_id(display_name))')
    .order('created_at', { ascending: false })
  const entries = (data ?? []) as unknown as EntryRow[]

  // Statement per beneficiary: what is owed and what is paid (brief §6).
  const byUser = new Map<string, { label: string; owed: number; paid: number }>()
  for (const e of entries) {
    const label = e.users?.name || e.users?.email || e.beneficiary_user_id
    const s = byUser.get(e.beneficiary_user_id) ?? { label, owed: 0, paid: 0 }
    if (e.status === 'pending') s.owed += e.amount_cents
    if (e.status === 'paid') s.paid += e.amount_cents
    byUser.set(e.beneficiary_user_id, s)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{isOwner ? 'Commission statements' : 'My commissions'}</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from(byUser.values()).map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm font-medium">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">Owed</p>
            <p className="text-2xl font-bold">${(s.owed / 100).toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">Paid to date: ${(s.paid / 100).toLocaleString()}</p>
          </div>
        ))}
        {byUser.size === 0 && (
          <p className="text-sm text-muted-foreground">No entries yet — they appear when invoices get paid.</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Beneficiary', 'Client · revenue', 'Amount', 'Status', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{e.users?.name || e.users?.email || '—'}</td>
                <td className="px-4 py-3">
                  {e.invoices?.clients?.display_name ?? '—'} · <span className="capitalize">{e.invoices?.kind.replace('_', ' ') ?? ''}</span>
                </td>
                <td className="px-4 py-3 font-medium">${(e.amount_cents / 100).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{e.status}{e.paid_at ? ` · ${new Date(e.paid_at).toLocaleDateString()}` : ''}</td>
                <td className="px-4 py-3 text-right">
                  {isOwner && e.status === 'pending' && <MarkEntryPaidButton id={e.id} />}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nothing here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
