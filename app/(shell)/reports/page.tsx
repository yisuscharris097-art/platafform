'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { getAggregates } from '@/lib/mock/api'
import type { Aggregates } from '@/lib/mock/types'

const CHECKINS_BY_MONTH = [
  { m: 'Feb', v: 212 },
  { m: 'Mar', v: 268 },
  { m: 'Apr', v: 301 },
  { m: 'May', v: 344 },
  { m: 'Jun', v: 389 },
  { m: 'Jul', v: 415 },
]

const REVENUE_BY_CITY = [
  { city: 'Boca Raton', v: 18400 },
  { city: 'Miami Beach', v: 15200 },
  { city: 'Jupiter', v: 11800 },
  { city: 'Fort Lauderdale', v: 9400 },
  { city: 'Wellington', v: 7100 },
  { city: 'Palm Beach', v: 6800 },
]

export default function ReportsPage() {
  const [agg, setAgg] = useState<Aggregates | null>(null)

  useEffect(() => {
    getAggregates().then(setAgg)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total check-ins" value={agg ? agg.totalCheckIns.toLocaleString('en-US') : null} />
        <MetricCard label="Total checkouts" value={agg ? agg.totalCheckouts.toLocaleString('en-US') : null} />
        <MetricCard label="Members" value={agg ? agg.members.toLocaleString('en-US') : null} />
        <MetricCard label="Need more info" value={agg ? agg.needMoreInfo : null} hint="data cleanup queue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Check-ins per month</CardTitle>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHECKINS_BY_MONTH}>
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-faint)', fontSize: 12 }} />
                <YAxis hide />
                <Line type="monotone" dataKey="v" stroke="var(--gold)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Revenue by city · 90d</CardTitle>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_BY_CITY} layout="vertical" barSize={14}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="city" width={110} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-dim)', fontSize: 12 }} />
                <Bar dataKey="v" fill="var(--gold-dim)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
