'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getAggregates, getContentDays, getRoster } from '@/lib/mock/api'
import { isToday } from '@/lib/mock/dates'
import { crewName } from '@/lib/mock/crews'
import type { Aggregates, ContentDay, RosterEntry } from '@/lib/mock/types'

const DONUT_COLORS = ['var(--gold)', 'var(--border-strong)', 'var(--gold-dim)', 'var(--text-faint)']

interface Alert {
  label: string
  href: string
}

function buildAlerts(days: ContentDay[]): Alert[] {
  const alerts: Alert[] = []
  for (const d of days) {
    if (d.status === 'upcoming' && d.crew === null) {
      alerts.push({ label: `${d.city} (${d.priceLabel}) has no crew assigned`, href: `/content-days/${d.id}` })
    }
  }
  for (const d of days) {
    if (d.status === 'upcoming' && d.hostRequirements.some((r) => !r.done)) {
      alerts.push({ label: `Host requirements incomplete — ${d.city}`, href: `/content-days/${d.id}` })
      if (alerts.length >= 4) break
    }
  }
  const overdue = days.find((d) => d.status === 'completed')
  if (overdue) alerts.push({ label: `Footage overdue — ${overdue.city} ${overdue.priceLabel}`, href: '/lab' })
  alerts.push({ label: 'Two 3-star ratings this month — review galleries', href: '/agents' })
  return alerts.slice(0, 5)
}

export default function DashboardPage() {
  const router = useRouter()
  const [agg, setAgg] = useState<Aggregates | null>(null)
  const [days, setDays] = useState<ContentDay[] | null>(null)
  const [todayRoster, setTodayRoster] = useState<RosterEntry[] | null>(null)

  useEffect(() => {
    getAggregates().then(setAgg)
    getContentDays().then((d) => {
      setDays(d)
      const today = d.find((x) => isToday(x.date))
      if (today) getRoster(today.id).then(setTodayRoster)
    })
  }, [])

  const todayDay = days?.find((d) => isToday(d.date)) ?? null
  const upcoming =
    days
      ?.filter((d) => d.status === 'upcoming' && !isToday(d.date))
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .slice(0, 5) ?? null

  const completion = agg ? Math.round((agg.totalCheckouts / agg.totalCheckIns) * 100) : null
  const neverClosed = agg ? agg.totalCheckIns - agg.totalCheckouts : null
  const conversion = agg ? Math.round((agg.joinedAtCheckout / (agg.joinedAtCheckout + agg.nonMembers)) * 100) : null

  const donut = agg
    ? [
        { name: 'Members', value: agg.members },
        { name: 'Non-members', value: agg.nonMembers },
        { name: 'Joined at checkout', value: agg.joinedAtCheckout },
        { name: 'Need more info', value: agg.needMoreInfo },
      ]
    : []

  const checkedIn = todayRoster?.filter((r) => r.attendance === 'checked-in') ?? []
  const pending = todayRoster?.filter((r) => r.attendance === 'booked') ?? []
  const noShows = todayRoster?.filter((r) => r.attendance === 'no-show') ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Session completion"
          value={completion === null ? null : `${completion}%`}
          hint="checkouts vs check-ins"
          note={neverClosed === null ? undefined : `${neverClosed} sessions never closed out`}
          trend={[88, 91, 90, 93, 94]}
        />
        <MetricCard label="Total check-ins" value={agg ? agg.totalCheckIns.toLocaleString('en-US') : null} hint="all time" trend={[3, 5, 8, 11, 14]} />
        <MetricCard label="Membership conversion" value={conversion === null ? null : `${conversion}%`} hint="joined at checkout" trend={[31, 34, 36, 39, 40]} />
        <MetricCard
          label="Active members"
          value={agg ? agg.uniqueMembers.toLocaleString('en-US') : null}
          hint={agg ? `${agg.members} records → ${agg.uniqueMembers} unique people` : undefined}
          trend={[790, 830, 872, 901, 938]}
        />
      </div>

      {todayDay ? (
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Today</CardTitle>
            <StatusPill status="member" label="in progress" />
            <button
              onClick={() => router.push(`/content-days/${todayDay.id}`)}
              className="text-13 font-medium text-gold transition hover:text-gold-dim"
            >
              {todayDay.priceLabel} · {todayDay.city}
            </button>
            <span className="tnum ml-auto text-12 text-faint">
              {checkedIn.length} in · {pending.length} pending · {noShows.length} no-show
            </span>
          </div>
          {todayRoster === null ? (
            <Skeleton className="mt-3 h-24 w-full" />
          ) : (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {todayRoster.map((r) => (
                <button
                  key={r.agentId}
                  onClick={() => router.push(`/agents/${r.agentId}`)}
                  className="flex items-center gap-2.5 rounded border border-border px-3 py-2 text-left transition hover:border-border-strong"
                >
                  <span className="tnum w-14 shrink-0 text-12 text-faint">{r.slot}</span>
                  <span className="truncate text-13">{r.agentName}</span>
                  <StatusPill
                    className="ml-auto"
                    status={r.attendance === 'booked' ? 'pending' : r.attendance}
                    label={r.attendance === 'booked' ? 'pending' : r.attendance === 'checked-in' ? 'in' : 'no-show'}
                  />
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle className="mb-3">Next content days</CardTitle>
          {upcoming === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <TableWrap className="border-0 bg-transparent">
              <Table>
                <THead>
                  <Th>Date</Th>
                  <Th>Property</Th>
                  <Th>Booked</Th>
                  <Th>Crew</Th>
                </THead>
                <tbody>
                  {upcoming.map((d) => (
                    <Tr key={d.id} onClick={() => router.push(`/content-days/${d.id}`)}>
                      <Td className="tnum text-dim">{d.date ? format(parseISO(d.date), 'EEE MMM d') : '—'}</Td>
                      <Td>
                        <span className="font-medium text-gold">{d.priceLabel}</span>
                        <span className="ml-2 text-dim">{d.city}</span>
                      </Td>
                      <Td className="tnum">{d.booked} / {d.capacity}</Td>
                      <Td>
                        {d.crew ? (
                          <span className="text-dim">{crewName(d.crew)}</span>
                        ) : (
                          <StatusPill status="overdue" label="no crew" />
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Needs attention</CardTitle>
            {days === null ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {buildAlerts(days).map((a) => (
                  <li key={a.label}>
                    <button
                      onClick={() => router.push(a.href)}
                      className="flex w-full items-center gap-2.5 py-2.5 text-left text-13 text-dim transition hover:text-text"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn" strokeWidth={1.5} />
                      <span className="min-w-0 flex-1">{a.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle>Membership breakdown</CardTitle>
            {agg === null ? (
              <Skeleton className="mx-auto mt-6 h-36 w-36 rounded-full" />
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut} dataKey="value" innerRadius={50} outerRadius={66} strokeWidth={0} paddingAngle={2}>
                        {donut.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-1 space-y-1.5">
                  {donut.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2 text-13">
                      <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-dim">{d.name}</span>
                      <span className="tnum ml-auto">{d.value.toLocaleString('en-US')}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
