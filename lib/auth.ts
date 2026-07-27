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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id, email, name, role').eq('id', user.id).single()
  if (!data) return null
  return data as SessionUser
}

export function isStaff(role: Role): boolean {
  return role === 'owner' || role === 'partner' || role === 'developer'
}
