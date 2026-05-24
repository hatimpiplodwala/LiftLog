import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'liftlog.restDurationSecs'
const PRESETS = [60, 90, 120, 180]

export function getStoredRestDuration(): number {
  if (typeof window === 'undefined') return 90
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? n : 90
}

function setStoredRestDuration(secs: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, String(secs))
}

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.55)
    setTimeout(() => ctx.close(), 800)
  } catch {
    // ignore audio failures
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 80, 150])
    } catch {
      // ignore
    }
  }
}

interface Props {
  endsAt: number | null
  duration: number
  onDurationChange: (secs: number) => void
  onDismiss: () => void
  onExtend: (extraSecs: number) => void
}

export function RestTimer({ endsAt, duration, onDurationChange, onDismiss, onExtend }: Props) {
  const [now, setNow] = useState(Date.now())
  const firedRef = useRef<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (endsAt == null) return
    const t = setInterval(() => {
      const tick = Date.now()
      setNow(tick)
      if (tick >= endsAt) clearInterval(t)
    }, 250)
    return () => clearInterval(t)
  }, [endsAt])

  useEffect(() => {
    if (endsAt == null) return
    if (firedRef.current === endsAt) return
    if (now >= endsAt) {
      firedRef.current = endsAt
      beep()
    }
  }, [endsAt, now])

  if (endsAt == null) {
    if (!showSettings) {
      return (
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="glass fixed bottom-4 right-4 z-30 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground shadow-lg transition-colors hover:text-foreground"
          aria-label="Rest timer settings"
        >
          Rest: <span className="font-bold text-primary">{duration}s</span>
        </button>
      )
    }
    return (
      <div className="glass-strong fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-lg p-3 shadow-xl">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Rest duration
          </span>
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onDurationChange(p)
                setStoredRestDuration(p)
                setShowSettings(false)
              }}
              className={
                p === duration
                  ? 'rounded-md bg-primary py-2 text-xs font-bold text-primary-foreground'
                  : 'rounded-md border border-border bg-secondary py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70'
              }
            >
              {p}s
            </button>
          ))}
        </div>
      </div>
    )
  }

  const remainingMs = Math.max(0, endsAt - now)
  const remainingSecs = Math.ceil(remainingMs / 1000)
  const mm = Math.floor(remainingSecs / 60)
  const ss = remainingSecs % 60
  const done = remainingMs === 0
  const progress = duration > 0 ? Math.min(1, (duration * 1000 - remainingMs) / (duration * 1000)) : 1

  return (
    <div
      className={cn(
        'glass-strong fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-lg p-3',
        done ? 'shadow-glow-emerald' : 'shadow-xl',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {done ? 'Rest complete' : 'Rest'}
          </div>
          <div
            className={cn(
              'font-display text-3xl font-extrabold tabular-nums',
              done ? 'text-primary animate-pulse-glow' : 'text-foreground',
            )}
          >
            {mm}:{ss.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExtend(30)}
            className="h-9 rounded-md border border-border bg-secondary px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/70"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="h-9 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {done ? 'Done' : 'Skip'}
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
