import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser, isStaff } from '@/lib/auth'

// Studio surface — staff only. The gate is server-side AND backed by RLS:
// even if this layout were bypassed, a 'client' session reads nothing here.
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionUser()
  if (!me) redirect('/login')
  if (!isStaff(me.role)) redirect('/app')

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-wide">RELAY · STUDIO</span>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/studio" className="hover:text-foreground">Clients</Link>
            <Link href="/studio/pipeline" className="hover:text-foreground">Pipeline</Link>
            {me.role !== 'client' && <Link href="/studio/commissions/statements" className="hover:text-foreground">Commissions</Link>}
            {me.role === 'owner' && <Link href="/studio/commissions" className="hover:text-foreground">Rules</Link>}
            <Link href="/studio/surveys" className="hover:text-foreground">Surveys</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Sign out ({me.role})
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  )
}
