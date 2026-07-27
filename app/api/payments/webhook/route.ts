import { NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { serviceClient } from '@/lib/collect'
import { writeCommissionEntries } from '@/lib/commissions'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const provider = getPaymentProvider()
  let events
  try {
    events = await provider.handleWebhook(request)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'bad webhook' }, { status: 400 })
  }

  const db = serviceClient()
  for (const ev of events) {
    if (ev.type === 'invoice_paid') {
      const { data } = await db
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_id: ev.providerRef })
        .eq('id', ev.invoiceId)
        .neq('status', 'paid') // idempotent: only transition once
        .select('id')
      if (data && data.length > 0) {
        await writeCommissionEntries(ev.invoiceId) // every paid invoice → entries (brief §5)
      }
    } else if (ev.type === 'care_payment_succeeded') {
      const { data: inv } = await db
        .from('invoices')
        .insert({
          client_id: ev.clientId,
          kind: 'care_monthly',
          amount_cents: ev.amountCents,
          currency: ev.currency,
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_id: ev.providerRef,
        })
        .select('id')
        .single()
      await db
        .from('clients')
        .update({ billing_failed_count: 0, ...(ev.customerId ? { stripe_customer_id: ev.customerId } : {}) })
        .eq('id', ev.clientId)
      if (inv) await writeCommissionEntries((inv as { id: string }).id)
    } else if (ev.type === 'care_payment_failed') {
      // Two consecutive failures FLAG the client. Suspension is a human decision.
      const match = ev.clientId
        ? db.from('clients').select('id, billing_failed_count').eq('id', ev.clientId).maybeSingle()
        : db.from('clients').select('id, billing_failed_count').eq('stripe_customer_id', ev.customerId ?? '—').maybeSingle()
      const { data: c } = await match
      if (c) {
        const row = c as { id: string; billing_failed_count: number }
        const count = row.billing_failed_count + 1
        await db
          .from('clients')
          .update({ billing_failed_count: count, ...(count >= 2 ? { billing_flagged: true } : {}) })
          .eq('id', row.id)
      }
    }
  }
  return NextResponse.json({ received: true })
}
