import { cn } from '@/lib/utils'

// Layout-matching loading placeholder. Reduced-motion is handled globally
// (index.css neutralizes animations), so animate-pulse degrades to a static block.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-secondary/60', className)}
    />
  )
}
