'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { UserRound } from 'lucide-react'
import { StatusPill } from '@/components/ui/status-pill'
import { TableSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getAgents } from '@/lib/mock/api'
import type { Agent, MembershipStatus } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

const LABELS: Record<MembershipStatus, string> = {
  member: 'member',
  'non-member': 'non-member',
  checkout: 'joined at checkout',
  info: 'needs info',
}

const VIEWS: Array<{ label: string; value: MembershipStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Members', value: 'member' },
  { label: 'Non-members', value: 'non-member' },
  { label: 'Joined at checkout', value: 'checkout' },
  { label: 'Needs info', value: 'info' },
]

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [view, setView] = useState<MembershipStatus | 'all'>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    getAgents().then(setAgents)
  }, [])

  const rows = useMemo(() => {
    if (!agents) return null
    const needle = q.trim().toLowerCase()
    return agents.filter(
      (a) =>
        (view === 'all' || a.status === view) &&
        (needle === '' ||
          a.name.toLowerCase().includes(needle) ||
          a.email.toLowerCase().includes(needle) ||
          a.brokerage.toLowerCase().includes(needle)),
    )
  }, [agents, view, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={cn(
              'h-8 rounded-full border px-3.5 text-13 transition',
              view === v.value
                ? 'border-gold bg-gold-wash text-gold'
                : 'border-border text-dim hover:border-border-strong hover:text-text',
            )}
          >
            {v.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, brokerage…"
          className="ml-auto h-9 w-full max-w-xs rounded border border-border bg-surface px-3 text-13 transition focus:border-border-strong"
        />
      </div>

      {rows === null ? (
        <TableSkeleton rows={10} />
      ) : rows.length === 0 ? (
        <EmptyState icon={UserRound} message={`No agents match “${q}”`} actionLabel="Clear search" onAction={() => setQ('')} />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Brokerage</Th>
              <Th>City</Th>
              <Th>Status</Th>
              <Th className="text-right">Visits</Th>
              <Th className="text-right">Lifetime spend</Th>
              <Th>Last seen</Th>
            </THead>
            <tbody>
              {rows.slice(0, 60).map((a) => (
                <Tr key={a.id} onClick={() => router.push(`/agents/${a.id}`)}>
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-dim">{a.brokerage}</Td>
                  <Td className="text-dim">{a.city}</Td>
                  <Td><StatusPill status={a.status} label={LABELS[a.status]} /></Td>
                  <Td className="tnum text-right">{a.visits}</Td>
                  <Td className="tnum text-right">${a.lifetimeSpend.toLocaleString('en-US')}</Td>
                  <Td className="tnum text-dim">{format(parseISO(a.lastSeen), 'MMM d')}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
      {rows && rows.length > 60 ? (
        <p className="text-12 text-faint">Showing 60 of {rows.length} — refine the search to narrow down</p>
      ) : null}
    </div>
  )
}
