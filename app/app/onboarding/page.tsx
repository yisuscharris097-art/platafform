import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import { INTAKE_BLOCKS, type IntakeBlockRow } from '@/lib/intake'
import IntakeBlockForm from '@/components/app/IntakeBlockForm'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const me = await getMyClient()
  if (!me) {
    return (
      <p className="text-sm text-muted-foreground">
        Your login is not linked to a client yet — the studio will connect it shortly.
      </p>
    )
  }
  const supabase = await createClient()
  const { data } = await supabase
    .from('intake_blocks')
    .select('id, client_id, block, status, payload, validated_at')
    .eq('client_id', me.id)
  const rows = (data ?? []) as IntakeBlockRow[]
  const ordered = INTAKE_BLOCKS.map((k) => rows.find((r) => r.block === k)).filter(
    (r): r is IntakeBlockRow => Boolean(r),
  )
  const done = ordered.filter((r) => r.status === 'validated').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Onboarding — {me.display_name}</h1>
        <p className="text-sm text-muted-foreground">
          {done}/{ordered.length} blocks validated. Submit each block; the studio reviews and validates it.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ordered.map((b) => (
          <IntakeBlockForm key={b.id} block={b} />
        ))}
      </div>
    </div>
  )
}
