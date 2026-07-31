import type { Agent, Aggregates, ContentDay, Crew, Order, RosterEntry } from './types'
import { AGENTS } from './agents'
import { CONTENT_DAYS } from './content-days'
import { CREWS } from './crews'
import { ORDERS } from './orders'

/**
 * Mock API. Treat as a real backend: every read is async with a small delay so
 * loading states render, every mutation touches the in-memory stores and the
 * next read reflects it. Nothing persists across reloads — by design.
 */

const DELAY = 400

function sleep(ms = DELAY): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 938 is the count of checkout RECORDS flagged as member — not people. The
 * same agent appears many times (one has six records). This simulates that
 * ledger and dedupes by normalized email (lowercase, trimmed), which is how
 * the real cleanup will work.
 */
function uniqueMemberCount(): number {
  const records: string[] = []
  let person = 0
  while (records.length < 938) {
    const copies = person % 29 === 0 ? 6 : person % 7 === 0 ? 3 : person % 4 === 0 ? 2 : 1
    for (let c = 0; c < copies && records.length < 938; c++) {
      const raw = `agent.${person}@example.com`
      records.push(c % 2 === 0 ? raw : `  ${raw.toUpperCase()} `)
    }
    person++
  }
  return new Set(records.map((e) => e.trim().toLowerCase())).size
}

// Real aggregate numbers — must match the dashboard spec.
export const AGGREGATES: Aggregates = {
  members: 938,
  nonMembers: 452,
  joinedAtCheckout: 305,
  needMoreInfo: 117,
  totalCheckIns: 1929,
  totalCheckouts: 1812,
  uniqueMembers: uniqueMemberCount(),
}

export async function getAggregates(): Promise<Aggregates> {
  await sleep()
  return AGGREGATES
}

export async function getContentDays(): Promise<ContentDay[]> {
  await sleep()
  return [...CONTENT_DAYS]
}

export async function getContentDay(id: string): Promise<ContentDay | null> {
  await sleep()
  return CONTENT_DAYS.find((d) => d.id === id) ?? null
}

export async function updateContentDay(id: string, patch: Partial<ContentDay>): Promise<ContentDay | null> {
  await sleep(250)
  const day = CONTENT_DAYS.find((d) => d.id === id)
  if (!day) return null
  Object.assign(day, patch)
  return day
}

export async function createContentDay(
  input: Pick<ContentDay, 'date' | 'priceLabel' | 'city' | 'address' | 'capacity'>,
): Promise<ContentDay> {
  await sleep(250)
  const day: ContentDay = {
    id: `cd${CONTENT_DAYS.length + 1}-${CONTENT_DAYS.length * 7 + 13}`,
    startTime: '9:00 AM',
    ...input,
    booked: 0,
    crew: null,
    status: 'draft',
    hostRequirements: [
      { label: 'Owner approval on file', done: false },
      { label: 'Alarm code shared with crew', done: false },
      { label: 'Parking instructions', done: false },
      { label: 'Pool + patio staged', done: false },
    ],
    bookedAgentIds: [],
    history: [{ id: `hn${CONTENT_DAYS.length}`, at: new Date().toISOString(), who: 'Joe', what: 'Draft created', notified: 0 }],
  }
  CONTENT_DAYS.unshift(day)
  return day
}

export async function getAgents(): Promise<Agent[]> {
  await sleep()
  return [...AGENTS]
}

export async function getAgent(id: string): Promise<Agent | null> {
  await sleep()
  return AGENTS.find((a) => a.id === id) ?? null
}

export async function getCrews(): Promise<Crew[]> {
  await sleep()
  return [...CREWS]
}

export async function getOrders(): Promise<Order[]> {
  await sleep()
  return [...ORDERS]
}

// ---- Roster (field app + dashboard "today" panel) ----

const rosters = new Map<string, RosterEntry[]>()

function computeStatus(agent: Agent): RosterEntry['computed'] {
  if (agent.status === 'member') return 'member'
  if (agent.visits <= 1) return 'first timer'
  return 'regular'
}

export async function getRoster(contentDayId: string): Promise<RosterEntry[]> {
  await sleep()
  const existing = rosters.get(contentDayId)
  if (existing) return [...existing]
  const day = CONTENT_DAYS.find((d) => d.id === contentDayId)
  if (!day) return []
  const slots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM']
  const today = day.date !== null && day.date === new Date().toISOString().slice(0, 10)
  const roster: RosterEntry[] = day.bookedAgentIds.map((agentId, i) => {
    const agent = AGENTS.find((a) => a.id === agentId)
    // Today's shoot is mid-session: most guests are in, one no-showed, and the
    // later slots are still pending.
    const attendance =
      day.status === 'completed'
        ? i % 9 === 8
          ? 'no-show'
          : 'checked-in'
        : today
          ? i === 5
            ? 'no-show'
            : i < day.bookedAgentIds.length - 3
              ? 'checked-in'
              : 'booked'
          : 'booked'
    return {
      agentId,
      agentName: agent?.name ?? 'Unknown agent',
      slot: slots[i % slots.length] ?? '9:00 AM',
      computed: agent ? computeStatus(agent) : 'first timer',
      attendance,
    }
  })
  rosters.set(contentDayId, roster)
  return [...roster]
}

export async function setAttendance(
  contentDayId: string,
  agentId: string,
  attendance: RosterEntry['attendance'],
): Promise<void> {
  await sleep(150)
  const roster = rosters.get(contentDayId)
  const entry = roster?.find((r) => r.agentId === agentId)
  if (entry) entry.attendance = attendance
}
