'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CalendarDays, ChevronLeft, Image, ShoppingBag, Star } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { getAgent, getContentDays, getOrders } from '@/lib/mock/api'
import type { Agent, ContentDay, Order } from '@/lib/mock/types'

interface TimelineItem {
  icon: typeof CalendarDays
  label: string
  sub: string
  date: string
}

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [days, setDays] = useState<ContentDay[]>([])

  useEffect(() => {
    getAgent(id).then(setAgent)
    getOrders().then(setOrders)
    getContentDays().then(setDays)
  }, [id])

  if (agent === null) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
    )
  }

  const myOrders = orders.filter((o) => o.agentId === agent.id)
  const myDays = days.filter((d) => d.bookedAgentIds.includes(agent.id))
  const usedThisPeriod = myDays.find((d) => d.status === 'upcoming' && d.date.startsWith('2026-08'))

  const timeline: TimelineItem[] = [
    ...myDays.map((d) => ({
      icon: CalendarDays,
      label: `${d.status === 'completed' ? 'Attended' : 'Booked'} — ${d.priceLabel} ${d.city}`,
      sub: d.address,
      date: d.date,
    })),
    ...myOrders.map((o) => ({
      icon: ShoppingBag,
      label: o.item,
      sub: `$${o.amount} · ${o.status}`,
      date: o.date,
    })),
    ...(agent.ratingsGiven > 0
      ? [{ icon: Star, label: `Rated their gallery 5 stars`, sub: 'Feedback logged', date: agent.lastSeen }]
      : []),
    ...(agent.visits > 1
      ? [{ icon: Image, label: 'Opened delivery gallery', sub: 'Viewed 34 assets', date: agent.lastSeen }]
      : []),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <button onClick={() => router.push('/agents')} className="flex items-center gap-1 text-13 text-dim transition hover:text-text">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Agents
      </button>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-raised text-16 font-medium">
                {agent.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </span>
              <div>
                <p className="text-16 font-medium">{agent.name}</p>
                <p className="text-13 text-dim">{agent.brokerage} · {agent.city}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-13">
              <div className="flex justify-between"><dt className="text-faint">Email</dt><dd className="truncate pl-3">{agent.email}</dd></div>
              <div className="flex justify-between"><dt className="text-faint">Phone</dt><dd className="tnum">{agent.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-faint">Status</dt><dd><StatusPill status={agent.status} /></dd></div>
            </dl>
          </Card>

          <Card>
            <CardTitle>Membership</CardTitle>
            {agent.status === 'member' ? (
              <p className="mt-2 text-14">
                {usedThisPeriod ? (
                  <>Credit used on <span className="tnum text-gold">{format(parseISO(usedThisPeriod.date), 'MMM d')}</span></>
                ) : (
                  <><span className="text-gold">1 session</span> available this period</>
                )}
              </p>
            ) : agent.joinedAtCheckoutAmount ? (
              <p className="mt-2 text-14">Joined at checkout — <span className="tnum text-gold">${agent.joinedAtCheckoutAmount}</span></p>
            ) : (
              <p className="mt-2 text-13 text-dim">Not a member</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div><p className="tnum text-20 font-medium text-gold">{agent.visits}</p><p className="text-12 text-faint">visits</p></div>
              <div><p className="tnum text-20 font-medium text-gold">${agent.lifetimeSpend}</p><p className="text-12 text-faint">lifetime</p></div>
              <div><p className="tnum text-20 font-medium text-gold">{agent.ratingsGiven}</p><p className="text-12 text-faint">ratings</p></div>
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardTitle>Timeline</CardTitle>
          {timeline.length === 0 ? (
            <p className="mt-3 text-13 text-faint">No activity yet</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {timeline.map((t, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <t.icon className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="truncate text-13">{t.label}</p>
                    <p className="truncate text-12 text-faint">{t.sub}</p>
                  </div>
                  <span className="tnum ml-auto shrink-0 text-12 text-faint">{format(parseISO(t.date), 'MMM d, yyyy')}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
