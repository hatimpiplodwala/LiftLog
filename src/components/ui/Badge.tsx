import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'brand' | 'muted'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variants: Record<Variant, string> = {
  default: 'bg-surface-2 text-fg border-border',
  brand: 'bg-brand-dim text-brand border-brand/30',
  muted: 'bg-transparent text-fg-muted border-border',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
