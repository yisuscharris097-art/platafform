'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getContentDays } from '@/lib/mock/api'
import { isToday } from '@/lib/mock/dates'
import { crewName } from '@/lib/mock/crews'
import type { ContentDay } from '@/lib/mock/types'

export default function FieldHomePage() {
  const router = useRouter()
  const [days, setDays] = useState<ContentDay[] | null>(null)

  useEffect(() => {
    getContentDays().then(setDays)
  }, [])

  const upcoming = days?.filter((d) => d.status === 'upcoming') ?? null

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between py-2">
        <button onClick={() => router.push('/')} className="flex items-center gap-1 text-13 text-dim">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> LuxeOS
        </button>
        <span className="text-13 font-medium tracking-[0.18em]">FIELD</span>
      </header>

      <h1 className="mb-3 text-16 font-medium">Pick your shoot</h1>

      {upcoming === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((d) => (
            <button
              key={d.id}
              onClick={() => router.push(`/field/${d.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition hover:border-border-strong"
            >
              <div className="min-w-0 flex-1">
                <p className="text-14 font-medium">
                  <span className="text-gold">{d.priceLabel}</span> · {d.city}
                </p>
                <p className="truncate text-13 text-dim">{d.address}</p>
                <p className="tnum mt-1 text-12 text-faint">
                  {isToday(d.date) ? 'Today' : d.date ? format(parseISO(d.date), 'EEE MMM d') : 'No date'} · {d.booked} booked · {crewName(d.crew)}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-faint" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
