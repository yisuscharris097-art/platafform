import { z } from 'zod'

export const CLIENT_TIERS = ['starter', 'signature', 'flagship'] as const
export const CLIENT_STATUSES = ['lead', 'onboarding', 'building', 'review', 'live', 'churned'] as const
export const HOST_TARGETS = ['vercel', 'cloudflare'] as const

export type ClientTier = (typeof CLIENT_TIERS)[number]
export type ClientStatus = (typeof CLIENT_STATUSES)[number]
export type HostTarget = (typeof HOST_TARGETS)[number]

export interface ClientRow {
  id: string
  slug: string
  display_name: string
  brokerage: string | null
  market: string | null
  tier: ClientTier
  status: ClientStatus
  host_target: HostTarget
  primary_domain: string | null
  launched_at: string | null
  sites: { last_published_at: string | null }[] | null
}

// Every write validates with zod before touching the database (brief §8).
export const clientInputSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes only'),
  display_name: z.string().min(2).max(120),
  brokerage: z.string().max(120).optional().or(z.literal('')),
  market: z.string().max(120).optional().or(z.literal('')),
  license_states: z.string().max(120).optional().or(z.literal('')), // comma-separated in the form
  tier: z.enum(CLIENT_TIERS),
  status: z.enum(CLIENT_STATUSES),
  host_target: z.enum(HOST_TARGETS),
  primary_domain: z.string().max(255).optional().or(z.literal('')),
})

export type ClientInput = z.infer<typeof clientInputSchema>

export function toClientRecord(input: ClientInput) {
  return {
    slug: input.slug,
    display_name: input.display_name,
    brokerage: input.brokerage || null,
    market: input.market || null,
    license_states: input.license_states
      ? input.license_states.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [],
    tier: input.tier,
    status: input.status,
    host_target: input.host_target,
    primary_domain: input.primary_domain || null,
  }
}
