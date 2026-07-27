import { createClient } from '@/lib/supabase/server'

export interface MyClient {
  id: string
  slug: string
  display_name: string
  status: string
  tier: 'starter' | 'signature' | 'flagship'
}

/** The client row linked to the signed-in agent (portal_user_id), or null. */
export async function getMyClient(): Promise<MyClient | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { DEMO_CLIENT } = await import('@/lib/demo')
    return DEMO_CLIENT
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('clients')
    .select('id, slug, display_name, status, tier')
    .eq('portal_user_id', user.id)
    .maybeSingle()
  return (data as MyClient | null) ?? null
}
