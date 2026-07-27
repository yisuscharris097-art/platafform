import type { PaymentProvider } from './types'
import { createStripeProvider } from './stripe'

/**
 * Route A (US entity → Stripe) is the default. When Route B (merchant of
 * record) lands, add its adapter under lib/payments/<provider>/ and switch
 * here via PAYMENT_PROVIDER — a config change, not a rewrite (brief §5).
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? 'stripe'
  switch (provider) {
    case 'stripe':
      return createStripeProvider()
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`)
  }
}
