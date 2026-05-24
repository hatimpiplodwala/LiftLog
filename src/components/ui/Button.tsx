import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  cn(
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold',
    'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-glow-emerald-soft hover:bg-primary/90 hover:shadow-glow-emerald active:scale-[0.97]',
        secondary:
          'glass text-foreground hover:bg-secondary/80 active:scale-[0.98]',
        ghost: 'text-foreground hover:bg-secondary active:scale-[0.98]',
        danger:
          'border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98]',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary/60 active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-11 px-4 text-sm rounded-lg',
        lg: 'h-14 px-6 text-base rounded-lg',
        icon: 'h-10 w-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  fullWidth?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, fullWidth, loading, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
