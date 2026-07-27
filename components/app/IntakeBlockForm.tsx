'use client'
import { useActionState, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitIntakeBlock, type ActionState } from '@/lib/actions/intake'
import { INTAKE_FIELDS, type IntakeBlockRow } from '@/lib/intake'

const inputCls = 'w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-foreground'

export default function IntakeBlockForm({ block }: { block: IntakeBlockRow }) {
  const cfg = INTAKE_FIELDS[block.block]
  const [values, setValues] = useState<Record<string, string | string[]>>(() => {
    const v: Record<string, string | string[]> = {}
    for (const f of cfg.fields) {
      const existing = block.payload[f.name]
      v[f.name] = Array.isArray(existing) ? (existing as string[]) : typeof existing === 'string' ? existing : f.type === 'files' ? [] : ''
    }
    return v
  })
  const [uploading, setUploading] = useState(false)
  const [state, formAction, pending] = useActionState(submitIntakeBlock, { error: null } as ActionState)

  const locked = block.status === 'validated'

  async function uploadFiles(name: string, files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = Array.isArray(values[name]) ? [...(values[name] as string[])] : []
    for (const file of Array.from(files)) {
      const path = `${block.client_id}/${block.block}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error } = await supabase.storage.from('client-media').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('client-media').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setValues((v) => ({ ...v, [name]: urls }))
    setUploading(false)
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium">{cfg.title}</p>
          <p className="text-xs text-muted-foreground">{cfg.hint}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            block.status === 'validated'
              ? 'bg-green-100 text-green-700'
              : block.status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : block.status === 'submitted'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-muted text-muted-foreground'
          }`}
        >
          {block.status}
        </span>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="block_id" value={block.id} />
        <input type="hidden" name="payload" value={JSON.stringify(values)} />
        {cfg.fields.map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {f.label}
              {f.required ? ' *' : ''}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                rows={4}
                disabled={locked}
                value={values[f.name] as string}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className={inputCls}
              />
            ) : f.type === 'files' ? (
              <div className="space-y-2">
                <input type="file" multiple accept="image/*,.pdf" disabled={locked || uploading} onChange={(e) => uploadFiles(f.name, e.target.files)} className="text-sm" />
                <div className="flex flex-wrap gap-2">
                  {(values[f.name] as string[]).map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" className="max-w-40 truncate rounded bg-muted px-2 py-1 text-xs">
                      {u.split('/').pop()}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <input
                type={f.type === 'color' ? 'color' : 'text'}
                disabled={locked}
                value={(values[f.name] as string) || (f.type === 'color' ? '#000000' : '')}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                className={f.type === 'color' ? 'h-10 w-20 rounded border border-border' : inputCls}
              />
            )}
          </div>
        ))}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {!locked && (
          <button
            type="submit"
            disabled={pending || uploading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : pending ? 'Saving…' : block.status === 'rejected' ? 'Resubmit' : 'Submit block'}
          </button>
        )}
      </form>
    </div>
  )
}
