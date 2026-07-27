'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error: string | null
}

const ruleSchema = z.object({
  revenue_kind: z.enum(['deposit', 'balance', 'care_monthly', 'renewal', 'change_order']),
  beneficiary_role: z.enum(['owner', 'partner', 'developer']),
  percent: z.coerce.number().min(0).max(100),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
})

/** Owner creates a rule version. RLS makes this owner-only; audit trigger logs it. */
export async function createRuleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = ruleSchema.safeParse({
    revenue_kind: formData.get('revenue_kind'),
    beneficiary_role: formData.get('beneficiary_role'),
    percent: formData.get('percent'),
    effective_from: formData.get('effective_from'),
    effective_to: formData.get('effective_to') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid rule' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase.from('commission_rules').insert({
    revenue_kind: parsed.data.revenue_kind,
    beneficiary_role: parsed.data.beneficiary_role,
    percent_bps: Math.round(parsed.data.percent * 100),
    effective_from: parsed.data.effective_from,
    effective_to: parsed.data.effective_to || null,
    created_by: user?.id ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/studio/commissions')
  return { error: null }
}

/** Versioning: closing a rule sets effective_to — history never mutates. */
export async function closeRuleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  if (typeof id !== 'string') return { error: 'Missing id' }
  const today = new Date().toISOString().slice(0, 10)
  const supabase = await createClient()
  const { error, data } = await supabase
    .from('commission_rules')
    .update({ effective_to: today })
    .eq('id', id)
    .is('effective_to', null)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed or already closed' }
  revalidatePath('/studio/commissions')
  return { error: null }
}

export async function markEntryPaid(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  if (typeof id !== 'string') return { error: 'Missing id' }
  const supabase = await createClient() // owner-only via RLS entries_owner_all
  const { error, data } = await supabase
    .from('commission_entries')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed' }
  revalidatePath('/studio/commissions/statements')
  return { error: null }
}
