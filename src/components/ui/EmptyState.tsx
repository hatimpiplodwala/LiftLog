import type { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  hint?: string
  action?: ReactNode
}

// Consistent ledger-style empty state: a hairline dashed box with a message,
// an optional hint, and an optional action. Used wherever a list is empty.
export function EmptyState({ message, hint, action }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      {hint && <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
