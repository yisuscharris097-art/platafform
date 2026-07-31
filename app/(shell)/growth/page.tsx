'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getAgents } from '@/lib/mock/api'
import type { Agent } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

interface ScoredAgent extends Agent {
  score: number
  segment: 'hot' | 'warm' | 'cold'
  signals: string[]
  action: string
}

function score(a: Agent): ScoredAgent {
  const signals: string[] = []
  let s = 20
  if (a.visits >= 3) {
    s += 30
    signals.push('3+ visits')
  } else if (a.visits === 2) s += 15
  if (a.lifetimeSpend > 200) {
    s += 25
    signals.push('spent money')
  } else if (a.lifetimeSpend > 0) s += 10
  if (a.ratingsGiven > 0) {
    s += 15
    signals.push('high rating')
  }
  if (a.visits > 1) signals.push('gallery opened')
  s = Math.min(s, 98)
  const segment = s >= 70 ? 'hot' : s >= 45 ? 'warm' : 'cold'
  const action =
    a.status === 'member'
      ? 'Offer annual upgrade'
      : segment === 'hot'
        ? 'Send membership offer'
        : segment === 'warm'
          ? 'Invite to next content day'
          : 'Add to nurture sequence'
  return { ...a, score: s, segment, signals, action }
}

const SEQUENCES = [
  { name: 'Post-shoot membership pitch', sent: 214, opened: 156, converted: 38 },
  { name: 'First timer welcome', sent: 305, opened: 241, converted: 61 },
  { name: 'Win-back — 90 days quiet', sent: 128, opened: 64, converted: 9 },
]

const SEGMENTS = ['all', 'hot', 'warm', 'cold'] as const

export default function GrowthPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>('all')

  useEffect(() => {
    getAgents().then(setAgents)
  }, [])

  const scored = useMemo(() => {
    if (!agents) return null
    return agents
      .filter((a) => a.status !== 'member')
      .map(score)
      .filter((a) => segment === 'all' || a.segment === segment)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25)
  }, [agents, segment])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={cn(
              'h-8 rounded-full border px-3.5 text-13 capitalize transition',
              segment === s
                ? 'border-gold bg-gold-wash text-gold'
                : 'border-border text-dim hover:border-border-strong hover:text-text',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {scored === null ? (
        <TableSkeleton rows={8} />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <Th>Agent</Th>
              <Th>Score</Th>
              <Th>Segment</Th>
              <Th>Signals</Th>
              <Th>Recommended action</Th>
            </THead>
            <tbody>
              {scored.map((a) => (
                <Tr key={a.id} onClick={() => router.push(`/agents/${a.id}`)}>
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="w-40">
                    <div className="flex items-center gap-2">
                      <span className="tnum w-6 text-13">{a.score}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${a.score}%` }} />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <StatusPill
                      status={a.segment === 'hot' ? 'member' : a.segment === 'warm' ? 'pending' : 'draft'}
                      label={a.segment}
                    />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {a.signals.map((sg) => (
                        <span key={sg} className="rounded-full border border-border px-2 py-0.5 text-12 text-faint">
                          {sg}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-dim">{a.action}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Card>
        <CardTitle>Sequences</CardTitle>
        <TableWrap className="mt-3 border-0 bg-transparent">
          <Table>
            <THead>
              <Th>Sequence</Th>
              <Th className="text-right">Sent</Th>
              <Th className="text-right">Opened</Th>
              <Th className="text-right">Converted</Th>
            </THead>
            <tbody>
              {SEQUENCES.map((s) => (
                <Tr key={s.name}>
                  <Td className="font-medium">{s.name}</Td>
                  <Td className="tnum text-right text-dim">{s.sent}</Td>
                  <Td className="tnum text-right text-dim">{s.opened}</Td>
                  <Td className="tnum text-right text-gold">{s.converted}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  )
}
