/**
 * Eject (brief §2): the contract promises the client owns their site's code.
 * A multi-tenant app cannot be handed over as-is, so this generates a
 * STANDALONE Next.js repo for one client:
 *
 *   npx pnpm eject --client=<slug>
 *
 * • Content read from Postgres → committed as local JSON (content/*.json)
 * • Images downloaded to /public/media — no database, no platform dependency
 * • `output: "export"` — deploys anywhere (Cloudflare Pages, Netlify, S3…)
 * • Output: ejects/<slug>/ + ejects/<slug>.zip
 */
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

loadEnv({ path: '.env.local' })
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !SERVICE) {
  console.error('Missing Supabase env (.env.local)')
  process.exit(1)
}
const slugArg = process.argv.find((a) => a.startsWith('--client='))
const slug = slugArg?.split('=')[1]
if (!slug) {
  console.error('Usage: pnpm eject --client=<slug>')
  process.exit(1)
}

const db = createClient(URL, SERVICE, { auth: { persistSession: false } })

interface SectionOut {
  kind: string
  position: number
  enabled: boolean
  content: Record<string, unknown>
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    return true
  } catch {
    return false
  }
}

/** Rewrites remote media URLs inside content to local /media/* paths. */
function localizeUrls(obj: Record<string, unknown>, map: Map<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' && map.has(v) ? (map.get(v) as string) : v
  }
  return out
}

async function main(): Promise<void> {
  const { data: clientData } = await db
    .from('clients')
    .select('id, slug, display_name, brokerage, market, primary_domain, tier')
    .eq('slug', slug)
    .maybeSingle()
  if (!clientData) {
    console.error(`Client not found: ${slug}`)
    process.exit(1)
  }
  const client = clientData as { id: string; slug: string; display_name: string; brokerage: string | null; market: string | null; primary_domain: string | null; tier: string }

  const { data: siteData } = await db.from('sites').select('id, theme_tokens').eq('client_id', client.id).maybeSingle()
  const site = siteData as { id: string; theme_tokens: Record<string, unknown> } | null
  const { data: sectionsData } = site
    ? await db.from('site_sections').select('kind, position, enabled, content').eq('site_id', site.id).order('position')
    : { data: [] }
  const { data: listingsData } = await db
    .from('listings')
    .select('address, city, state, price_cents, beds, baths, sqft, status, featured, gallery')
    .eq('client_id', client.id)
    .order('position')

  const root = join(process.cwd(), 'ejects', client.slug)
  if (existsSync(root)) rmSync(root, { recursive: true })
  mkdirSync(join(root, 'content'), { recursive: true })
  mkdirSync(join(root, 'public', 'media'), { recursive: true })
  mkdirSync(join(root, 'app'), { recursive: true })

  // 1) Download every referenced image → /public/media, remember the mapping.
  const urlMap = new Map<string, string>()
  const sections = ((sectionsData ?? []) as SectionOut[]).map((s) => ({ ...s }))
  let i = 0
  for (const s of sections) {
    for (const v of Object.values(s.content)) {
      if (typeof v === 'string' && /^https?:\/\//.test(v) && /supabase|storage/.test(v)) {
        const name = `media-${i++}${v.includes('.webp') ? '.webp' : '.jpg'}`
        if (await download(v, join(root, 'public', 'media', name))) urlMap.set(v, `/media/${name}`)
      }
    }
    s.content = localizeUrls(s.content, urlMap)
  }

  // 2) Content committed as local JSON — the site owns its data.
  writeFileSync(join(root, 'content', 'client.json'), JSON.stringify(client, null, 2))
  writeFileSync(join(root, 'content', 'sections.json'), JSON.stringify(sections, null, 2))
  writeFileSync(join(root, 'content', 'listings.json'), JSON.stringify(listingsData ?? [], null, 2))
  writeFileSync(join(root, 'content', 'theme.json'), JSON.stringify(site?.theme_tokens ?? {}, null, 2))

  // 3) Minimal standalone Next.js repo (static export).
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify(
      {
        name: `${client.slug}-site`,
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: { next: '^15.1.6', react: '^19.0.0', 'react-dom': '^19.0.0' },
      },
      null,
      2,
    ),
  )
  writeFileSync(join(root, 'next.config.mjs'), `const nextConfig = { output: 'export' }\nexport default nextConfig\n`)
  writeFileSync(
    join(root, 'app', 'layout.jsx'),
    `export const metadata = { title: ${JSON.stringify(client.display_name)} }\n` +
      `export default function RootLayout({ children }) {\n  return (<html lang="en"><body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body></html>)\n}\n`,
  )
  writeFileSync(
    join(root, 'app', 'page.jsx'),
    `import sections from '../content/sections.json'\nimport listings from '../content/listings.json'\nimport client from '../content/client.json'\n\n` +
      `export default function Home() {\n  return (\n    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>\n` +
      `      {sections.filter(s => s.enabled).map(s => (\n        <section key={s.kind} style={{ padding: '32px 0', borderBottom: '1px solid #eee' }}>\n` +
      `          <h2 style={{ textTransform: 'capitalize' }}>{s.kind}</h2>\n` +
      `          {Object.entries(s.content).map(([k, v]) => (\n            <p key={k}>{String(v).startsWith('/media/') ? <img src={String(v)} alt={k} style={{ maxWidth: '100%' }} /> : String(v)}</p>\n          ))}\n` +
      `          {s.kind === 'listings' && listings.map((l, idx) => (\n            <div key={idx} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 8 }}>\n` +
      `              <strong>{l.address}</strong> — {l.beds ?? '—'}BD/{l.baths ?? '—'}BA · {l.price_cents ? '$' + (l.price_cents / 100).toLocaleString() : ''}\n            </div>\n          ))}\n        </section>\n      ))}\n` +
      `      <footer style={{ padding: '32px 0', color: '#666' }}>© {new Date().getFullYear()} {client.display_name}</footer>\n    </main>\n  )\n}\n`,
  )
  writeFileSync(
    join(root, 'README.md'),
    `# ${client.display_name} — standalone site\n\nYour content lives in \`content/*.json\`, your images in \`public/media\`.\nNo database, no external platform.\n\n\`\`\`\nnpm install\nnpm run build   # static output in /out — host it anywhere\n\`\`\`\n`,
  )
  writeFileSync(join(root, '.gitignore'), 'node_modules/\n.next/\nout/\n')

  // 4) Zip it.
  const zipPath = join(process.cwd(), 'ejects', `${client.slug}.zip`)
  if (existsSync(zipPath)) rmSync(zipPath)
  execSync(`cd ${JSON.stringify(join(process.cwd(), 'ejects'))} && zip -rq ${JSON.stringify(`${client.slug}.zip`)} ${JSON.stringify(client.slug)}`)

  console.log(`✅ Ejected ${client.display_name}`)
  console.log(`   repo: ejects/${client.slug}/`)
  console.log(`   zip:  ejects/${client.slug}.zip`)
  console.log(`   ${sections.length} sections · ${(listingsData ?? []).length} listings · ${urlMap.size} media files localized`)
}

main().catch((e: unknown) => {
  console.error('eject failed:', e instanceof Error ? e.message : e)
  process.exit(1)
})
