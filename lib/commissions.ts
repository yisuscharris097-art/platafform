import { serviceClient } from '@/lib/collect'

// ── Commission engine (brief §5/§7) ──
// Every PAID invoice writes commission_entries by evaluating commission_rules
// active at the invoice's paid date. Percentages are DATA (rows), never code.
// Beneficiary resolution per rule role:
//   partner   → the client's originated_by user (skipped if none)
//   developer → every user with role 'developer'
//   owner     → every user with role 'owner'

interface InvoiceRow {
  id: string
  client_id: string
  kind: string
  amount_cents: number
  paid_at: string | null
}

interface RuleRow {
  id: string
  beneficiary_role: 'owner' | 'partner' | 'developer' | 'client'
  percent_bps: number
}

export async function writeCommissionEntries(invoiceId: string): Promise<void> {
  const db = serviceClient()

  const { data: invData } = await db
    .from('invoices')
    .select('id, client_id, kind, amount_cents, paid_at')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!invData) return
  const inv = invData as InvoiceRow
  const paidDate = (inv.paid_at ?? new Date().toISOString()).slice(0, 10)

  // Idempotent: never double-write for the same invoice.
  const { data: existing } = await db.from('commission_entries').select('id').eq('invoice_id', inv.id).limit(1)
  if (existing && existing.length > 0) return

  // Rules active at the paid date — historic entries never silently change
  // because past invoices were evaluated against the rules of THEIR date.
  const { data: rulesData } = await db
    .from('commission_rules')
    .select('id, beneficiary_role, percent_bps')
    .eq('revenue_kind', inv.kind)
    .lte('effective_from', paidDate)
    .or(`effective_to.is.null,effective_to.gte.${paidDate}`)
  const rules = (rulesData ?? []) as RuleRow[]
  if (rules.length === 0) return

  const { data: clientData } = await db.from('clients').select('originated_by').eq('id', inv.client_id).maybeSingle()
  const originatedBy = (clientData as { originated_by: string | null } | null)?.originated_by ?? null

  const entries: { invoice_id: string; beneficiary_user_id: string; rule_id: string; amount_cents: number }[] = []
  for (const rule of rules) {
    const amount = Math.floor((inv.amount_cents * rule.percent_bps) / 10000)
    if (amount <= 0) continue

    if (rule.beneficiary_role === 'partner') {
      if (originatedBy) entries.push({ invoice_id: inv.id, beneficiary_user_id: originatedBy, rule_id: rule.id, amount_cents: amount })
    } else if (rule.beneficiary_role === 'developer' || rule.beneficiary_role === 'owner') {
      const { data: users } = await db.from('users').select('id').eq('role', rule.beneficiary_role)
      for (const u of (users ?? []) as { id: string }[]) {
        entries.push({ invoice_id: inv.id, beneficiary_user_id: u.id, rule_id: rule.id, amount_cents: amount })
      }
    }
  }
  if (entries.length > 0) await db.from('commission_entries').insert(entries)
}
