import type { Order, OrderStatus } from './types'
import { AGENTS } from './agents'
import { daysAgo } from './dates'

const ITEMS: Array<[string, number]> = [
  ['Content Day session', 97],
  ['Content Day session (non-member)', 127],
  ['Membership — monthly', 97],
  ['Twilight add-on', 60],
  ['Drone reel add-on', 85],
  ['Extra listing photos', 45],
]

function build(): Order[] {
  const out: Order[] = []
  const buyers = AGENTS.filter((a) => a.lifetimeSpend > 0).slice(0, 48)
  buyers.forEach((a, i) => {
    const [item, amount] = ITEMS[i % ITEMS.length] ?? ['Content Day session', 97]
    const status: OrderStatus = i % 11 === 10 ? 'failed' : i % 7 === 6 ? 'pending' : 'paid'
    out.push({
      id: `o${1000 + i}`,
      agentId: a.id,
      agentName: a.name,
      item,
      amount: a.joinedAtCheckoutAmount && i % 3 === 0 ? a.joinedAtCheckoutAmount : amount,
      date: daysAgo(1 + ((i * 5) % 55)),
      status,
    })
  })
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const ORDERS: Order[] = build()
