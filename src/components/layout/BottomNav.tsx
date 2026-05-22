import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { HomeIcon, DumbbellIcon, HistoryIcon, UserIcon } from './Icons'

const tabs = [
  { to: '/dashboard', label: 'Home', Icon: HomeIcon },
  { to: '/workout/new', label: 'Workout', Icon: DumbbellIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

export function BottomNav() {
  const { pathname } = useLocation()
  if (pathname.includes('/active') || pathname.startsWith('/share')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom sm:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-brand' : 'text-fg-muted hover:text-fg',
              )
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
