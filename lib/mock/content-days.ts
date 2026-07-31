import type { ContentDay } from './types'
import { AGENTS } from './agents'
import { daysAgo, daysFromNow, todayIso } from './dates'

const REQS = [
  { label: 'Owner approval on file', done: true },
  { label: 'Alarm code shared with crew', done: true },
  { label: 'Parking instructions', done: false },
  { label: 'Pool + patio staged', done: false },
]

function agents(from: number, count: number): string[] {
  return AGENTS.slice(from, from + count).map((a) => a.id)
}

// The real properties from the operation — dates are assigned at runtime:
// index 0 happens TODAY (in progress), 1-3 later this week, 4-9 across the
// next four weeks. The demo always looks alive.
const UPCOMING_OFFSETS = [0, 2, 3, 5, 8, 12, 16, 19, 23, 27]
const UPCOMING: Array<[string, string, string, number, number, string | null]> = [
  ['$4.125M', 'Jupiter Farms', '17593 Winterhawk, Jupiter FL 33478', 16, 14, 'c1'],
  ['$4.8M', 'Boca Raton', '9739 Chianti Classico Ter, Boca Raton FL 33496', 16, 14, 'c2'],
  ['$4.9M', 'Boca Raton', '662 Boca Marina Ct, Boca Raton FL 33487', 16, 9, 'c1'],
  ['$5.9M', 'Palm Beach Shores', '140 Inlet Way 312, Palm Beach Shores FL 33404', 12, 12, 'c3'],
  ['$4.7M', 'Wellington', '14473 Drafthorse Ln, Wellington FL 33414', 16, 7, null],
  ['$3M', 'Hollywood', '3535 S Ocean Drive 402, Hollywood FL 33019', 12, 5, 'c4'],
  ['$4.9M', 'Jupiter', '17727 SE Federal Hwy, Jupiter FL 33469', 16, 10, 'c2'],
  ['$13.6M', 'Miami Beach', '100 S Pointe Dr APT 1206, Miami Beach FL 33139', 20, 18, 'c5'],
  ['$6.5M', 'Lake Worth', '5593 Reynolds Road, Lake Worth FL 33449', 16, 6, null],
  ['$4M', 'Southwest Ranches', '17130 Magnolia Estates Dr, Southwest Ranches FL 33331', 16, 8, 'c3'],
]

// Eight completed over the past three weeks.
const PAST_OFFSETS = [2, 4, 6, 9, 12, 15, 18, 20]
const PAST: Array<[string, string, string, number, number, string]> = [
  ['$3.9M', 'Delray Beach', '945 Seasage Dr, Delray Beach FL 33483', 16, 15, 'c1'],
  ['$5.2M', 'Fort Lauderdale', '2543 Aqua Vista Blvd, Fort Lauderdale FL 33301', 16, 16, 'c2'],
  ['$2.8M', 'Coral Gables', '1210 Hardee Rd, Coral Gables FL 33146', 12, 11, 'c3'],
  ['$7.1M', 'Palm Beach', '210 Via Bellaria, Palm Beach FL 33480', 16, 14, 'c1'],
  ['$4.4M', 'Boca Raton', '2385 Areca Palm Rd, Boca Raton FL 33432', 16, 13, 'c4'],
  ['$6.8M', 'Miami Beach', '4830 Pine Tree Dr, Miami Beach FL 33140', 20, 17, 'c5'],
  ['$3.7M', 'Pinecrest', '6420 SW 104th St, Pinecrest FL 33156', 16, 12, 'c2'],
  ['$5.8M', 'Manalapan', '1140 S Ocean Blvd, Manalapan FL 33462', 16, 15, 'c3'],
]

// Drafts have no date yet — that is what makes them drafts.
const DRAFTS: Array<[string, string, string, number]> = [
  ['$5.5M', 'Parkland', '9081 Edgewater Bend, Parkland FL 33076', 16],
  ['$8.9M', 'Golden Beach', '355 Ocean Blvd, Golden Beach FL 33160', 20],
]

function build(): ContentDay[] {
  const out: ContentDay[] = []
  UPCOMING.forEach(([priceLabel, city, address, capacity, booked, crew], i) => {
    const date = daysFromNow(UPCOMING_OFFSETS[i] ?? i * 3)
    out.push({
      id: `cd${i + 1}`,
      date,
      startTime: '9:00 AM',
      priceLabel, city, address, capacity, booked, crew,
      status: 'upcoming',
      hostRequirements: REQS.map((r, j) => ({ ...r, done: j < 2 + (i % 3) })),
      bookedAgentIds: agents(i * 8, booked),
      history: [
        { id: `h${i}a`, at: `${daysAgo(14 + i)}T14:30:00`, who: 'Joe', what: 'Content Day created', notified: 0 },
        { id: `h${i}b`, at: `${daysAgo(3 + (i % 7))}T09:15:00`, who: 'Peter', what: crew ? `Assigned ${crew.replace('c', 'Crew ')}` : 'Capacity updated', notified: booked },
      ],
    })
  })
  PAST.forEach(([priceLabel, city, address, capacity, booked, crew], i) => {
    const date = daysAgo(PAST_OFFSETS[i] ?? 3 + i * 2)
    out.push({
      id: `cd${UPCOMING.length + i + 1}`,
      date,
      startTime: '9:00 AM',
      priceLabel, city, address, capacity, booked, crew,
      status: 'completed',
      hostRequirements: REQS.map((r) => ({ ...r, done: true })),
      bookedAgentIds: agents(i * 6 + 40, booked),
      history: [{ id: `hp${i}`, at: `${date}T18:00:00`, who: 'system', what: 'Marked completed', notified: 0 }],
    })
  })
  DRAFTS.forEach(([priceLabel, city, address, capacity], i) => {
    out.push({
      id: `cd${UPCOMING.length + PAST.length + i + 1}`,
      date: null,
      startTime: '9:00 AM',
      priceLabel, city, address, capacity,
      booked: 0, crew: null,
      status: 'draft',
      hostRequirements: REQS.map((r) => ({ ...r, done: false })),
      bookedAgentIds: [],
      history: [{ id: `hd${i}`, at: `${daysAgo(5)}T11:00:00`, who: 'Joe', what: 'Draft created', notified: 0 }],
    })
  })
  return out
}

export const CONTENT_DAYS: ContentDay[] = build()

/** The shoot happening right now, if any. */
export function todaysContentDay(): ContentDay | null {
  return CONTENT_DAYS.find((d) => d.date === todayIso()) ?? null
}
