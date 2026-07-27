import { type NextRequest } from 'next/server'
// Relative import on purpose: Vercel's Edge bundler resolves middleware
// separately from the app and chokes on tsconfig path aliases here.
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
