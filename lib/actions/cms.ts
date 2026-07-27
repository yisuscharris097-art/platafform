'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getMyClient } from '@/lib/my-client'
import { FLAGSHIP_ONLY, sectionPayloadSchema, listingSchema, integrationSchema, type SectionKind } from '@/lib/cms'

export interface ActionState {
  error: string | null
  ok?: boolean
}

/** Save a section's draft. Flagship-only sections are gated HERE, server-side. */
export async function saveSectionDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sectionId = formData.get('section_id')
  const kind = formData.get('kind')
  const enabled = formData.get('enabled') === 'true'
  const raw = formData.get('payload')
  if (typeof sectionId !== 'string' || typeof kind !== 'string' || typeof raw !== 'string') {
    return { error: 'Malformed request' }
  }
  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return { error: 'Malformed payload' }
  }
  const parsed = sectionPayloadSchema.safeParse(payload)
  if (!parsed.success) return { error: 'Invalid fields' }

  const me = await getMyClient()
  if (!me) return { error: 'No client linked to this login' }
  if (FLAGSHIP_ONLY.includes(kind as SectionKind) && me.tier !== 'flagship') {
    return { error: 'Journal and valuation are Flagship-tier features' }
  }

  const supabase = await createClient()
  const { error, data } = await supabase
    .from('site_sections')
    .update({ draft: parsed.data, enabled, draft_updated_at: new Date().toISOString() })
    .eq('id', sectionId)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed' }
  revalidatePath('/app/site')
  return { error: null, ok: true }
}

/**
 * Publish: copy draft→content for every drafted section, stamp the site, fire
 * the deploy hook. The unpaid-balance gate lives HERE in the publish path
 * (brief §5): a site does not go live with an unpaid balance invoice.
 */
export async function publishSite(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const me = await getMyClient()
  if (!me) return { error: 'No client linked to this login' }
  const supabase = await createClient()

  const { data: unpaid } = await supabase
    .from('invoices')
    .select('id')
    .eq('client_id', me.id)
    .eq('kind', 'balance')
    .in('status', ['open', 'draft'])
    .limit(1)
  if (unpaid && unpaid.length > 0) {
    return { error: 'Publishing is blocked until the balance invoice is paid.' }
  }

  const { data: site } = await supabase
    .from('sites')
    .select('id, deploy_hook_url')
    .eq('client_id', me.id)
    .single()
  if (!site) return { error: 'No site found' }
  const siteRow = site as { id: string; deploy_hook_url: string | null }

  const { data: drafted } = await supabase
    .from('site_sections')
    .select('id, draft')
    .eq('site_id', siteRow.id)
    .not('draft', 'is', null)
  for (const s of (drafted ?? []) as { id: string; draft: Record<string, unknown> }[]) {
    const { error } = await supabase
      .from('site_sections')
      .update({ content: s.draft, draft: null, draft_updated_at: null })
      .eq('id', s.id)
    if (error) return { error: error.message }
  }

  await supabase.from('sites').update({ last_published_at: new Date().toISOString() }).eq('id', siteRow.id)

  if (siteRow.deploy_hook_url) {
    try {
      await fetch(siteRow.deploy_hook_url, { method: 'POST' })
    } catch {
      // Deploy hook failure must not lose the publish itself.
    }
  }
  revalidatePath('/app/site')
  return { error: null, ok: true }
}

// ─── Listings ────────────────────────────────────────────────────────────────
function parseListing(formData: FormData) {
  return listingSchema.safeParse({
    address: formData.get('address'),
    city: formData.get('city') ?? '',
    state: formData.get('state') ?? '',
    price_cents: formData.get('price_usd') ? Math.round(Number(formData.get('price_usd')) * 100) : null,
    beds: formData.get('beds') || null,
    baths: formData.get('baths') || null,
    sqft: formData.get('sqft') || null,
    status: formData.get('status') ?? 'active',
    mls_id: formData.get('mls_id') ?? '',
  })
}

export async function upsertListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getMyClient()
  if (!me) return { error: 'No client linked to this login' }
  const parsed = parseListing(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid listing' }
  const id = formData.get('id')
  const record = { ...parsed.data, client_id: me.id, mls_id: parsed.data.mls_id || null, city: parsed.data.city || null, state: parsed.data.state || null }

  const supabase = await createClient()
  const q =
    typeof id === 'string' && id
      ? supabase.from('listings').update(record).eq('id', id).select('id')
      : supabase.from('listings').insert(record).select('id')
  const { error, data } = await q
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Not allowed' }
  revalidatePath('/app/site/listings')
  return { error: null, ok: true }
}

export async function deleteListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  if (typeof id !== 'string') return { error: 'Missing id' }
  const supabase = await createClient()
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/site/listings')
  return { error: null, ok: true }
}

export async function toggleFeatured(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = formData.get('id')
  const featured = formData.get('featured') === 'true'
  if (typeof id !== 'string') return { error: 'Missing id' }
  const supabase = await createClient()
  const { error } = await supabase.from('listings').update({ featured }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/app/site/listings')
  return { error: null, ok: true }
}

// ─── Integrations ───────────────────────────────────────────────────────────
export async function saveIntegration(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getMyClient()
  if (!me) return { error: 'No client linked to this login' }
  const parsed = integrationSchema.safeParse({
    provider: formData.get('provider'),
    value: formData.get('value') ?? '',
    enabled: formData.get('enabled') === 'on',
  })
  if (!parsed.success) return { error: 'Invalid integration' }
  const supabase = await createClient()
  const { error } = await supabase.from('integrations').upsert(
    {
      client_id: me.id,
      provider: parsed.data.provider,
      config: { value: parsed.data.value },
      enabled: parsed.data.enabled && parsed.data.value.length > 0,
    },
    { onConflict: 'client_id,provider' },
  )
  if (error) return { error: error.message }
  revalidatePath('/app/site/integrations')
  return { error: null, ok: true }
}
