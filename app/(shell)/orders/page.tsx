'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { StatusPill } from '@/components/ui/status-pill'
import { TableSkeleton } from '@/components/ui/skeleton'
import { MetricCard } from '@/components/ui/metric-card'
import { Table, TableWrap, THead, Th, Tr, Td } from '@/components/ui/table'
import { getOrders } from '@/lib/mock/api'
import type { Order, OrderStatus } from '@/lib/mock/types'
import { cn } from '@/lib/cn'

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  useEffect(() => {
    getOrders().then(setOrders)
  }, [])

  const rows = useMemo(
    () => orders?.filter((o) => filter === 'all' || o.status === filter) ?? null,
    [orders, filter],
  )
  const paidTotal = orders?.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount, 0) ?? null
  const pendingCount = orders?.filter((o) => o.status === 'pending').length ?? null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Collected · 60d" value={paidTotal === null ? null : `$${paidTotal.toLocaleString('en-US')}`} trend={[9, 12, 11, 15, 17]} />
        <MetricCard label="Orders" value={orders?.length ?? null} trend={[30, 34, 40, 44, 48]} />
        <MetricCard label="Pending" value={pendingCount} hint="follow up" />
        <MetricCard label="Average order" value={paidTotal && orders ? `$${Math.round(paidTotal / orders.length)}` : null} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'h-8 rounded-full border px-3.5 text-13 transition',
              filter === f.value
                ? 'border-gold bg-gold-wash text-gold'
                : 'border-border text-dim hover:border-border-strong hover:text-text',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <TableSkeleton rows={8} />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <Th>Date</Th>
              <Th>Agent</Th>
              <Th>Item</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {rows.map((o) => (
                <Tr key={o.id} onClick={() => router.push(`/agents/${o.agentId}`)}>
                  <Td className="tnum text-dim">{format(parseISO(o.date), 'MMM d, yyyy')}</Td>
                  <Td className="font-medium">{o.agentName}</Td>
                  <Td className="text-dim">{o.item}</Td>
                  <Td className="tnum text-right">${o.amount}</Td>
                  <Td><StatusPill status={o.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  )
}
