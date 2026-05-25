import { useEffect, useState } from 'react'

interface Props {
  startedAt: number | null
  onDismiss: () => void
}

export function RestTimer({ startedAt, onDismiss }: Props) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (startedAt == null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  if (startedAt == null) return null

  const elapsed = Math.floor((now - startedAt) / 1000)
  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60

  return (
    <div className="glass-strong fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-lg p-3 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resting
          </div>
          <div className="font-display text-3xl font-extrabold tabular-nums text-foreground">
            {mm}:{ss.toString().padStart(2, '0')}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="h-9 rounded-md bg-secondary px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
