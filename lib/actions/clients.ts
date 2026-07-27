'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { clientInputSchema, toClientRecord } from '@/lib/clients'

export interface ActionState {
  error: string | null
}

function parseForm(formData: FormData) {
  return clientInputSchema.safeParse({
    slug: formData.get('slug'),
    display_name: formData.get('display_name'),
    brokerage: formData.get('brokerage') ?? '',
    market: formData.get('market') ?? '',
    license_states: formData.get('license_states') ?? '',
    tier: formData.get('tier'),
    status: formData.get('status'),
    host_target: formData.get('host_target'),
    primary_domain: formData.get('primary_domain') ?? '',
  })
}

export async function createClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  // RLS enforces owner/developer here; the error surfaces if a partner tries.
  const { error } = await supabase.from('clients').insert(toClientRecord(parsed.data))
  if (error) return { error: error.message }

  revalidatePath('/studio')
  redirect('/studio')
}

export async function updateClientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  if (typeof id !== 'string' || id.length === 0) return { error: 'Missing client id' }
  const parsed = parseForm(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createClient()
  const { error, data } = await supabase
    .from('clients')
    .update(toClientRecord(parsed.data))
    .eq('id', id)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed (RLS) or client not found' }

  revalidatePath('/studio')
  redirect('/studio')
}
