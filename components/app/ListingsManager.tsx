'use client'
import { useActionState, useState } from 'react'
import { upsertListing, deleteListing, toggleFeatured, type ActionState } from '@/lib/actions/cms'

export interface ListingItem {
  id: string
  address: string
  city: string | null
  state: string | null
  price_cents: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  status: string
  mls_id: string | null
  featured: boolean
}

const input = 'w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'

function ListingForm({ listing, onDone }: { listing: ListingItem | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const r = await upsertListing(prev, fd)
      if (r.ok) onDone()
      return r
    },
    { error: null } as ActionState,
  )
  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-border bg-white p-5 sm:grid-cols-3">
      {listing && <input type="hidden" name="id" value={listing.id} />}
      <div className="sm:col-span-3">
        <label className="mb-1 block text-xs text-muted-foreground">Address *</label>
        <input name="address" required defaultValue={listing?.address ?? ''} className={input} />
      </div>
      <input name="city" placeholder="City" defaultValue={listing?.city ?? ''} className={input} />
      <input name="state" placeholder="State" defaultValue={listing?.state ?? ''} className={input} />
      <input name="price_usd" type="number" min={0} placeholder="Price (USD)" defaultValue={listing?.price_cents ? listing.price_cents / 100 : ''} className={input} />
      <input name="beds" type="number" step="0.5" min={0} placeholder="Beds" defaultValue={listing?.beds ?? ''} className={input} />
      <input name="baths" type="number" step="0.5" min={0} placeholder="Baths" defaultValue={listing?.baths ?? ''} className={input} />
      <input name="sqft" type="number" min={0} placeholder="Sqft" defaultValue={listing?.sqft ?? ''} className={input} />
      <select name="status" defaultValue={listing?.status ?? 'active'} className={input}>
        {['active', 'pending', 'sold'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input name="mls_id" placeholder="MLS #" defaultValue={listing?.mls_id ?? ''} className={input} />
      <div className="flex items-center gap-3 sm:col-span-3">
        <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {pending ? 'Saving…' : listing ? 'Save listing' : 'Add listing'}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

function RowActions({ item }: { item: ListingItem }) {
  const [, delAction, delPending] = useActionState(deleteListing, { error: null } as ActionState)
  const [, featAction, featPending] = useActionState(toggleFeatured, { error: null } as ActionState)
  return (
    <div className="flex items-center justify-end gap-2">
      <form action={featAction}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="featured" value={String(!item.featured)} />
        <button disabled={featPending} className={`rounded px-2 py-1 text-xs font-semibold ${item.featured ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
          ★ {item.featured ? 'Featured' : 'Feature'}
        </button>
      </form>
      <form action={delAction}>
        <input type="hidden" name="id" value={item.id} />
        <button disabled={delPending} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
      </form>
    </div>
  )
}

export default function ListingsManager({ listings }: { listings: ListingItem[] }) {
  const [editing, setEditing] = useState<ListingItem | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{listings.length} listing(s)</p>
        <button onClick={() => { setAdding((a) => !a); setEditing(null) }} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {adding ? 'Close' : '+ Add listing'}
        </button>
      </div>
      {(adding || editing) && <ListingForm listing={editing} onDone={() => { setAdding(false); setEditing(null) }} />}

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              {['Address', 'Price', 'BD/BA', 'Sqft', 'Status', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <button onClick={() => { setEditing(l); setAdding(false) }} className="text-left font-medium hover:underline">
                    {l.address}
                  </button>
                  <p className="text-xs text-muted-foreground">{[l.city, l.state].filter(Boolean).join(', ')}</p>
                </td>
                <td className="px-4 py-3">{l.price_cents ? `$${(l.price_cents / 100).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3">{l.beds ?? '—'}/{l.baths ?? '—'}</td>
                <td className="px-4 py-3">{l.sqft?.toLocaleString() ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{l.status}</td>
                <td className="px-4 py-3"><RowActions item={l} /></td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No listings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
