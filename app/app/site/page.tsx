import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import { diffSection, type SectionRow } from '@/lib/cms'
import SectionEditor from '@/components/app/SectionEditor'
import PublishPanel, { type DiffItem } from '@/components/app/PublishPanel'

export const dynamic = 'force-dynamic'

export default async function ClientCmsPage() {
  const me = await getMyClient()
  if (!me) {
    return <p className="text-sm text-muted-foreground">Your login is not linked to a client yet.</p>
  }
  const supabase = await createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, last_published_at')
    .eq('client_id', me.id)
    .single()
  if (!site) return <p className="text-sm text-muted-foreground">No site yet — the studio is setting it up.</p>
  const siteRow = site as { id: string; last_published_at: string | null }

  const { data } = await supabase
    .from('site_sections')
    .select('id, site_id, kind, position, enabled, content, draft, draft_updated_at')
    .eq('site_id', siteRow.id)
    .order('position')
  const sections = (data ?? []) as SectionRow[]

  const diffs: DiffItem[] = sections
    .filter((s) => s.draft !== null)
    .map((s) => ({ section: s.kind, fields: diffSection(s.content, s.draft ?? {}) }))
    .filter((d) => d.fields.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My site — {me.display_name}</h1>
        <nav className="flex gap-3 text-sm text-muted-foreground">
          <Link href="/app/site/listings" className="hover:text-foreground">Listings</Link>
          <Link href="/app/site/integrations" className="hover:text-foreground">Integrations</Link>
        </nav>
      </div>

      <PublishPanel diffs={diffs} lastPublishedAt={siteRow.last_published_at} />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <SectionEditor
            key={s.id}
            section={s}
            clientId={me.id}
            flagshipLocked={(s.kind === 'journal' || s.kind === 'valuation') && me.tier !== 'flagship'}
          />
        ))}
      </div>
    </div>
  )
}
