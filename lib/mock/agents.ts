import type { Agent, MembershipStatus } from './types'
import { daysAgo } from './dates'

/** Brokerage from email domain — mirrors how the real ops sheet does it. */
export function brokerageFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? ''
  const map: Record<string, string> = {
    'kw.com': 'Keller Williams',
    'compass.com': 'Compass',
    'elliman.com': 'Douglas Elliman',
    'keyes.com': 'The Keyes Company',
    'onesothebysrealty.com': "ONE Sotheby's",
    'bhhsfloridarealty.com': 'Berkshire Hathaway',
  }
  return map[domain] ?? 'Independent'
}

interface SeedAgent {
  name: string
  email: string
  status: MembershipStatus
  visits?: number
  spend?: number
  checkoutAmount?: number
}

// The 20 real records — kept exactly as provided.
const REAL: SeedAgent[] = [
  { name: 'Andrea Larsen', email: 'andrealarsenfl@gmail.com', status: 'member', visits: 6, spend: 641 },
  { name: 'Kristi Dye', email: 'kristidye@keyes.com', status: 'member', visits: 4, spend: 388 },
  { name: 'Tania Senior', email: 'seniortania11@icloud.com', status: 'member', visits: 2, spend: 194 },
  { name: 'James Benoit', email: 'jamesb.sellshouses@gmail.com', status: 'non-member', visits: 3, spend: 261 },
  { name: 'Bonnie Kaufman', email: 'bonniekaufmanrealtor@gmail.com', status: 'member', visits: 1, spend: 97 },
  { name: 'Carline Rodriguez', email: 'carlinerodriguez@kw.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Saiyid Hussain', email: 'saiyid.hussain@kw.com', status: 'non-member', visits: 1, spend: 87 },
  { name: 'Jennifer Mirabal', email: 'jenmirabalrealtor@gmail.com', status: 'member', visits: 3, spend: 291 },
  { name: 'Heber Santiago', email: 'info@hebersantiago.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Elena Beck', email: 'miamiinvestgroup17@gmail.com', status: 'checkout', visits: 1, spend: 97, checkoutAmount: 97 },
  { name: 'Keaton Daley', email: 'daleyrealestate2@gmail.com', status: 'checkout', visits: 1, spend: 127, checkoutAmount: 127 },
  { name: 'Michelle Kirschner', email: 'michelle.kirschner@elliman.com', status: 'checkout', visits: 1, spend: 127, checkoutAmount: 127 },
  { name: 'Larisa Puscarenco', email: 'larisa.lavoro@hotmail.it', status: 'non-member', visits: 1, spend: 0 },
  { name: 'Silvana Prada', email: 'silvanapradarealty@gmail.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Jared Haugland', email: 'homesbyhaugland@gmail.com', status: 'member', visits: 3, spend: 291 },
  { name: 'Tecovia Harper', email: 'homes@tecoviaharper.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Erica Elliott', email: 'ericaelliott@kw.com', status: 'member', visits: 3, spend: 282 },
  { name: 'Dennis Lue Yat', email: 'dennis@luxeiqgroup.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Megan Tolle', email: 'megantolle@bhhsfloridarealty.com', status: 'member', visits: 2, spend: 194 },
  { name: 'Marisol Cruz', email: 'marisol@cruzlanthier.com', status: 'checkout', visits: 1, spend: 127, checkoutAmount: 127 },
]

const FIRST = ['Alexandra', 'Marcus', 'Sofia', 'Daniel', 'Valentina', 'Ryan', 'Camila', 'Brandon', 'Isabella', 'Tyler', 'Gabriela', 'Jordan', 'Natalia', 'Kevin', 'Mariana', 'Austin', 'Daniela', 'Chase', 'Lucia', 'Trevor', 'Paola', 'Derek', 'Fernanda', 'Colin', 'Adriana', 'Blake', 'Carolina', 'Grant', 'Veronica', 'Wesley', 'Bianca', 'Preston', 'Alejandra', 'Shane', 'Roxana', 'Miles', 'Patricia', 'Logan', 'Ingrid', 'Reid']
const LAST = ['Morales', 'Whitfield', 'Delgado', 'Sterling', 'Paz', 'Callahan', 'Rivas', 'Beaumont', 'Fuentes', 'Langford', 'Osorio', 'Prescott', 'Machado', 'Winslow', 'Cardona', 'Ashford', 'Zamora', 'Hollis', 'Serrano', 'Mercer', 'Pineda', 'Kingsley', 'Rojas', 'Thatcher', 'Escobar', 'Marlowe', 'Uribe', 'Sinclair', 'Vergara', 'Radcliffe']
const DOMAINS = ['kw.com', 'compass.com', 'elliman.com', 'keyes.com', 'onesothebysrealty.com', 'gmail.com', 'gmail.com', 'bhhsfloridarealty.com']
const CITIES = ['Boca Raton', 'Miami', 'Fort Lauderdale', 'Jupiter', 'Wellington', 'Delray Beach', 'West Palm Beach', 'Coral Gables', 'Hollywood', 'Palm Beach Gardens']
const STATUS_CYCLE: MembershipStatus[] = ['member', 'member', 'non-member', 'member', 'checkout', 'non-member', 'member', 'info']

function at<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length] as T
}

function phone(i: number): string {
  return `(561) ${String(200 + ((i * 7) % 700)).padStart(3, '0')}-${String(1000 + ((i * 137) % 9000)).padStart(4, '0')}`
}

function lastSeen(i: number): string {
  // Spread activity across the trailing seven weeks, freshest first.
  return daysAgo(1 + ((i * 3) % 49))
}

function build(): Agent[] {
  const out: Agent[] = REAL.map((s, i) => ({
    id: `a${i + 1}`,
    name: s.name,
    email: s.email,
    phone: phone(i),
    brokerage: brokerageFromEmail(s.email),
    city: at(CITIES, i),
    status: s.status,
    visits: s.visits ?? 1,
    lifetimeSpend: s.spend ?? 0,
    ratingsGiven: Math.min(s.visits ?? 0, 3),
    lastSeen: lastSeen(i),
    joinedAtCheckoutAmount: s.checkoutAmount,
  }))

  for (let i = 0; i < 100; i++) {
    const first = at(FIRST, i)
    const last = at(LAST, i * 3 + Math.floor(i / FIRST.length))
    const domain = at(DOMAINS, i)
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`
    const status = at(STATUS_CYCLE, i)
    const visits = status === 'member' ? 1 + (i % 5) : i % 3
    out.push({
      id: `a${out.length + 1}`,
      name: `${first} ${last}`,
      email,
      phone: phone(i + 20),
      brokerage: brokerageFromEmail(email),
      city: at(CITIES, i * 3),
      status,
      visits,
      lifetimeSpend: visits * 97 + (i % 4) * 30,
      ratingsGiven: Math.min(visits, 2),
      lastSeen: lastSeen(i + 20),
      joinedAtCheckoutAmount: status === 'checkout' ? (i % 2 === 0 ? 97 : 127) : undefined,
    })
  }
  return out
}

export const AGENTS: Agent[] = build()
