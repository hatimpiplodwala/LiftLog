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
    <header className="sticky top-0 z-30 hidden border-b border-border bg-surface/95 backdrop-blur sm:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="text-base font-bold tracking-tight">LiftLog</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-2 text-fg'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
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
