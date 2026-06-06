import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
      <TopNav />
      <Sidebar />
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-2xl lg:max-w-4xl">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
