import { createClient } from '@/lib/supabase/server'

export type Role = 'owner' | 'partner' | 'developer' | 'client'

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: Role
}

/** Auth'd user + their app profile row, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Without Supabase configured the whole app runs in demo mode as an owner.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { DEMO_USER } = await import('@/lib/demo')
    return DEMO_USER
  }
  // Fail-open to "not signed in": with missing/broken Supabase config the
  // pages redirect to /login instead of 500ing.
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('users').select('id, email, name, role').eq('id', user.id).single()
    if (!data) return null
    return data as SessionUser
  } catch (e) {
    console.error('[auth] getSessionUser failed:', e instanceof Error ? e.message : e)
    return null
  }
}

export function isStaff(role: Role): boolean {
  return role === 'owner' || role === 'partner' || role === 'developer'
}
