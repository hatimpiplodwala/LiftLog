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
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-fg-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border border-border bg-surface px-4 text-fg placeholder:text-fg-dim',
            'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            'transition-colors',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...props}
        />
        {(hint || error) && (
          <p className={cn('mt-1.5 text-xs', error ? 'text-danger' : 'text-fg-dim')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
