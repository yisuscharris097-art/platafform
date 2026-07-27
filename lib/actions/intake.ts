'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { intakePayloadSchema } from '@/lib/intake'

export interface ActionState {
  error: string | null
  ok?: boolean
}

/** Client submits a block: payload + status → submitted. RLS blocks self-validation. */
export async function submitIntakeBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blockId = formData.get('block_id')
  const raw = formData.get('payload')
  if (typeof blockId !== 'string' || typeof raw !== 'string') return { error: 'Malformed submission' }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return { error: 'Malformed payload' }
  }
  const parsed = intakePayloadSchema.safeParse(payload)
  if (!parsed.success) return { error: 'Invalid payload fields' }

  const supabase = await createClient()
  const { error, data } = await supabase
    .from('intake_blocks')
    .update({ payload: parsed.data, status: 'submitted' })
    .eq('id', blockId)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed' }

  revalidatePath('/app/onboarding')
  return { error: null, ok: true }
}

/** Staff validates or rejects a submitted block. */
export async function reviewIntakeBlock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blockId = formData.get('block_id')
  const decision = formData.get('decision')
  if (typeof blockId !== 'string' || (decision !== 'validated' && decision !== 'rejected')) {
    return { error: 'Malformed review' }
  }
  const supabase = await createClient()
  const { error, data } = await supabase
    .from('intake_blocks')
    .update({ status: decision, validated_at: decision === 'validated' ? new Date().toISOString() : null })
    .eq('id', blockId)
    .select('id, client_id')
  if (error) return { error: error.message }
  const row = data?.[0] as { client_id: string } | undefined
  if (!row) return { error: 'Not allowed (staff only)' }

  revalidatePath(`/studio/clients/${row.client_id}/intake`)
  return { error: null, ok: true }
}
