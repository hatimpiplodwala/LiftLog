import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/BottomSheet'
import {
  HomeIcon,
  DumbbellIcon,
  HistoryIcon,
  ChartIcon,
  UserIcon,
  ListIcon,
  GridIcon,
  ChevronRightIcon,
} from './Icons'

const tabs = [
  { to: '/dashboard', label: 'Home', Icon: HomeIcon },
  { to: '/workout/new', label: 'Workout', Icon: DumbbellIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
]

const moreItems = [
  { to: '/exercises', label: 'Exercises', Icon: DumbbellIcon },
  { to: '/templates', label: 'Templates', Icon: ListIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

const tabClass = (active: boolean) =>
  cn(
    'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  )

function ActiveBar() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-0 h-0.5 w-10 -translate-x-1/2 rounded-full bg-primary"
    />
  )
}

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  if (pathname.includes('/active') || pathname.startsWith('/share')) return null

  const moreActive = moreItems.some((i) => pathname.startsWith(i.to))

  function go(to: string) {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur safe-bottom sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => tabClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive && <ActiveBar />}
                  <Icon size={22} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            aria-haspopup="dialog"
            className={tabClass(moreActive)}
          >
            {moreActive && <ActiveBar />}
            <GridIcon size={22} />
            <span>More</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="space-y-1">
          {moreItems.map(({ to, label, Icon }) => {
            const active = pathname.startsWith(to)
            return (
              <button
                key={to}
                type="button"
                onClick={() => go(to)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-foreground transition-colors',
                  active ? 'bg-secondary/60' : 'hover:bg-secondary/40',
                )}
              >
                <span className="rounded-md bg-secondary p-2 text-primary">
                  <Icon size={18} />
                </span>
                <span className="flex-1 text-sm font-semibold">{label}</span>
                <ChevronRightIcon size={18} className="text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}
