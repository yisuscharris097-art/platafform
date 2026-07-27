'use client'
import { useActionState, useState } from 'react'
import { saveSectionDraft, type ActionState } from '@/lib/actions/cms'
import { SECTION_FIELDS, type SectionRow } from '@/lib/cms'

const inputCls = 'w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'

export default function SectionEditor({
  section,
  clientId,
  flagshipLocked,
}: {
  section: SectionRow
  clientId: string
  flagshipLocked: boolean
}) {
  const cfg = SECTION_FIELDS[section.kind]
  const base = section.draft ?? section.content
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const f of cfg.fields) v[f.name] = typeof base[f.name] === 'string' ? (base[f.name] as string) : ''
    return v
  })
  const [enabled, setEnabled] = useState(section.enabled)
  const [uploading, setUploading] = useState(false)
  const [state, formAction, pending] = useActionState(saveSectionDraft, { error: null } as ActionState)

  async function uploadImage(name: string, file: File | null) {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.set('client_id', clientId)
    fd.set('file', file)
    const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
    const json = (await res.json()) as { url?: string; error?: string }
    if (json.url) setValues((v) => ({ ...v, [name]: json.url as string }))
    setUploading(false)
  }

  return (
    <div className={`rounded-xl border border-border bg-white p-5 ${flagshipLocked ? 'opacity-60' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium">
          {cfg.title}
          {section.draft && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">DRAFT</span>}
        </p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={enabled} disabled={flagshipLocked} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      {flagshipLocked ? (
        <p className="text-sm text-muted-foreground">Flagship-tier feature. Upgrade to edit this section.</p>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="section_id" value={section.id} />
          <input type="hidden" name="kind" value={section.kind} />
          <input type="hidden" name="enabled" value={String(enabled)} />
          <input type="hidden" name="payload" value={JSON.stringify(values)} />
          {cfg.fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea rows={4} value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} className={inputCls} />
              ) : f.type === 'image' ? (
                <div className="flex items-center gap-3">
                  {values[f.name] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={values[f.name]} alt="" className="h-14 w-20 rounded object-cover" />
                  ) : null}
                  <input type="file" accept="image/*" disabled={uploading} onChange={(e) => uploadImage(f.name, e.target.files?.[0] ?? null)} className="text-sm" />
                </div>
              ) : (
                <input value={values[f.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))} className={inputCls} />
              )}
            </div>
          ))}
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending || uploading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {uploading ? 'Uploading…' : pending ? 'Saving…' : 'Save draft'}
          </button>
        </form>
      )}
    </div>
  )
}
