import { Card } from './card'
import { Skeleton } from './skeleton'

interface MetricCardProps {
  label: string
  value: string | number | null
  hint?: string
  /** Smaller warning line under the number — for the problems worth surfacing. */
  note?: string
  trend?: number[] // small sparkline values
}

export function MetricCard({ label, value, hint, note, trend }: MetricCardProps) {
  const points = trend && trend.length > 1 ? trend : null
  const path = points
    ? points
        .map((v, i) => {
          const x = (i / (points.length - 1)) * 100
          const min = Math.min(...points)
          const max = Math.max(...points)
          const y = max === min ? 10 : 20 - ((v - min) / (max - min)) * 16 - 2
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
    : null

  return (
    <Card>
      <p className="text-12 text-dim">{label}</p>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className="tnum mt-1 text-28 font-medium text-gold">{value}</p>
      )}
      {hint ? <p className="mt-1 text-12 text-faint">{hint}</p> : null}
      {note ? <p className="mt-1 text-12 text-warn">{note}</p> : null}
      {path ? (
        <svg viewBox="0 0 100 20" className="mt-3 h-5 w-full" preserveAspectRatio="none" aria-hidden>
          <path d={path} fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
        </svg>
      ) : null}
    </Card>
  )
}
