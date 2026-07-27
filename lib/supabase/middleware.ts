import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/app', '/studio']

/**
 * Zero-dependency auth gate. The Edge runtime cannot run @supabase/supabase-js
 * (its node-fetch dependency references __dirname → MIDDLEWARE_INVOCATION_FAILED
 * on every request), so this only checks for the presence of the Supabase auth
 * cookie and redirects unauthenticated visitors to /login. Real session
 * verification happens server-side in the layouts (getSessionUser) and in RLS —
 * a forged cookie gets past this redirect but sees no data and is bounced by
 * the layout.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  if (!isProtected) return NextResponse.next({ request })

  // @supabase/ssr stores the session as sb-<project-ref>-auth-token (may be
  // chunked into .0/.1 suffixes). Presence = probably signed in.
  const hasSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'))

  if (!hasSessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }
  return NextResponse.next({ request })
}
