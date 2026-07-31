'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { getContentDays, getCrews, updateContentDay } from '@/lib/mock/api'
import { daysFromNow } from '@/lib/mock/dates'
import type { ContentDay, Crew } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

/** The current week, computed at runtime so the board is always live. */
const WEEK = Array.from({ length: 5 }, (_, i) => daysFromNow(i))

export default function CrewsPage() {
  const router = useRouter()
  const toast = useToast()
  const [crews, setCrews] = useState<Crew[] | null>(null)
  const [days, setDays] = useState<ContentDay[] | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  useEffect(() => {
    getCrews().then(setCrews)
    getContentDays().then(setDays)
  }, [])

  const weekDays = useMemo(() => days?.filter((d) => d.date !== null && WEEK.includes(d.date)) ?? [], [days])
  const unassigned = useMemo(
    () => days?.filter((d) => d.status === 'upcoming' && d.crew === null) ?? [],
    [days],
  )

  async function assign(dayId: string, crewId: string | null) {
    if (!days) return
    const day = days.find((d) => d.id === dayId)
    if (!day) return
    setDays(days.map((d) => (d.id === dayId ? { ...d, crew: crewId } : d)))
    await updateContentDay(dayId, { crew: crewId })
    toast(crewId ? `${day.city} assigned to ${crews?.find((c) => c.id === crewId)?.name ?? crewId}` : `${day.city} unassigned`)
  }

  if (crews === null || days === null) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <Card className="overflow-x-auto p-0 xl:col-span-3">
        <table className="w-full min-w-[640px] text-13">
          <thead>
            <tr className="border-b border-border text-12 text-faint">
              <th className="w-24 px-4 py-3 text-left font-normal">This week</th>
              {WEEK.map((d) => (
                <th key={d} className="px-3 py-3 text-left font-normal">{format(parseISO(d), 'EEE d')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crews.map((crew) => (
              <tr key={crew.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 align-top">
                  <p className="font-medium">{crew.name}</p>
                  <p className="text-12 text-faint">{crew.members.map((m) => m.name).join(', ')}</p>
                </td>
                {WEEK.map((date) => {
                  const cell = weekDays.filter((d) => d.date === date && d.crew === crew.id)
                  return (
                    <td
                      key={date}
                      className="h-20 min-w-28 px-2 py-2 align-top"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragging) void assign(dragging, crew.id)
                        setDragging(null)
                      }}
                    >
                      {cell.map((d) => (
                        <div
                          key={d.id}
                          draggable
                          onDragStart={() => setDragging(d.id)}
                          onClick={() => router.push(`/content-days/${d.id}`)}
                          className="cursor-grab rounded border border-border bg-raised px-2.5 py-1.5 transition hover:border-border-strong"
                        >
                          <p className="font-medium text-gold">{d.priceLabel}</p>
                          <p className="truncate text-12 text-dim">{d.city}</p>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (dragging) void assign(dragging, null)
          setDragging(null)
        }}
      >
        <CardTitle>Unassigned</CardTitle>
        {unassigned.length === 0 ? (
          <p className="mt-3 text-13 text-faint">Every content day has a crew</p>
        ) : (
          <div className="mt-3 space-y-2">
            {unassigned.map((d) => (
              <div
                key={d.id}
                draggable
                onDragStart={() => setDragging(d.id)}
                className={cn(
                  'cursor-grab rounded border border-danger/40 bg-danger/10 px-3 py-2 transition',
                  dragging === d.id && 'opacity-50',
                )}
              >
                <p className="text-13 font-medium">{d.priceLabel} · {d.city}</p>
                <p className="tnum text-12 text-dim">{d.date ? format(parseISO(d.date), 'EEE MMM d') : 'No date'} · {d.booked} booked</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-12 text-faint">Drag a card onto a crew row to assign it</p>
      </Card>
    </div>
  )
}
