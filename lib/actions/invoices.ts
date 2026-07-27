'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import { getPaymentProvider } from '@/lib/payments'

export interface ActionState {
  error: string | null
}

const invoiceSchema = z.object({
  client_id: z.string().uuid(),
  kind: z.enum(['deposit', 'balance', 'renewal', 'change_order']),
  amount_usd: z.coerce.number().positive().max(1_000_000),
  due_days: z.coerce.number().int().min(0).max(365).default(7),
})

/** Studio creates an invoice (deposit at signing, balance at launch, …). */
export async function createInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = invoiceSchema.safeParse({
    client_id: formData.get('client_id'),
    kind: formData.get('kind'),
    amount_usd: formData.get('amount_usd'),
    due_days: formData.get('due_days') ?? 7,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid invoice' }

  const supabase = await createClient() // owner-only via RLS invoices_write
  const { error } = await supabase.from('invoices').insert({
    client_id: parsed.data.client_id,
    kind: parsed.data.kind,
    amount_cents: Math.round(parsed.data.amount_usd * 100),
    status: 'open',
    due_at: new Date(Date.now() + parsed.data.due_days * 86_400_000).toISOString(),
  })
  if (error) return { error: error.message }
  revalidatePath(`/studio/clients/${parsed.data.client_id}/invoices`)
  return { error: null }
}

/** Client pays an open invoice → provider checkout. */
export async function payInvoice(formData: FormData): Promise<void> {
  const id = formData.get('id')
  if (typeof id !== 'string') return
  const me = await getMyClient()
  if (!me) return
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, client_id, kind, amount_cents, currency, status')
    .eq('id', id)
    .maybeSingle()
  const inv = data as { id: string; client_id: string; kind: string; amount_cents: number; currency: string; status: string } | null
  if (!inv || inv.client_id !== me.id || inv.status !== 'open') return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { url } = await getPaymentProvider().createCheckout({
    invoiceId: inv.id,
    clientId: inv.client_id,
    customerEmail: user?.email ?? null,
    description: `${me.display_name} — ${inv.kind.replace('_', ' ')}`,
    amountCents: inv.amount_cents,
    currency: inv.currency,
    successUrl: `${site}/app/billing?paid=1`,
    cancelUrl: `${site}/app/billing`,
  })
  redirect(url)
}

/** Client starts the monthly care plan → provider subscription checkout. */
export async function startCareSubscription(formData: FormData): Promise<void> {
  const amountUsd = Number(formData.get('amount_usd') ?? 0)
  const me = await getMyClient()
  if (!me || !Number.isFinite(amountUsd) || amountUsd <= 0) return
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { checkoutUrl } = await getPaymentProvider().createSubscription({
    clientId: me.id,
    customerEmail: user?.email ?? null,
    planName: `Care plan — ${me.display_name}`,
    amountCentsMonthly: Math.round(amountUsd * 100),
    currency: 'usd',
    successUrl: `${site}/app/billing?care=1`,
    cancelUrl: `${site}/app/billing`,
  })
  redirect(checkoutUrl)
}

/** Client opens the provider billing portal (card updates, invoice history). */
export async function openBillingPortal(): Promise<void> {
  const me = await getMyClient()
  if (!me) return
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('stripe_customer_id').eq('id', me.id).maybeSingle()
  const customerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id
  if (!customerId) return
  const { url } = await getPaymentProvider().openBillingPortal(customerId)
  redirect(url)
}
