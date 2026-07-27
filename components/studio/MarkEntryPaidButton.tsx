'use client'
import { useActionState } from 'react'
import { markEntryPaid, type ActionState } from '@/lib/actions/commissions'

export default function MarkEntryPaidButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(markEntryPaid, { error: null } as ActionState)
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? '…' : 'Mark paid'}
      </button>
    </form>
  )
}
