import { NextResponse, type NextRequest } from 'next/server'

/**
 * Nuclear fail-open. The Supabase session logic is loaded DYNAMICALLY inside
 * the try so that absolutely nothing — module-load failures in the Edge
 * runtime, bad env values, unreachable Supabase — can produce a site-wide
 * MIDDLEWARE_INVOCATION_FAILED. If the auth check cannot run, requests pass
 * through and the server-side layout gates (app/studio layouts) still protect
 * every page via getSessionUser().
 */
export async function middleware(request: NextRequest) {
  try {
    const { updateSession } = await import('./lib/supabase/middleware')
    return await updateSession(request)
  } catch (e) {
    console.error('[middleware] fatal — failing open:', e instanceof Error ? e.message : e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)'],
}
