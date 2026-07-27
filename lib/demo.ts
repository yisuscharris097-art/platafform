import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionUser } from '@/lib/auth'
import type { MyClient } from '@/lib/my-client'

/**
 * Demo mode: active while Supabase is not configured (no env vars). The
 * dashboard renders directly — no login — as a demo owner with empty data.
 * Setting NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY and
 * redeploying turns real auth back on automatically.
 */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export const DEMO_USER: SessionUser = {
  id: 'demo-user',
  email: 'demo@relaystudios.com',
  name: 'Relay Studios (demo)',
  role: 'owner',
}

export const DEMO_CLIENT: MyClient = {
  id: 'demo-client',
  slug: 'demo',
  display_name: 'Demo Agent',
  status: 'live',
  tier: 'signature',
}

interface StubResult {
  data: null
  count: number
  error: null
}

/**
 * Chainable no-op query builder: every method returns itself and awaiting it
 * resolves to an empty result, so `.select().eq().order()` chains of any shape
 * land on the pages' existing `?? []` / null empty states.
 */
function stubBuilder(): unknown {
  const result: StubResult = { data: null, count: 0, error: null }
  const target = () => undefined
  const proxy: unknown = new Proxy(target, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: StubResult) => unknown, reject?: (e: unknown) => unknown) =>
          Promise.resolve(result).then(resolve, reject)
      }
      return () => proxy
    },
    apply() {
      return proxy
    },
  })
  return proxy
}

export function createStubClient(): SupabaseClient {
  const client = {
    from: () => stubBuilder(),
    rpc: () => stubBuilder(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithOtp: async () => ({
        data: {},
        error: { message: 'Demo mode — connect Supabase to enable sign-in' },
      }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }),
    },
  }
  return client as unknown as SupabaseClient
}
