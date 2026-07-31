'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { CREWS } from '@/lib/mock/crews'

const field = 'mt-1 h-9 w-full rounded border border-border bg-bg px-3 text-13 transition focus:border-border-strong'

export default function SettingsPage() {
  const toast = useToast()
  const [pricing, setPricing] = useState({ member: 97, nonMember: 127, twilight: 60, drone: 85 })
  const [policy, setPolicy] = useState('No-shows are charged the full session rate unless cancelled 48 hours out. Members keep their period credit if the shoot is rescheduled by us.')

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle>Pricing</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {(
            [
              ['member', 'Member session'],
              ['nonMember', 'Non-member session'],
              ['twilight', 'Twilight add-on'],
              ['drone', 'Drone reel add-on'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-12 text-faint" htmlFor={key}>{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-13 text-faint">$</span>
                <input
                  id={key}
                  type="number"
                  value={pricing[key]}
                  onChange={(e) => setPricing({ ...pricing, [key]: Number(e.target.value) })}
                  className={`${field} pl-7`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => toast('Pricing saved')}>Save pricing</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Cancellation policy</CardTitle>
        <textarea
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded border border-border bg-bg p-3 text-13 transition focus:border-border-strong"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => toast('Policy saved')}>Save policy</Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle>Team</CardTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CREWS.map((c) => (
            <div key={c.id} className="rounded border border-border bg-bg p-3">
              <p className="text-13 font-medium">{c.name}</p>
              <ul className="mt-1.5 space-y-1">
                {c.members.map((m) => (
                  <li key={m.name + m.role} className="flex justify-between text-12">
                    <span className="text-dim">{m.name}</span>
                    <span className="text-faint">{m.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
