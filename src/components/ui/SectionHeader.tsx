import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  count?: number | string
  action?: ReactNode
  className?: string
}

// A ledger-style section header: uppercase tracked label, optional mono count,
// optional right-aligned action, underlined by a hairline rule.
export function SectionHeader({ title, count, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-3 flex items-baseline justify-between gap-3 border-b border-border px-1 pb-2',
        className,
      )}
    >
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {count != null && (
          <span className="font-data text-xs text-muted-foreground/70">{count}</span>
        )}
      </div>
      {action}
    </div>
  )
}
