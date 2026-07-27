'use client'
import { useActionState } from 'react'
import { markLeadRead, type ActionState } from '@/lib/actions/leads'

export default function MarkReadButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(markLeadRead, { error: null } as ActionState)
  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-xs font-medium text-muted-foreground hover:text-foreground">
        {pending ? '…' : 'Mark as read'}
      </button>
    </form>
  )
}
