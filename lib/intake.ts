import { z } from 'zod'

export const INTAKE_BLOCKS = ['details', 'brand', 'content', 'photos'] as const
export type IntakeBlockKind = (typeof INTAKE_BLOCKS)[number]
export type IntakeStatus = 'pending' | 'submitted' | 'validated' | 'rejected'

export interface IntakeBlockRow {
  id: string
  client_id: string
  block: IntakeBlockKind
  status: IntakeStatus
  payload: Record<string, unknown>
  validated_at: string | null
}

export interface IntakeField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'color' | 'files'
  required?: boolean
}

export const INTAKE_FIELDS: Record<IntakeBlockKind, { title: string; hint: string; fields: IntakeField[] }> = {
  details: {
    title: 'Agent details',
    hint: 'Who you are and where you operate.',
    fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'public_email', label: 'Public email', type: 'text', required: true },
      { name: 'brokerage', label: 'Brokerage', type: 'text' },
      { name: 'license_states', label: 'License states (comma-separated)', type: 'text' },
      { name: 'market', label: 'Primary market', type: 'text', required: true },
    ],
  },
  brand: {
    title: 'Brand',
    hint: 'Colors, logo and social handles.',
    fields: [
      { name: 'primary_color', label: 'Primary color', type: 'color' },
      { name: 'accent_color', label: 'Accent color', type: 'color' },
      { name: 'instagram', label: 'Instagram handle', type: 'text' },
      { name: 'logo', label: 'Logo files', type: 'files' },
    ],
  },
  content: {
    title: 'Content',
    hint: 'Your story in your words — we polish it.',
    fields: [
      { name: 'bio', label: 'About you / bio', type: 'textarea', required: true },
      { name: 'areas', label: 'Areas you serve (one per line)', type: 'textarea' },
      { name: 'testimonials', label: 'Testimonials (one per line)', type: 'textarea' },
    ],
  },
  photos: {
    title: 'Photos',
    hint: 'Headshot + any property photography you own.',
    fields: [{ name: 'uploads', label: 'Photos', type: 'files', required: true }],
  },
}

export const intakePayloadSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]))
