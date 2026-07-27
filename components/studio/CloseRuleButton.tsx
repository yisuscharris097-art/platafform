'use client'
import { useActionState } from 'react'
import { closeRuleAction, type ActionState } from '@/lib/actions/commissions'

export default function CloseRuleButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(closeRuleAction, { error: null } as ActionState)
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-xs text-muted-foreground hover:text-red-600">
        {pending ? '…' : 'Close today'}
      </button>
    </form>
  )
}
