import { createHmac, timingSafeEqual } from 'node:crypto'
import type { CheckoutInput, PaymentEvent, PaymentProvider, Subscription, SubscriptionInput } from '../types'

// Stripe adapter (Route A) — raw REST via fetch, form-encoded. Test mode first.
const API = 'https://api.stripe.com/v1'

function key(): string {
  const k = process.env.STRIPE_SECRET_KEY
  if (!k) throw new Error('STRIPE_SECRET_KEY is not set')
  return k
}

function form(params: Record<string, string | number | undefined>): string {
  const out: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) out.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return out.join('&')
}

async function stripePost(path: string, params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form(params),
  })
  const json = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const err = json.error as { message?: string } | undefined
    throw new Error(`Stripe ${path}: ${err?.message ?? res.status}`)
  }
  return json
}

/** Manual Stripe-Signature verification (t=..,v1=.. HMAC-SHA256 of `${t}.${payload}`). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const parts = new Map(header.split(',').map((p) => p.split('=') as [string, string]))
  const t = parts.get('t')
  const v1 = parts.get('v1')
  if (!t || !v1) return false
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
  } catch {
    return false
  }
}

interface StripeEvent {
  type: string
  data: { object: Record<string, unknown> }
}

export function createStripeProvider(): PaymentProvider {
  return {
    async createCheckout(input: CheckoutInput) {
      const session = await stripePost('/checkout/sessions', {
        mode: 'payment',
        'line_items[0][price_data][currency]': input.currency,
        'line_items[0][price_data][unit_amount]': input.amountCents,
        'line_items[0][price_data][product_data][name]': input.description,
        'line_items[0][quantity]': 1,
        customer_email: input.customerEmail ?? undefined,
        'metadata[invoice_id]': input.invoiceId,
        'metadata[client_id]': input.clientId,
        'payment_intent_data[metadata][invoice_id]': input.invoiceId,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      })
      return { url: String(session.url) }
    },

    async createSubscription(input: SubscriptionInput): Promise<Subscription> {
      const session = await stripePost('/checkout/sessions', {
        mode: 'subscription',
        'line_items[0][price_data][currency]': input.currency,
        'line_items[0][price_data][unit_amount]': input.amountCentsMonthly,
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][product_data][name]': input.planName,
        'line_items[0][quantity]': 1,
        customer_email: input.customerEmail ?? undefined,
        'metadata[client_id]': input.clientId,
        'subscription_data[metadata][client_id]': input.clientId,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      })
      return { checkoutUrl: String(session.url) }
    },

    async handleWebhook(req: Request): Promise<PaymentEvent[]> {
      const payload = await req.text()
      const secret = process.env.STRIPE_WEBHOOK_SECRET
      if (!secret) return [{ type: 'ignored', reason: 'no webhook secret configured' }]
      if (!verifyStripeSignature(payload, req.headers.get('stripe-signature'), secret)) {
        throw new Error('Invalid Stripe signature')
      }
      const event = JSON.parse(payload) as StripeEvent
      const obj = event.data.object

      if (event.type === 'checkout.session.completed') {
        const meta = (obj.metadata ?? {}) as Record<string, string>
        if (obj.mode === 'payment' && meta.invoice_id) {
          return [{ type: 'invoice_paid', invoiceId: meta.invoice_id, providerRef: String(obj.id) }]
        }
        return [{ type: 'ignored', reason: 'checkout without invoice metadata' }]
      }
      if (event.type === 'invoice.paid') {
        const lines = obj.lines as { data?: { metadata?: Record<string, string> }[] } | undefined
        const meta = ((obj.subscription_details as { metadata?: Record<string, string> } | undefined)?.metadata ??
          lines?.data?.[0]?.metadata ??
          {}) as Record<string, string>
        const clientId = meta.client_id
        if (clientId) {
          return [
            {
              type: 'care_payment_succeeded',
              clientId,
              amountCents: Number(obj.amount_paid ?? 0),
              currency: String(obj.currency ?? 'usd'),
              providerRef: String(obj.id),
              customerId: obj.customer ? String(obj.customer) : null,
            },
          ]
        }
        return [{ type: 'ignored', reason: 'invoice.paid without client metadata' }]
      }
      if (event.type === 'invoice.payment_failed') {
        const meta = ((obj.subscription_details as { metadata?: Record<string, string> } | undefined)?.metadata ?? {}) as Record<string, string>
        return [
          {
            type: 'care_payment_failed',
            clientId: meta.client_id ?? null,
            customerId: obj.customer ? String(obj.customer) : null,
          },
        ]
      }
      return [{ type: 'ignored', reason: event.type }]
    },

    async openBillingPortal(customerId: string) {
      const session = await stripePost('/billing_portal/sessions', {
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/app/billing`,
      })
      return { url: String(session.url) }
    },
  }
}
