import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AppLogo } from '@/components/ui/AppLogo'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workout/new', label: 'Workout' },
  { to: '/history', label: 'History' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/templates', label: 'Templates' },
  { to: '/progress', label: 'Progress' },
  { to: '/profile', label: 'Profile' },
]

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 hidden border-b border-border bg-background/80 backdrop-blur sm:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2 group">
          <AppLogo size="sm" />
          <span className="hidden font-display text-base font-bold tracking-tight text-foreground md:inline">
            LiftLog
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 lg:gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2 py-1.5 text-sm font-medium transition-colors lg:px-3',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
