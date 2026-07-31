'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { NAV } from './nav'

const ALERTS = [
  { label: 'Wellington ($4.7M) has no crew assigned', href: '/content-days/cd5' },
  { label: 'Lake Worth ($6.5M) has no crew assigned', href: '/content-days/cd9' },
  { label: 'Host requirements missing — Hollywood', href: '/content-days/cd6' },
]

function titleFor(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  const all = NAV.flatMap((g) => g.items)
  const hit = all
    .filter((i) => i.href !== '/' && (pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return hit?.label ?? 'LuxeOS'
}

export function Topbar() {
  const pathname = usePathname()
  const [alertsOpen, setAlertsOpen] = useState(false)
  const alertsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!alertsOpen) return
    const h = (e: MouseEvent) => {
      if (!alertsRef.current?.contains(e.target as Node)) setAlertsOpen(false)
    }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [alertsOpen])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-bg/95 px-5 md:px-8">
      <h1 className="text-16 font-medium">{titleFor(pathname)}</h1>
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="ml-auto flex h-9 w-full max-w-xs items-center gap-2.5 rounded border border-border bg-surface px-3 text-13 text-faint transition hover:border-border-strong"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
        Search…
        <kbd className="ml-auto rounded border border-border px-1.5 text-12">⌘K</kbd>
      </button>
      <div className="relative" ref={alertsRef}>
        <button
          onClick={() => setAlertsOpen((o) => !o)}
          className="relative text-dim transition hover:text-text"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="tnum absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-12 font-medium text-bg">
            {ALERTS.length}
          </span>
        </button>
        {alertsOpen ? (
          <div className="absolute right-0 top-9 w-80 rounded-lg border border-border-strong bg-raised p-2">
            <p className="px-3 py-1.5 text-12 text-faint">Needs attention</p>
            {ALERTS.map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                onClick={() => setAlertsOpen(false)}
                className="block rounded px-3 py-2 text-13 text-dim transition hover:bg-gold-wash hover:text-text"
              >
                {a.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-raised text-12 font-medium">
        J
      </div>
    </header>
  )
}
