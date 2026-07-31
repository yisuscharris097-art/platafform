'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getAggregates, getContentDays } from '@/lib/mock/api'
import { crewName } from '@/lib/mock/crews'
import type { Aggregates, ContentDay } from '@/lib/mock/types'

const DONUT_COLORS = ['var(--gold)', 'var(--border-strong)', 'var(--gold-dim)', 'var(--text-faint)']

export default function DashboardPage() {
  const router = useRouter()
  const [agg, setAgg] = useState<Aggregates | null>(null)
  const [days, setDays] = useState<ContentDay[] | null>(null)

  useEffect(() => {
    getAggregates().then(setAgg)
    getContentDays().then(setDays)
  }, [])

  const upcoming = days?.filter((d) => d.status === 'upcoming').slice(0, 6) ?? null
  const conversion = agg ? Math.round((agg.joinedAtCheckout / (agg.joinedAtCheckout + agg.nonMembers)) * 100) : null
  const showRate = agg ? Math.round((agg.totalCheckouts / agg.totalCheckIns) * 100) : null

  const donut = agg
    ? [
        { name: 'Members', value: agg.members },
        { name: 'Non-members', value: agg.nonMembers },
        { name: 'Joined at checkout', value: agg.joinedAtCheckout },
        { name: 'Need more info', value: agg.needMoreInfo },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Show rate" value={showRate === null ? null : `${showRate}%`} hint="checkouts vs check-ins" trend={[88, 91, 90, 93, 94]} />
        <MetricCard label="Total check-ins" value={agg ? agg.totalCheckIns.toLocaleString('en-US') : null} hint="all time" trend={[3, 5, 8, 11, 14]} />
        <MetricCard label="Membership conversion" value={conversion === null ? null : `${conversion}%`} hint="joined at checkout" trend={[31, 34, 36, 39, 40]} />
        <MetricCard label="Active members" value={agg ? agg.members.toLocaleString('en-US') : null} hint="938 and growing" trend={[790, 830, 872, 901, 938]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <CardTitle>Next content days</CardTitle>
          </div>
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
                      <Td className="tnum text-dim">{format(parseISO(d.date), 'EEE MMM d')}</Td>
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

        <Card>
          <CardTitle>Membership breakdown</CardTitle>
          {agg === null ? (
            <Skeleton className="mx-auto mt-6 h-40 w-40 rounded-full" />
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={55} outerRadius={72} strokeWidth={0} paddingAngle={2}>
                      {donut.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-1 space-y-1.5">
                {donut.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2 text-13">
                    <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
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
  )
}
