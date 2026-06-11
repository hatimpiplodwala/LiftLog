import { cn } from '@/lib/utils'

// Layout-matching loading placeholder. The `.shimmer` sweep is defined in
// index.css; reduced-motion is handled globally (animations neutralized), so it
// degrades to a static muted block.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('shimmer rounded-md', className)} />
}
