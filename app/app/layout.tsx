import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'

export default async function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser()
  if (!me) redirect('/login')

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-wide">RELAY STUDIOS</span>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground">Dashboard</Link>
            <Link href="/app/site" className="hover:text-foreground">My site</Link>
            <Link href="/app/onboarding" className="hover:text-foreground">Onboarding</Link>
            <Link href="/app/leads" className="hover:text-foreground">Leads</Link>
            <Link href="/app/billing" className="hover:text-foreground">Billing</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Sign out ({me.email})
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  )
}
