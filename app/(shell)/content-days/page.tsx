'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import { TableSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getContentDays } from '@/lib/mock/api'
import { crewName } from '@/lib/mock/crews'
import type { ContentDay, ContentDayStatus } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

const FILTERS: Array<{ label: string; value: ContentDayStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
  { label: 'Drafts', value: 'draft' },
]

export default function ContentDaysPage() {
  const router = useRouter()
  const [days, setDays] = useState<ContentDay[] | null>(null)
  const [filter, setFilter] = useState<ContentDayStatus | 'all'>('all')

  useEffect(() => {
    getContentDays().then(setDays)
  }, [])

  const rows = useMemo(() => {
    if (!days) return null
    const filtered = filter === 'all' ? days : days.filter((d) => d.status === filter)
    // Soonest first — upcoming ascending, then drafts, completed last.
    const order: Record<ContentDayStatus, number> = { upcoming: 0, draft: 1, completed: 2 }
    return [...filtered].sort((a, b) => order[a.status] - order[b.status] || a.date.localeCompare(b.date))
  }, [days, filter])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'h-8 rounded-full border px-3.5 text-13 transition',
              filter === f.value
                ? 'border-gold bg-gold-wash text-gold'
                : 'border-border text-dim hover:border-border-strong hover:text-text',
            )}
          >
            {f.label}
          </button>
        ))}
        <Button variant="primary" size="sm" className="ml-auto" onClick={() => router.push('/content-days/new')}>
          New content day
        </Button>
      </div>

      {rows === null ? (
        <TableSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarDays} message="No content days match this filter" actionLabel="Show all" onAction={() => setFilter('all')} />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <Th>Date</Th>
              <Th>Property</Th>
              <Th>City</Th>
              <Th>Capacity</Th>
              <Th>Crew</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {rows.map((d) => (
                <Tr key={d.id} onClick={() => router.push(`/content-days/${d.id}`)}>
                  <Td className="tnum text-dim">{format(parseISO(d.date), 'MMM d, yyyy')}</Td>
                  <Td>
                    <span className="font-medium text-gold">{d.priceLabel}</span>
                    <span className="ml-2 hidden text-dim lg:inline">{d.address}</span>
                  </Td>
                  <Td>{d.city}</Td>
                  <Td className="tnum">{d.booked} / {d.capacity}</Td>
                  <Td className="text-dim">{crewName(d.crew)}</Td>
                  <Td><StatusPill status={d.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  )
}
