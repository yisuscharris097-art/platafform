'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'

interface HostRequest {
  id: string
  address: string
  city: string
  priceLabel: string
  listingAgent: string
  stage: number
}

const STAGES = ['Requested', 'Reviewing', 'Approved', 'Scheduled']

const INITIAL: HostRequest[] = [
  { id: 'h1', address: '2200 Intracoastal Dr', city: 'Fort Lauderdale', priceLabel: '$6.2M', listingAgent: 'Dennis Lue Yat', stage: 0 },
  { id: 'h2', address: '480 Royal Plaza Dr', city: 'Fort Lauderdale', priceLabel: '$5.1M', listingAgent: 'Erica Elliott', stage: 0 },
  { id: 'h3', address: '12105 Banyan Rd', city: 'North Palm Beach', priceLabel: '$9.4M', listingAgent: 'Andrea Larsen', stage: 1 },
  { id: 'h4', address: '77 Casa Bendita', city: 'Palm Beach', priceLabel: '$11.2M', listingAgent: 'Michelle Kirschner', stage: 1 },
  { id: 'h5', address: '3120 Jasmine Ct', city: 'Delray Beach', priceLabel: '$4.3M', listingAgent: 'Kristi Dye', stage: 2 },
  { id: 'h6', address: '9081 Edgewater Bend', city: 'Parkland', priceLabel: '$5.5M', listingAgent: 'Jared Haugland', stage: 3 },
  { id: 'h7', address: '355 Ocean Blvd', city: 'Golden Beach', priceLabel: '$8.9M', listingAgent: 'Silvana Prada', stage: 3 },
]

export default function HostsPage() {
  const toast = useToast()
  const [requests, setRequests] = useState(INITIAL)
  const [dragging, setDragging] = useState<string | null>(null)

  function move(id: string, stage: number) {
    const r = requests.find((x) => x.id === id)
    if (!r || r.stage === stage) return
    setRequests(requests.map((x) => (x.id === id ? { ...x, stage } : x)))
    toast(`${r.address} moved to ${(STAGES[stage] ?? '').toLowerCase()}`)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage, si) => (
        <div
          key={stage}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragging) move(dragging, si)
            setDragging(null)
          }}
          className="rounded-lg border border-border bg-surface p-3"
        >
          <p className="mb-2 flex items-center justify-between px-1 text-13 text-dim">
            {stage}
            <span className="tnum text-12 text-faint">{requests.filter((r) => r.stage === si).length}</span>
          </p>
          <div className="min-h-24 space-y-2">
            {requests
              .filter((r) => r.stage === si)
              .map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={() => setDragging(r.id)}
                  className={cn(
                    'cursor-grab rounded border border-border bg-raised p-3 transition hover:border-border-strong',
                    dragging === r.id && 'opacity-50',
                  )}
                >
                  <p className="text-13 font-medium">
                    <span className="text-gold">{r.priceLabel}</span> · {r.city}
                  </p>
                  <p className="truncate text-13 text-dim">{r.address}</p>
                  <p className="mt-1 text-12 text-faint">Host: {r.listingAgent}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
      <p className="text-12 text-faint md:col-span-2 xl:col-span-4">Drag a property between columns to advance it</p>
    </div>
  )
}
