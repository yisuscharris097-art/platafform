import {
  LayoutDashboard, CalendarDays, Users, UserRound, CreditCard, DoorOpen,
  FlaskConical, ShoppingBag, TrendingUp, BarChart3, Settings, Smartphone,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Content days', href: '/content-days', icon: CalendarDays },
      { label: 'Crews', href: '/crews', icon: Users },
      { label: 'Field', href: '/field', icon: Smartphone },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Agents', href: '/agents', icon: UserRound },
      { label: 'Memberships', href: '/memberships', icon: CreditCard },
      { label: 'Hosts', href: '/hosts', icon: DoorOpen },
    ],
  },
  {
    label: 'Production',
    items: [{ label: 'Lab', href: '/lab', icon: FlaskConical }],
  },
  {
    label: 'Commercial',
    items: [
      { label: 'Orders', href: '/orders', icon: ShoppingBag },
      { label: 'Growth', href: '/growth', icon: TrendingUp },
    ],
  },
  {
    label: null,
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]
