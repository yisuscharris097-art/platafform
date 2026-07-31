'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Check, ChevronLeft, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { useToast } from '@/components/ui/toast'
import { getAgents, getContentDay, updateContentDay } from '@/lib/mock/api'
import { isToday } from '@/lib/mock/dates'
import { crewName, CREWS } from '@/lib/mock/crews'
import type { Agent, ContentDay } from '@/lib/mock/types'

const field = 'mt-1 h-9 w-full rounded border border-border bg-bg px-3 text-13 transition focus:border-border-strong'

interface Draft {
  address: string
  date: string
  startTime: string
}

interface Change {
  label: string
  from: string
  to: string
}

export default function ContentDayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const [day, setDay] = useState<ContentDay | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [draft, setDraft] = useState<Draft>({ address: '', date: '', startTime: '' })
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getContentDay(id).then((d) => {
      setDay(d)
      if (d) setDraft({ address: d.address, date: d.date ?? '', startTime: d.startTime })
    })
    getAgents().then(setAgents)
  }, [id])

  if (day === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const changes: Change[] = []
  if (draft.address.trim() !== day.address) changes.push({ label: 'Address', from: day.address, to: draft.address.trim() })
  if (draft.date !== (day.date ?? '')) {
    changes.push({
      label: 'Date',
      from: day.date ? format(parseISO(day.date), 'EEE MMM d, yyyy') : 'not set',
      to: draft.date ? format(parseISO(draft.date), 'EEE MMM d, yyyy') : 'not set',
    })
  }
  if (draft.startTime.trim() !== day.startTime) changes.push({ label: 'Start time', from: day.startTime, to: draft.startTime.trim() })

  const crew = CREWS.find((c) => c.id === day.crew)
  const booked = day.bookedAgentIds
    .map((aid) => agents.find((a) => a.id === aid))
    .filter((a): a is Agent => Boolean(a))
  const occupancy = Math.round((day.booked / day.capacity) * 100)

  function discard() {
    if (!day) return
    setDraft({ address: day.address, date: day.date ?? '', startTime: day.startTime })
  }

  async function save() {
    if (!day) return
    const summary = changes.map((c) => `${c.label.toLowerCase()} → ${c.to}`).join(', ')
    const notified = day.booked + (crew?.members.length ?? 0)
    const updated = await updateContentDay(day.id, {
      address: draft.address.trim(),
      date: draft.date === '' ? null : draft.date,
      startTime: draft.startTime.trim(),
      history: [
        {
          id: `h${day.history.length + 1}-${day.id}`,
          at: new Date().toISOString(),
          who: 'Joe',
          what: `Changed ${summary}`,
          notified,
        },
        ...day.history,
      ],
    })
    setDay(updated ? { ...updated } : day)
    setConfirming(false)
    toast(`Saved — ${day.booked} agents and ${crewName(day.crew)} notified`)
  }

  return (
    <div className="space-y-4">
      <button onClick={() => router.push('/content-days')} className="flex items-center gap-1 text-13 text-dim transition hover:text-text">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Content days
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-20 font-medium">
          <span className="text-gold">{day.priceLabel}</span> · {day.city}
        </h1>
        <StatusPill status={isToday(day.date) ? 'member' : day.status} label={isToday(day.date) ? 'in progress' : day.status} />
        <span className="tnum ml-auto text-13 text-dim">
          {day.date ? `${format(parseISO(day.date), 'EEEE, MMMM d, yyyy')} · ${day.startTime}` : 'No date set'}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Property and schedule</CardTitle>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-12 text-faint" htmlFor="address">Address</label>
              <input id="address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className={field} />
            </div>
            <div>
              <label className="text-12 text-faint" htmlFor="date">Date</label>
              <input id="date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={field} />
            </div>
            <div>
              <label className="text-12 text-faint" htmlFor="time">Start time</label>
              <input id="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} className={field} />
            </div>
          </div>
          {changes.length > 0 ? (
            <div className="mt-4 flex items-center gap-2 rounded border border-warn/40 bg-warn/10 px-3 py-2.5">
              <p className="flex-1 text-13 text-warn">
                {changes.length === 1 ? '1 unsaved change' : `${changes.length} unsaved changes`} — nothing is sent until you review
              </p>
              <Button variant="ghost" size="sm" onClick={discard}>Discard</Button>
              <Button variant="primary" size="sm" onClick={() => setConfirming(true)}>Review and save</Button>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="flex items-center justify-between text-13">
              <span className="text-dim">Occupancy</span>
              <span className="tnum">{day.booked} / {day.capacity} · {occupancy}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-gold" style={{ width: `${occupancy}%` }} />
            </div>
          </div>

          <div className="mt-6">
            <CardTitle>Booked agents</CardTitle>
            {booked.length === 0 ? (
              <p className="mt-2 text-13 text-faint">No bookings yet</p>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {booked.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => router.push(`/agents/${a.id}`)}
                    className="flex cursor-pointer items-center gap-3 py-2.5 transition hover:bg-raised"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-raised text-12">
                      {a.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </span>
                    <span className="text-13">{a.name}</span>
                    <span className="hidden text-12 text-faint sm:inline">{a.brokerage}</span>
                    <StatusPill className="ml-auto" status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Crew</CardTitle>
            <p className="mt-2 text-14">{crewName(day.crew)}</p>
            {crew ? (
              <ul className="mt-2 space-y-1">
                {crew.members.map((m) => (
                  <li key={m.name + m.role} className="flex justify-between text-12">
                    <span className="text-dim">{m.name}</span>
                    <span className="text-faint">{m.role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-12 text-danger">Needs assignment — see the crews board</p>
            )}
          </Card>

          <Card>
            <CardTitle>Host requirements</CardTitle>
            <ul className="mt-2 space-y-2">
              {day.hostRequirements.map((r, i) => (
                <li key={r.label}>
                  <button
                    onClick={() => {
                      const next = day.hostRequirements.map((x, j) => (j === i ? { ...x, done: !x.done } : x))
                      setDay({ ...day, hostRequirements: next })
                      void updateContentDay(day.id, { hostRequirements: next })
                      toast(r.done ? `Unchecked “${r.label}”` : `“${r.label}” marked done`)
                    }}
                    className="flex w-full items-center gap-2.5 text-left text-13 text-dim transition hover:text-text"
                  >
                    {r.done ? (
                      <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.5} />
                    )}
                    <span className={r.done ? 'line-through opacity-60' : ''}>{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle>Change history</CardTitle>
            <ul className="mt-2 space-y-3">
              {day.history.map((h) => (
                <li key={h.id} className="border-l border-border pl-3">
                  <p className="text-13">{h.what}</p>
                  <p className="tnum mt-0.5 text-12 text-faint">
                    {h.who} · {format(parseISO(h.at), 'MMM d, h:mm a')}
                    {h.notified > 0 ? ` · ${h.notified} notified` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Review before sending">
        <div className="space-y-2">
          {changes.map((c) => (
            <div key={c.label} className="rounded border border-border bg-bg px-3 py-2">
              <p className="text-12 text-faint">{c.label}</p>
              <p className="text-13"><span className="text-faint line-through">{c.from}</span></p>
              <p className="text-13 text-text">{c.to}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded border border-warn/40 bg-warn/10 p-3 text-13 text-dim">
          <p>
            Saving will immediately notify{' '}
            <span className="font-medium text-text">{day.booked} booked agents</span> by text and email
            {crew ? (
              <>
                {' '}and re-route <span className="font-medium text-text">{crew.name} ({crew.members.length} people)</span>
              </>
            ) : null}
            . The host will be asked to confirm access{draft.date !== (day.date ?? '') ? ' for the new date' : ''}.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>Keep editing</Button>
          <Button variant="primary" onClick={() => void save()}>Save and notify {day.booked + (crew?.members.length ?? 0)} people</Button>
        </div>
      </Modal>
    </div>
  )
}
