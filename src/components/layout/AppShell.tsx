import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl">{children}</main>
      <BottomNav />
    </div>
  )
}
