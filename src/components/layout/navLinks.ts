import {
  HomeIcon,
  DumbbellIcon,
  HistoryIcon,
  ChartIcon,
  GridIcon,
  ListIcon,
  UserIcon,
} from './Icons'

// Single source of truth for the primary nav routes. Sidebar uses the icons;
// TopNav uses just to+label. BottomNav has its own tab/more split, so it stays
// separate by design. Add a route once, here.
export const navLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { to: '/workout/new', label: 'Workout', Icon: DumbbellIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
  { to: '/exercises', label: 'Exercises', Icon: GridIcon },
  { to: '/templates', label: 'Templates', Icon: ListIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]
