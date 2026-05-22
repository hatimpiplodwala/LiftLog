import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 animate-fade-in',
          className,
        )}
      >
        {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
