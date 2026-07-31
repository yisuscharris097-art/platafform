'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { Card, CardTitle } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getAgents, getContentDays } from '@/lib/mock/api'
import type { Agent, ContentDay } from '@/lib/mock/types'

const PLANS = [
  { name: 'Monthly', price: '$97/mo', note: '1 content day session per month, member pricing on add-ons' },
  { name: 'At checkout', price: '$97–127', note: 'Joined while paying for a session — auto-converts to monthly' },
  { name: 'Annual', price: '$970/yr', note: 'Two months free, priority booking on trophy properties' },
]

export default function MembershipsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [days, setDays] = useState<ContentDay[]>([])

  useEffect(() => {
    getAgents().then(setAgents)
    getContentDays().then(setDays)
  }, [])

  const members = agents?.filter((a) => a.status === 'member').slice(0, 20) ?? null

  function creditFor(a: Agent): { label: string; used: boolean } {
    const used = days.find((d) => d.status === 'upcoming' && d.date.startsWith('2026-08') && d.bookedAgentIds.includes(a.id))
    return used
      ? { label: `Used on ${format(parseISO(used.date), 'MMM d')}`, used: true }
      : { label: '1 session available', used: false }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name}>
            <CardTitle>{p.name}</CardTitle>
            <p className="tnum mt-1 text-20 font-medium text-gold">{p.price}</p>
            <p className="mt-1 text-13 text-dim">{p.note}</p>
          </Card>
        ))}
      </div>

      <div>
        <p className="mb-2 text-13 text-dim">Credit ledger · current period</p>
        {members === null ? (
          <TableSkeleton rows={8} />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <Th>Member</Th>
                <Th>Brokerage</Th>
                <Th>Period credit</Th>
                <Th className="text-right">Visits</Th>
                <Th className="text-right">Lifetime</Th>
              </THead>
              <tbody>
                {members.map((a) => {
                  const credit = creditFor(a)
                  return (
                    <Tr key={a.id} onClick={() => router.push(`/agents/${a.id}`)}>
                      <Td className="font-medium">{a.name}</Td>
                      <Td className="text-dim">{a.brokerage}</Td>
                      <Td>
                        <StatusPill status={credit.used ? 'pending' : 'member'} label={credit.label} />
                      </Td>
                      <Td className="tnum text-right">{a.visits}</Td>
                      <Td className="tnum text-right">${a.lifetimeSpend.toLocaleString('en-US')}</Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </div>
    </div>
  )
}
