import { cn } from '@/lib/cn'

type Tone = 'success' | 'warn' | 'danger' | 'neutral'

const TONES: Record<Tone, string> = {
  success: 'border-success/40 bg-success/10 text-success',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  neutral: 'border-border text-dim',
}

/** Maps domain statuses to a tone so screens never pick colors themselves. */
export function toneFor(status: string): Tone {
  if (['member', 'paid', 'delivered', 'checked-in', 'completed', 'live'].includes(status)) return 'success'
  if (['pending', 'awaiting', 'upcoming', 'checkout', 'booked', 'in edit', 'qc'].includes(status)) return 'warn'
  if (['no-show', 'failed', 'overdue', 'conflict'].includes(status)) return 'danger'
  return 'neutral'
}

export function StatusPill({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2.5 text-12',
        TONES[toneFor(status)],
        className,
      )}
    >
      {label ?? status}
    </span>
  )
}
