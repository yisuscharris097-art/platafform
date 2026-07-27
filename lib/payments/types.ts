// Payment layer interface (brief §5). The operating entity is not settled, so
// the provider is a CONFIG CHANGE, not a rewrite:
//   Route A — US entity → Stripe adapter (implemented)
//   Route B — no US entity → merchant of record (Paddle / Lemon Squeezy) adapter
// Every provider-specific type stays inside lib/payments/<provider>/.

export interface CheckoutInput {
  invoiceId: string
  clientId: string
  customerEmail: string | null
  description: string
  amountCents: number
  currency: string
  successUrl: string
  cancelUrl: string
}

export interface SubscriptionInput {
  clientId: string
  customerEmail: string | null
  planName: string
  amountCentsMonthly: number
  currency: string
  successUrl: string
  cancelUrl: string
}

export interface Subscription {
  checkoutUrl: string
}

export type PaymentEvent =
  | { type: 'invoice_paid'; invoiceId: string; providerRef: string }
  | { type: 'care_payment_succeeded'; clientId: string; amountCents: number; currency: string; providerRef: string; customerId: string | null }
  | { type: 'care_payment_failed'; clientId: string | null; customerId: string | null }
  | { type: 'ignored'; reason: string }

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<{ url: string }>
  createSubscription(input: SubscriptionInput): Promise<Subscription>
  handleWebhook(req: Request): Promise<PaymentEvent[]>
  openBillingPortal(customerId: string): Promise<{ url: string }>
}
