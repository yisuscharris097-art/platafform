import type { Crew } from './types'

export const CREWS: Crew[] = [
  {
    id: 'c1',
    name: 'Crew 1',
    members: [
      { name: 'Peter', role: 'lead' },
      { name: 'Nate', role: 'photographer' },
      { name: 'Marcus Vell', role: 'drone' },
      { name: 'Dana Ortiz', role: 'check-in' },
    ],
  },
  {
    id: 'c2',
    name: 'Crew 2',
    members: [
      { name: 'Joseph', role: 'lead' },
      { name: 'Sam', role: 'photographer' },
      { name: 'Iris Chen', role: 'director' },
    ],
  },
  {
    id: 'c3',
    name: 'Crew 3',
    members: [
      { name: 'Nate', role: 'lead' },
      { name: 'Ray Delmar', role: 'photographer' },
      { name: 'Tommy Alba', role: 'drone' },
    ],
  },
  {
    id: 'c4',
    name: 'Crew 4',
    members: [
      { name: 'Sam', role: 'lead' },
      { name: 'Lena Frost', role: 'photographer' },
      { name: 'Omar Reyes', role: 'check-in' },
    ],
  },
  {
    id: 'c5',
    name: 'Crew 5',
    members: [
      { name: 'Peter', role: 'director' },
      { name: 'Joseph', role: 'photographer' },
      { name: 'Ava Sterling', role: 'drone' },
      { name: 'Cole Bryant', role: 'check-in' },
    ],
  },
]

export function crewName(id: string | null): string {
  if (!id) return 'Unassigned'
  return CREWS.find((c) => c.id === id)?.name ?? id
}
