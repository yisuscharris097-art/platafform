import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-raised', className)} />
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-0 rounded-lg border border-border bg-surface">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-[44px] items-center gap-4 border-b border-border px-4 last:border-0">
          <Skeleton className="h-3 w-1/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/6" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
