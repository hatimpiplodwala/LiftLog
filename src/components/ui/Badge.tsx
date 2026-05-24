import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-border bg-secondary text-foreground',
        brand:
          'border border-primary/40 bg-primary/15 text-primary shadow-glow-emerald-soft',
        muted: 'border border-border bg-transparent text-muted-foreground',
        neon: 'border border-primary/50 bg-primary/15 text-primary shadow-glow-emerald-soft',
        outline: 'border border-border text-foreground',
        destructive:
          'border border-destructive/40 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ variant, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
