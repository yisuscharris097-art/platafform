import type { ContentDay } from './types'
import { AGENTS } from './agents'

const REQS = [
  { label: 'Owner approval on file', done: true },
  { label: 'Alarm code shared with crew', done: true },
  { label: 'Parking instructions', done: false },
  { label: 'Pool + patio staged', done: false },
]

function agents(from: number, count: number): string[] {
  return AGENTS.slice(from, from + count).map((a) => a.id)
}

// Real upcoming shoots, exactly as provided.
const UPCOMING: Array<[string, string, string, string, number, number, string | null]> = [
  ['2026-08-03', '$4.125M', 'Jupiter Farms', '17593 Winterhawk, Jupiter FL 33478', 16, 12, 'c1'],
  ['2026-08-04', '$4.8M', 'Boca Raton', '9739 Chianti Classico Ter, Boca Raton FL 33496', 16, 14, 'c2'],
  ['2026-08-05', '$4.9M', 'Boca Raton', '662 Boca Marina Ct, Boca Raton FL 33487', 16, 9, 'c1'],
  ['2026-08-06', '$5.9M', 'Palm Beach Shores', '140 Inlet Way 312, Palm Beach Shores FL 33404', 12, 12, 'c3'],
  ['2026-08-07', '$4.7M', 'Wellington', '14473 Drafthorse Ln, Wellington FL 33414', 16, 7, null],
  ['2026-08-12', '$3M', 'Hollywood', '3535 S Ocean Drive 402, Hollywood FL 33019', 12, 5, 'c4'],
  ['2026-08-18', '$4.9M', 'Jupiter', '17727 SE Federal Hwy, Jupiter FL 33469', 16, 10, 'c2'],
  ['2026-08-20', '$13.6M', 'Miami Beach', '100 S Pointe Dr APT 1206, Miami Beach FL 33139', 20, 18, 'c5'],
  ['2026-08-21', '$6.5M', 'Lake Worth', '5593 Reynolds Road, Lake Worth FL 33449', 16, 6, null],
  ['2026-08-24', '$4M', 'Southwest Ranches', '17130 Magnolia Estates Dr, Southwest Ranches FL 33331', 16, 8, 'c3'],
]

const PAST: Array<[string, string, string, string, number, number, string]> = [
  ['2026-07-08', '$3.9M', 'Delray Beach', '945 Seasage Dr, Delray Beach FL 33483', 16, 15, 'c1'],
  ['2026-07-10', '$5.2M', 'Fort Lauderdale', '2543 Aqua Vista Blvd, Fort Lauderdale FL 33301', 16, 16, 'c2'],
  ['2026-07-15', '$2.8M', 'Coral Gables', '1210 Hardee Rd, Coral Gables FL 33146', 12, 11, 'c3'],
  ['2026-07-17', '$7.1M', 'Palm Beach', '210 Via Bellaria, Palm Beach FL 33480', 16, 14, 'c1'],
  ['2026-07-22', '$4.4M', 'Boca Raton', '2385 Areca Palm Rd, Boca Raton FL 33432', 16, 13, 'c4'],
  ['2026-07-24', '$6.8M', 'Miami', '4830 Pine Tree Dr, Miami Beach FL 33140', 20, 17, 'c5'],
]

const DRAFTS: Array<[string, string, string, string, number]> = [
  ['2026-09-02', '$5.5M', 'Parkland', '9081 Edgewater Bend, Parkland FL 33076', 16],
  ['2026-09-09', '$8.9M', 'Golden Beach', '355 Ocean Blvd, Golden Beach FL 33160', 20],
]

function build(): ContentDay[] {
  const out: ContentDay[] = []
  UPCOMING.forEach(([date, priceLabel, city, address, capacity, booked, crew], i) => {
    out.push({
      id: `cd${i + 1}`,
      date, priceLabel, city, address, capacity, booked, crew,
      status: 'upcoming',
      hostRequirements: REQS.map((r, j) => ({ ...r, done: j < 2 + (i % 3) })),
      bookedAgentIds: agents(i * 8, booked),
      history: [
        { id: `h${i}a`, at: `2026-07-${String(10 + i).padStart(2, '0')}T14:30:00`, who: 'Joe', what: 'Content Day created', notified: 0 },
        { id: `h${i}b`, at: `2026-07-${String(18 + (i % 10)).padStart(2, '0')}T09:15:00`, who: 'Peter', what: crew ? `Assigned ${crew.replace('c', 'Crew ')}` : 'Capacity updated', notified: booked },
      ],
    })
  })
  PAST.forEach(([date, priceLabel, city, address, capacity, booked, crew], i) => {
    out.push({
      id: `cd${UPCOMING.length + i + 1}`,
      date, priceLabel, city, address, capacity, booked, crew,
      status: 'completed',
      hostRequirements: REQS.map((r) => ({ ...r, done: true })),
      bookedAgentIds: agents(i * 6 + 40, booked),
      history: [{ id: `hp${i}`, at: `${date}T18:00:00`, who: 'system', what: 'Marked completed', notified: 0 }],
    })
  })
  DRAFTS.forEach(([date, priceLabel, city, address, capacity], i) => {
    out.push({
      id: `cd${UPCOMING.length + PAST.length + i + 1}`,
      date, priceLabel, city, address, capacity,
      booked: 0, crew: null,
      status: 'draft',
      hostRequirements: REQS.map((r) => ({ ...r, done: false })),
      bookedAgentIds: [],
      history: [{ id: `hd${i}`, at: '2026-07-26T11:00:00', who: 'Joe', what: 'Draft created', notified: 0 }],
    })
  })
  return out
}

export const CONTENT_DAYS: ContentDay[] = build()
