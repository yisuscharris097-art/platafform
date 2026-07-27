'use client'
import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setState('sending')
    const supabase = createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    })
    setState(error ? 'error' : 'sent')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Relay Studios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with a magic link — no password to remember.
        </p>

        {state === 'sent' ? (
          <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-foreground">
            Check your inbox — we sent a sign-in link to <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={sendLink} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brokerage.com"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {state === 'error' && (
              <p className="text-sm text-red-600">Could not send the link. Try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}
