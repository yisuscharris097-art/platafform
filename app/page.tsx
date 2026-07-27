import { redirect } from 'next/navigation'
import { getSessionUser, isStaff } from '@/lib/auth'

export default async function Home() {
  const me = await getSessionUser()
  if (!me) redirect('/login')
  redirect(isStaff(me.role) ? '/studio' : '/app')
}
