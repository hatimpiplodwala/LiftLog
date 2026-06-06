import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AppLogo } from '@/components/ui/AppLogo'
import {
  HomeIcon,
  DumbbellIcon,
  HistoryIcon,
  ChartIcon,
  GridIcon,
  ListIcon,
  UserIcon,
} from './Icons'

const links = [
  { to: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { to: '/workout/new', label: 'Workout', Icon: DumbbellIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
  { to: '/exercises', label: 'Exercises', Icon: GridIcon },
  { to: '/templates', label: 'Templates', Icon: ListIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-background lg:flex">
      <Link
        to="/dashboard"
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5"
      >
        <AppLogo size="sm" />
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          LiftLog
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 p-3">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  />
                )}
                <Icon size={18} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
