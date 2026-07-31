'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { NAV } from './nav'

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <span className="text-14 font-medium tracking-[0.18em] text-text">
            LUXE<span className="text-gold">OS</span>
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((group, gi) => (
            <div key={gi} className="mb-1 px-3 py-1.5">
              {group.label ? (
                <p className="mb-1 px-2 text-12 text-faint">{group.label}</p>
              ) : (
                <div className="mb-1 border-t border-border pt-2" />
              )}
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'mb-0.5 flex h-9 items-center gap-2.5 rounded border-l-2 px-2 text-13 transition',
                      active
                        ? 'border-gold bg-gold-wash text-gold'
                        : 'border-transparent text-dim hover:bg-raised hover:text-text',
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-3 text-12 text-faint">LuxeShots · South Florida</div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch justify-around border-t border-border bg-surface md:hidden">
        {NAV.flatMap((g) => g.items)
          .filter((i) => ['/', '/content-days', '/agents', '/field', '/lab'].includes(i.href))
          .map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-12',
                  active ? 'text-gold' : 'text-dim',
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label.split(' ')[0]}
              </Link>
            )
          })}
      </nav>
    </>
  )
}
