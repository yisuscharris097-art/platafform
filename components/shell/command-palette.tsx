'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Search, ShoppingBag, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AGENTS } from '@/lib/mock/agents'
import { CONTENT_DAYS } from '@/lib/mock/content-days'
import { ORDERS } from '@/lib/mock/orders'

interface Result {
  type: 'Agents' | 'Content days' | 'Orders'
  label: string
  sub: string
  href: string
}

function search(q: string): Result[] {
  const needle = q.toLowerCase()
  const agents: Result[] = AGENTS.filter(
    (a) => a.name.toLowerCase().includes(needle) || a.email.toLowerCase().includes(needle),
  )
    .slice(0, 5)
    .map((a) => ({ type: 'Agents', label: a.name, sub: a.brokerage, href: `/agents/${a.id}` }))
  const days: Result[] = CONTENT_DAYS.filter(
    (d) => d.address.toLowerCase().includes(needle) || d.city.toLowerCase().includes(needle),
  )
    .slice(0, 5)
    .map((d) => ({ type: 'Content days', label: d.address, sub: `${d.date} · ${d.priceLabel}`, href: `/content-days/${d.id}` }))
  const orders: Result[] = ORDERS.filter(
    (o) => o.agentName.toLowerCase().includes(needle) || o.item.toLowerCase().includes(needle),
  )
    .slice(0, 4)
    .map((o) => ({ type: 'Orders', label: `${o.agentName} — ${o.item}`, sub: `$${o.amount} · ${o.date}`, href: '/orders' }))
  return [...agents, ...days, ...orders]
}

const ICONS = { Agents: UserRound, 'Content days': CalendarDays, Orders: ShoppingBag }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const results = useMemo(() => (query.trim() ? search(query.trim()) : []), [query])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setIndex(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const go = useCallback(
    (r: Result) => {
      setOpen(false)
      router.push(r.href)
    },
    [router],
  )

  if (!open) return null

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    ;(acc[r.type] ??= []).push(r)
    return acc
  }, {})
  let flat = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-bg/80" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border-strong bg-raised">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 text-faint" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(i + 1, results.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(i - 1, 0))
              }
              if (e.key === 'Enter' && results[index]) go(results[index])
            }}
            placeholder="Search agents, content days, orders…"
            className="h-12 flex-1 bg-transparent text-14 outline-none"
          />
          <kbd className="rounded border border-border px-1.5 text-12 text-faint">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <p className="px-3 py-6 text-center text-13 text-faint">Type to search across the operation</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-13 text-faint">No matches for “{query}”</p>
          ) : (
            Object.entries(grouped).map(([type, rows]) => {
              const Icon = ICONS[type as keyof typeof ICONS]
              return (
                <div key={type} className="mb-1">
                  <p className="px-3 py-1.5 text-12 text-faint">{type}</p>
                  {rows.map((r) => {
                    flat++
                    const i = flat
                    return (
                      <button
                        key={`${r.href}${r.label}`}
                        onClick={() => go(r)}
                        onMouseEnter={() => setIndex(i)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-13',
                          i === index ? 'bg-gold-wash text-text' : 'text-dim',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.5} />
                        <span className="truncate">{r.label}</span>
                        <span className="ml-auto shrink-0 text-12 text-faint">{r.sub}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
