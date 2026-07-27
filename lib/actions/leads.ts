'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionState {
  error: string | null
}

export async function markLeadRead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  if (typeof id !== 'string') return { error: 'Missing id' }
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ read_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/leads')
  return { error: null }
}
