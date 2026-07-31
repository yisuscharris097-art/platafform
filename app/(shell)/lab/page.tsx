'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Card, CardTitle } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/skeleton'
import { StatusPill } from '@/components/ui/status-pill'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getContentDays } from '@/lib/mock/api'
import type { ContentDay } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

interface QueueRow {
  id: string
  date: string
  property: string
  shooter: string
  uploadedAt: string | null
  dueAt: string
  hoursLate: number
  stage: 'awaiting upload' | 'uploaded' | 'in edit' | 'qc' | 'delivered'
}

const SHOOTERS = ['Peter', 'Nate', 'Joseph', 'Sam']
const STAGES: QueueRow['stage'][] = ['awaiting upload', 'uploaded', 'in edit', 'qc', 'delivered']

function buildQueue(days: ContentDay[]): QueueRow[] {
  return days
    .filter((d) => d.status === 'completed' && d.date !== null)
    .flatMap((d, i) => {
      const date = d.date ?? ''
      const stage = STAGES[i % STAGES.length] ?? 'delivered'
      const hoursLate = i % 3 === 2 ? 6 + i * 3 : 0
      return {
        id: d.id,
        date,
        property: `${d.priceLabel} · ${d.city}`,
        shooter: SHOOTERS[i % SHOOTERS.length] ?? 'Peter',
        uploadedAt: stage === 'awaiting upload' ? null : `${date}T2${i % 4}:15:00`,
        dueAt: `${date}T20:00:00`,
        hoursLate,
        stage,
      }
    })
}

const DELAY_BY_SHOOTER = [
  { name: 'Peter', hours: 1.2 },
  { name: 'Nate', hours: 3.8 },
  { name: 'Joseph', hours: 0.6 },
  { name: 'Sam', hours: 5.4 },
]

export default function LabPage() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueRow[] | null>(null)

  useEffect(() => {
    getContentDays().then((d) => setQueue(buildQueue(d)))
  }, [])

  return (
    <div className="space-y-4">
      {queue === null ? (
        <TableSkeleton rows={6} />
      ) : (
        STAGES.map((stage) => {
          const rows = queue.filter((q) => q.stage === stage)
          if (rows.length === 0) return null
          return (
            <div key={stage}>
              <p className="mb-2 text-13 text-dim">
                {stage} <span className="tnum text-faint">· {rows.length}</span>
              </p>
              <TableWrap>
                <Table>
                  <THead>
                    <Th>Shoot date</Th>
                    <Th>Property</Th>
                    <Th>Shooter</Th>
                    <Th>Uploaded</Th>
                    <Th>Due</Th>
                    <Th className="text-right">Hours late</Th>
                  </THead>
                  <tbody>
                    {rows.map((q) => (
                      <Tr
                        key={q.id + q.stage}
                        onClick={() => router.push(`/content-days/${q.id}`)}
                        className={cn(q.hoursLate > 0 && 'border-l-2 border-l-danger')}
                      >
                        <Td className="tnum text-dim">{format(parseISO(q.date), 'MMM d')}</Td>
                        <Td className="font-medium">{q.property}</Td>
                        <Td className="text-dim">{q.shooter}</Td>
                        <Td className="tnum text-dim">{q.uploadedAt ? format(parseISO(q.uploadedAt), 'MMM d, h a') : '—'}</Td>
                        <Td className="tnum text-dim">{format(parseISO(q.dueAt), 'MMM d, h a')}</Td>
                        <Td className={cn('tnum text-right', q.hoursLate > 0 ? 'text-danger' : 'text-faint')}>
                          {q.hoursLate > 0 ? q.hoursLate : '—'}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </div>
          )
        })
      )}

      <Card>
        <CardTitle>Average upload delay by shooter</CardTitle>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DELAY_BY_SHOOTER} barSize={28}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-faint)', fontSize: 12 }} />
              <YAxis hide />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {DELAY_BY_SHOOTER.map((d, i) => (
                  <Cell key={i} fill={d.hours > 4 ? 'var(--danger)' : 'var(--gold-dim)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-12 text-faint">Hours between wrap and card upload, trailing 30 days</p>
      </Card>
    </div>
  )
}
