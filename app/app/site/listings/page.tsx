import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import ListingsManager, { type ListingItem } from '@/components/app/ListingsManager'

export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const me = await getMyClient()
  if (!me) return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('id, address, city, state, price_cents, beds, baths, sqft, status, mls_id, featured')
    .eq('client_id', me.id)
    .order('featured', { ascending: false })
    .order('position')
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Listings</h1>
      <ListingsManager listings={(data ?? []) as ListingItem[]} />
    </div>
  )
}
