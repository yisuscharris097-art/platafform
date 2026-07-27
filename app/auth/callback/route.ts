import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isStaff, getSessionUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next && next.startsWith('/')) return NextResponse.redirect(`${origin}${next}`)
      const me = await getSessionUser()
      const dest = me && isStaff(me.role) ? '/studio' : '/app'
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
