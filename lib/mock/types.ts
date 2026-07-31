export type ContentDayStatus = 'upcoming' | 'completed' | 'draft'

export interface ContentDay {
  id: string
  date: string // ISO yyyy-MM-dd
  priceLabel: string
  city: string
  address: string
  capacity: number
  booked: number
  crew: string | null // crew id, null = unassigned
  status: ContentDayStatus
  hostRequirements: { label: string; done: boolean }[]
  bookedAgentIds: string[]
  history: ChangeEntry[]
}

export interface ChangeEntry {
  id: string
  at: string // ISO datetime
  who: string
  what: string
  notified: number // people notified
}

export type MembershipStatus = 'member' | 'non-member' | 'checkout' | 'info'

export interface Agent {
  id: string
  name: string
  email: string
  phone: string
  brokerage: string
  city: string
  status: MembershipStatus
  visits: number
  lifetimeSpend: number // dollars
  ratingsGiven: number
  lastSeen: string // ISO date
  joinedAtCheckoutAmount?: number
}

export type CrewRole = 'lead' | 'photographer' | 'drone' | 'director' | 'check-in'

export interface CrewMember {
  name: string
  role: CrewRole
}

export interface Crew {
  id: string
  name: string
  members: CrewMember[]
}

export type OrderStatus = 'paid' | 'pending' | 'failed'

export interface Order {
  id: string
  agentId: string
  agentName: string
  item: string
  amount: number
  date: string // ISO date
  status: OrderStatus
}

export interface Aggregates {
  members: number
  nonMembers: number
  joinedAtCheckout: number
  needMoreInfo: number
  totalCheckIns: number
  totalCheckouts: number
}

export type AttendanceStatus = 'booked' | 'checked-in' | 'no-show'

export interface RosterEntry {
  agentId: string
  agentName: string
  slot: string // "9:00 AM"
  computed: 'member' | 'first timer' | 'regular'
  attendance: AttendanceStatus
}
