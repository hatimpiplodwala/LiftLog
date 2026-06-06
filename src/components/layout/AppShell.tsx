import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'

// `wide` lets a data-dense page (e.g. History master-detail) use more horizontal
// space on very large screens; most pages stay at the comfortable reading width.
export function AppShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <TopNav />
      <Sidebar />
      <div className="lg:pl-60">
        <main className={cn('mx-auto w-full max-w-2xl lg:max-w-4xl', wide && 'xl:max-w-6xl')}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
