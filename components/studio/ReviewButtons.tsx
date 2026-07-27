'use client'
import { useActionState } from 'react'
import { reviewIntakeBlock, type ActionState } from '@/lib/actions/intake'

export default function ReviewButtons({ blockId }: { blockId: string }) {
  const [state, formAction, pending] = useActionState(reviewIntakeBlock, { error: null } as ActionState)
  return (
    <form action={formAction} className="mt-4 flex items-center gap-2">
      <input type="hidden" name="block_id" value={blockId} />
      <button
        name="decision"
        value="validated"
        disabled={pending}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Validate
      </button>
      <button
        name="decision"
        value="rejected"
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
      >
        Reject
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  )
}
