import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED_PREFIXES = ['/app', '/studio']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Without Supabase env vars the whole site would 500 on every route
  // (MIDDLEWARE_INVOCATION_FAILED). Degrade gracefully instead: let requests
  // through with the auth gate disabled and a loud server-side log.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[middleware] Supabase env vars missing — auth gate disabled')
    return response
  }

  // Fail-open on ANY error (bad env values, unreachable Supabase, transient
  // fetch failures): a broken auth check must never take the whole site down.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
    if (isProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
    return response
  } catch (e) {
    console.error('[middleware] auth check failed — letting request through:', e instanceof Error ? e.message : e)
    return response
  }
}
