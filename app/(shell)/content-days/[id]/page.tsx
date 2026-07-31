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
import { crewName } from '@/lib/mock/crews'
import type { Agent, ContentDay } from '@/lib/mock/types'

export default function ContentDayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const [day, setDay] = useState<ContentDay | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [addressDraft, setAddressDraft] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getContentDay(id).then((d) => {
      setDay(d)
      if (d) setAddressDraft(d.address)
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

  const booked = day.bookedAgentIds
    .map((aid) => agents.find((a) => a.id === aid))
    .filter((a): a is Agent => Boolean(a))
  const occupancy = Math.round((day.booked / day.capacity) * 100)
  const addressChanged = addressDraft.trim() !== day.address

  async function saveAddress() {
    if (!day) return
    const updated = await updateContentDay(day.id, {
      address: addressDraft.trim(),
      history: [
        {
          id: `h${Date.now()}`,
          at: new Date().toISOString(),
          who: 'Joe',
          what: `Address changed to ${addressDraft.trim()}`,
          notified: day.booked + 1,
        },
        ...day.history,
      ],
    })
    setDay(updated ? { ...updated } : day)
    setConfirming(false)
    toast(`Address updated — ${day.booked} agents and ${crewName(day.crew)} notified`)
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
        <StatusPill status={day.status} />
        <span className="tnum ml-auto text-13 text-dim">{format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Property</CardTitle>
          <label className="mt-3 block text-12 text-faint" htmlFor="address">Address</label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              id="address"
              value={addressDraft}
              onChange={(e) => setAddressDraft(e.target.value)}
              className="h-9 flex-1 rounded border border-border bg-bg px-3 text-13 transition focus:border-border-strong"
            />
            <Button variant="primary" size="md" disabled={!addressChanged} onClick={() => setConfirming(true)}>
              Save address
            </Button>
          </div>

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
                    <span className="text-12 text-faint">{a.brokerage}</span>
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
            {!day.crew ? <p className="mt-1 text-12 text-danger">Needs assignment — see the crews board</p> : null}
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

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Confirm address change">
        <p className="text-13 text-dim">
          Changing the address will notify <span className="font-medium text-text">{day.booked} booked agents</span> and{' '}
          <span className="font-medium text-text">{crewName(day.crew)}</span> immediately.
        </p>
        <p className="mt-3 rounded border border-border bg-bg px-3 py-2 text-13">{addressDraft.trim()}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => void saveAddress()}>Save and notify</Button>
        </div>
      </Modal>
    </div>
  )
}
