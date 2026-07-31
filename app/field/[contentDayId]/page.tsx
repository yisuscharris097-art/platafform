'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, Undo2, Wifi, WifiOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { useToast } from '@/components/ui/toast'
import { getContentDay, getRoster, setAttendance } from '@/lib/mock/api'
import { crewName } from '@/lib/mock/crews'
import type { AttendanceStatus, ContentDay, RosterEntry } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

interface Undoable {
  agentId: string
  previous: AttendanceStatus
  expires: number
}

export default function FieldDayPage({ params }: { params: Promise<{ contentDayId: string }> }) {
  const { contentDayId } = use(params)
  const router = useRouter()
  const toast = useToast()
  const [day, setDay] = useState<ContentDay | null>(null)
  const [roster, setRoster] = useState<RosterEntry[] | null>(null)
  const [offline, setOffline] = useState(false)
  const [queued, setQueued] = useState(0)
  const [undoable, setUndoable] = useState<Undoable | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getContentDay(contentDayId).then(setDay)
    getRoster(contentDayId).then(setRoster)
  }, [contentDayId])

  function mark(agentId: string, next: AttendanceStatus) {
    if (!roster) return
    const entry = roster.find((r) => r.agentId === agentId)
    if (!entry) return
    const previous = entry.attendance
    setRoster(roster.map((r) => (r.agentId === agentId ? { ...r, attendance: next } : r)))
    if (offline) setQueued((q) => q + 1)
    else void setAttendance(contentDayId, agentId, next)

    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoable({ agentId, previous, expires: Date.now() + 10_000 })
    undoTimer.current = setTimeout(() => setUndoable(null), 10_000)
  }

  function undo() {
    if (!undoable || !roster) return
    setRoster(roster.map((r) => (r.agentId === undoable.agentId ? { ...r, attendance: undoable.previous } : r)))
    if (!offline) void setAttendance(contentDayId, undoable.agentId, undoable.previous)
    setUndoable(null)
    toast('Reverted')
  }

  const checkedIn = roster?.filter((r) => r.attendance === 'checked-in').length ?? 0

  return (
    <div className="p-4 pb-24">
      <header className="mb-4 space-y-2 py-2">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/field')} className="flex items-center gap-1 text-13 text-dim">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Shoots
          </button>
          <button
            onClick={() => {
              setOffline((o) => {
                if (o && queued > 0) {
                  toast(`${queued} queued changes synced`)
                  setQueued(0)
                }
                return !o
              })
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-12 transition',
              offline ? 'border-warn/40 bg-warn/10 text-warn' : 'border-border text-faint',
            )}
          >
            {offline ? <WifiOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Wifi className="h-3.5 w-3.5" strokeWidth={1.5} />}
            {offline ? (queued > 0 ? `offline · ${queued} queued` : 'offline') : 'online'}
          </button>
        </div>
        {day ? (
          <div>
            <p className="text-16 font-medium">
              <span className="text-gold">{day.priceLabel}</span> · {day.city}
            </p>
            <p className="text-13 text-dim">{day.address}</p>
            <p className="tnum mt-0.5 text-12 text-faint">
              {day.date ? format(parseISO(day.date), 'EEEE MMM d') : 'No date'} · {crewName(day.crew)} · {checkedIn}/{roster?.length ?? 0} in
            </p>
          </div>
        ) : (
          <Skeleton className="h-12 w-3/4" />
        )}
      </header>

      {roster === null ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {roster.map((r) => (
            <div
              key={r.agentId}
              className={cn(
                'rounded-lg border bg-surface p-4 transition',
                r.attendance === 'checked-in' && 'border-success/40',
                r.attendance === 'no-show' && 'border-danger/40 opacity-70',
                r.attendance === 'booked' && 'border-border',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-16 font-medium">{r.agentName}</p>
                  <p className="tnum text-13 text-dim">{r.slot}</p>
                </div>
                <StatusPill
                  status={r.attendance === 'booked' ? (r.computed === 'member' ? 'member' : 'pending') : r.attendance}
                  label={r.attendance === 'booked' ? r.computed : r.attendance}
                />
              </div>
              {r.attendance === 'booked' ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => mark(r.agentId, 'checked-in')}
                    className="h-12 rounded border border-success/40 bg-success/10 text-14 font-medium text-success transition active:scale-[0.98]"
                  >
                    Check in
                  </button>
                  <button
                    onClick={() => mark(r.agentId, 'no-show')}
                    className="h-12 rounded border border-danger/40 bg-danger/10 text-14 font-medium text-danger transition active:scale-[0.98]"
                  >
                    No show
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {undoable ? (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-3 rounded-full border border-border-strong bg-raised px-4 py-2.5">
          <span className="text-13 text-dim">Marked</span>
          <button onClick={undo} className="flex items-center gap-1.5 text-13 font-medium text-gold">
            <Undo2 className="h-4 w-4" strokeWidth={1.5} /> Undo
          </button>
        </div>
      ) : null}
    </div>
  )
}
