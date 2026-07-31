'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { createContentDay } from '@/lib/mock/api'
import { daysFromNow } from '@/lib/mock/dates'

const field = 'mt-1 h-9 w-full rounded border border-border bg-bg px-3 text-13 transition focus:border-border-strong'

export default function NewContentDayPage() {
  const router = useRouter()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: daysFromNow(21), priceLabel: '', city: '', address: '', capacity: 16 })

  const valid = form.date && form.priceLabel && form.city && form.address && form.capacity > 0

  async function submit() {
    setSaving(true)
    const day = await createContentDay({ ...form, priceLabel: form.priceLabel.startsWith('$') ? form.priceLabel : `$${form.priceLabel}` })
    toast('Content day drafted')
    router.push(`/content-days/${day.id}`)
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button onClick={() => router.push('/content-days')} className="flex items-center gap-1 text-13 text-dim transition hover:text-text">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} /> Content days
      </button>

      <Card>
        <CardTitle>New content day</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-12 text-faint" htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
          </div>
          <div>
            <label className="text-12 text-faint" htmlFor="price">List price label</label>
            <input id="price" placeholder="$4.9M" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} className={field} />
          </div>
          <div>
            <label className="text-12 text-faint" htmlFor="city">City</label>
            <input id="city" placeholder="Boca Raton" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
          </div>
          <div>
            <label className="text-12 text-faint" htmlFor="capacity">Capacity</label>
            <input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-12 text-faint" htmlFor="addr">Full address</label>
            <input id="addr" placeholder="662 Boca Marina Ct, Boca Raton FL 33487" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={field} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push('/content-days')}>Cancel</Button>
          <Button variant="primary" disabled={!valid || saving} onClick={() => void submit()}>
            {saving ? 'Saving…' : 'Create draft'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
