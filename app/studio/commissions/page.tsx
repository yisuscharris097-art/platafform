import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'
import RuleForm from '@/components/studio/RuleForm'
import CloseRuleButton from '@/components/studio/CloseRuleButton'

export const dynamic = 'force-dynamic'

interface RuleRow {
  id: string
  revenue_kind: string
  beneficiary_role: string
  percent_bps: number
  effective_from: string
  effective_to: string | null
  created_at: string
}

interface AuditRow {
  id: string
  action: string
  changed_at: string
  new_row: { revenue_kind?: string; beneficiary_role?: string; percent_bps?: number } | null
}

export default async function CommissionsPage() {
  const me = await getSessionUser()
  if (!me || me.role !== 'owner') redirect('/studio') // the split is owner business only

  const supabase = await createClient()
  const [{ data: rulesData }, { data: auditData }] = await Promise.all([
    supabase
      .from('commission_rules')
      .select('id, revenue_kind, beneficiary_role, percent_bps, effective_from, effective_to, created_at')
      .order('effective_from', { ascending: false }),
    supabase
      .from('commission_rules_audit')
      .select('id, action, changed_at, new_row')
      .order('changed_at', { ascending: false })
      .limit(20),
  ])
  const rules = (rulesData ?? []) as RuleRow[]
  const audit = (auditData ?? []) as AuditRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Commission rules</h1>
        <a href="/studio/commissions/statements" className="text-sm text-muted-foreground hover:text-foreground">
          Statements →
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        Percentages are data, never code. New versions get an effective-from date; closing a rule stamps
        effective-to — historic entries never change.
      </p>

      <RuleForm />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Revenue', 'Beneficiary', 'Percent', 'Effective', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => {
              const active = r.effective_to === null || r.effective_to >= new Date().toISOString().slice(0, 10)
              return (
                <tr key={r.id} className={`border-b border-border last:border-0 ${active ? '' : 'opacity-50'}`}>
                  <td className="px-4 py-3 capitalize">{r.revenue_kind.replace('_', ' ')}</td>
                  <td className="px-4 py-3 capitalize">{r.beneficiary_role}</td>
                  <td className="px-4 py-3 font-medium">{(r.percent_bps / 100).toFixed(2)}%</td>
                  <td className="px-4 py-3">{r.effective_from} → {r.effective_to ?? 'open'}</td>
                  <td className="px-4 py-3 text-right">{r.effective_to === null && <CloseRuleButton id={r.id} />}</td>
                </tr>
              )
            })}
            {rules.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No rules yet — the engine writes no entries until one exists.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <p className="mb-2 text-sm font-medium">Audit trail</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {audit.map((a) => (
            <li key={a.id}>
              {new Date(a.changed_at).toLocaleString()} — <span className="uppercase">{a.action}</span>
              {a.new_row ? ` · ${a.new_row.revenue_kind ?? ''} → ${a.new_row.beneficiary_role ?? ''} ${(Number(a.new_row.percent_bps ?? 0) / 100).toFixed(2)}%` : ''}
            </li>
          ))}
          {audit.length === 0 && <li>No changes recorded yet.</li>}
        </ul>
      </div>
    </div>
  )
}
