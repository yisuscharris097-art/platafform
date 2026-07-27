import { z } from 'zod'

export const SECTION_KINDS = [
  'hero', 'listings', 'about', 'areas', 'testimonials', 'faq', 'journal', 'valuation', 'contact',
] as const
export type SectionKind = (typeof SECTION_KINDS)[number]

/** Flagship-only sections. The gate is enforced server-side (brief §6). */
export const FLAGSHIP_ONLY: readonly SectionKind[] = ['journal', 'valuation'] as const

export interface SectionRow {
  id: string
  site_id: string
  kind: SectionKind
  position: number
  enabled: boolean
  content: Record<string, unknown>
  draft: Record<string, unknown> | null
  draft_updated_at: string | null
}

export interface CmsField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'image'
}

export const SECTION_FIELDS: Record<SectionKind, { title: string; fields: CmsField[] }> = {
  hero: {
    title: 'Hero',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'subheading', label: 'Subheading', type: 'text' },
      { name: 'image', label: 'Background image', type: 'image' },
    ],
  },
  listings: { title: 'Listings', fields: [{ name: 'heading', label: 'Section heading', type: 'text' }] },
  about: {
    title: 'About',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Body', type: 'textarea' },
      { name: 'portrait', label: 'Portrait', type: 'image' },
    ],
  },
  areas: {
    title: 'Areas',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'areas', label: 'Areas (one per line)', type: 'textarea' },
    ],
  },
  testimonials: {
    title: 'Testimonials',
    fields: [{ name: 'items', label: 'Testimonials (one per line)', type: 'textarea' }],
  },
  faq: { title: 'FAQ', fields: [{ name: 'items', label: 'Q&A (question | answer per line)', type: 'textarea' }] },
  journal: {
    title: 'Journal (Flagship)',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'intro', label: 'Intro', type: 'textarea' },
    ],
  },
  valuation: {
    title: 'Home valuation (Flagship)',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'body', label: 'Pitch', type: 'textarea' },
    ],
  },
  contact: {
    title: 'Contact',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'calendly_note', label: 'Booking note', type: 'text' },
    ],
  },
}

export const sectionPayloadSchema = z.record(z.string(), z.string())

export const listingSchema = z.object({
  address: z.string().min(3).max(200),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(20).optional().or(z.literal('')),
  price_cents: z.coerce.number().int().min(0).nullable().optional(),
  beds: z.coerce.number().min(0).max(50).nullable().optional(),
  baths: z.coerce.number().min(0).max(50).nullable().optional(),
  sqft: z.coerce.number().int().min(0).nullable().optional(),
  status: z.enum(['active', 'pending', 'sold']),
  mls_id: z.string().max(50).optional().or(z.literal('')),
})

export const INTEGRATION_PROVIDERS = ['ga4', 'meta_pixel', 'gtm', 'calendly'] as const
export const integrationSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  value: z.string().max(500),
  enabled: z.boolean(),
})

/** Fields changed between live content and draft — the pre-publish diff. */
export function diffSection(content: Record<string, unknown>, draft: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(content), ...Object.keys(draft)])
  return Array.from(keys).filter((k) => String(content[k] ?? '') !== String(draft[k] ?? ''))
}
