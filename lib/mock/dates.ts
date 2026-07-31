import { addDays, format, subDays } from 'date-fns'

/**
 * Every mock date is generated at runtime relative to "now" so the demo never
 * goes stale — there is always a content day happening today, a busy week
 * ahead, and a fresh history behind.
 */

export function iso(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function todayIso(): string {
  return iso(new Date())
}

export function daysFromNow(n: number): string {
  return iso(addDays(new Date(), n))
}

export function daysAgo(n: number): string {
  return iso(subDays(new Date(), n))
}

export function isToday(date: string | null): boolean {
  return date !== null && date === todayIso()
}

export function currentMonthPrefix(): string {
  return format(new Date(), 'yyyy-MM')
}
