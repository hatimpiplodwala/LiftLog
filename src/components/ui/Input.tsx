import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-muted-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground',
            'placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-200 ease-out-expo',
            'hover:border-border focus-visible:border-primary/60 focus-visible:bg-secondary/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive',
            className,
          )}
          {...props}
        />
        {(hint || error) && (
          <p className={cn('mt-1.5 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
