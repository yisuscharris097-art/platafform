'use client'
import { useActionState } from 'react'
import { publishSite, type ActionState } from '@/lib/actions/cms'

export interface DiffItem {
  section: string
  fields: string[]
}

export default function PublishPanel({ diffs, lastPublishedAt }: { diffs: DiffItem[]; lastPublishedAt: string | null }) {
  const [state, formAction, pending] = useActionState(publishSite, { error: null } as ActionState)
  const hasChanges = diffs.length > 0

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Publish</p>
          <p className="text-xs text-muted-foreground">
            Last published: {lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : 'never'}
          </p>
        </div>
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending || !hasChanges}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {pending ? 'Publishing…' : 'Publish changes'}
          </button>
        </form>
      </div>

      {/* The diff of what will change, before publishing (brief §6) */}
      {hasChanges ? (
        <ul className="mt-3 space-y-1 text-sm">
          {diffs.map((d) => (
            <li key={d.section} className="text-muted-foreground">
              <span className="font-medium capitalize text-foreground">{d.section}</span>
              {' — '}
              {d.fields.join(', ')}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No draft changes to publish.</p>
      )}
      {state.ok && <p className="mt-2 text-sm text-green-700">Published ✓ — deploy hook fired.</p>}
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  )
}
