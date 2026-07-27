import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { INTAKE_BLOCKS, INTAKE_FIELDS, type IntakeBlockRow } from '@/lib/intake'
import ReviewButtons from '@/components/studio/ReviewButtons'

export const dynamic = 'force-dynamic'

export default async function ClientIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase.from('clients').select('id, display_name').eq('id', id).single()
  if (!client) notFound()
  const { data } = await supabase
    .from('intake_blocks')
    .select('id, client_id, block, status, payload, validated_at')
    .eq('client_id', id)
  const rows = (data ?? []) as IntakeBlockRow[]
  const ordered = INTAKE_BLOCKS.map((k) => rows.find((r) => r.block === k)).filter(
    (r): r is IntakeBlockRow => Boolean(r),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          Intake · {(client as { display_name: string }).display_name}
        </h1>
        <Link href={`/studio/clients/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Client
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ordered.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">{INTAKE_FIELDS[b.block].title}</p>
              <span className="text-xs font-semibold capitalize text-muted-foreground">{b.status}</span>
            </div>
            <dl className="space-y-2 text-sm">
              {Object.entries(b.payload).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="break-words">
                    {Array.isArray(v)
                      ? v.map((u) => (
                          <a key={String(u)} href={String(u)} target="_blank" rel="noreferrer" className="mr-2 underline">
                            file
                          </a>
                        ))
                      : String(v) || '—'}
                  </dd>
                </div>
              ))}
              {Object.keys(b.payload).length === 0 && <p className="text-muted-foreground">Nothing submitted yet.</p>}
            </dl>
            {b.status === 'submitted' && <ReviewButtons blockId={b.id} />}
          </div>
        ))}
      </div>
    </div>
  )
}
