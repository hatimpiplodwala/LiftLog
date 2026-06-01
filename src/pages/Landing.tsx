import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'

const highlights = ['Fast logging', 'Auto PRs', 'Progress charts']

const mockupRows = [
  { name: 'Bench Press', sets: '100kg × 5', pr: true },
  { name: 'Overhead Press', sets: '60kg × 8' },
  { name: 'Incline DB Press', sets: '32kg × 10' },
]

export function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade opacity-50" />

      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <AppLogo size="md" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            LiftLog
          </span>
        </div>
        <Link
          to="/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Log in
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-4">
        {/* Left — copy */}
        <div className="max-w-xl">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
            Free · Mobile-first · Built for lifters
          </span>

          <h1
            className="mt-6 animate-fade-up font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '60ms' }}
          >
            Lift heavier.
            <br />
            <span className="text-primary">Track smarter.</span>
          </h1>

          <p
            className="mt-6 max-w-md animate-fade-up text-base text-muted-foreground sm:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            Log every set, track every PR, and watch your progress over time. A focused
            workout tracker that stays out of your way.
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row"
            style={{ animationDelay: '180ms' }}
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" fullWidth>
                Start lifting — it's free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" fullWidth>
                I already have an account
              </Button>
            </Link>
          </div>

          <ul
            className="mt-8 flex animate-fade-up flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            style={{ animationDelay: '240ms' }}
          >
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <span aria-hidden className="h-1 w-1 rounded-full bg-primary" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — workout mockup */}
        <div
          className="w-full animate-fade-up lg:justify-self-end"
          style={{ animationDelay: '300ms' }}
        >
          <div className="glass-strong relative mx-auto w-full max-w-md rounded-xl p-4 sm:p-6">
            <div className="rounded-lg border border-border bg-background/60 p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-left">
                  <div className="font-display text-sm font-bold text-foreground">
                    Push Day · Tuesday
                  </div>
                  <div className="text-[11px] text-muted-foreground">42:18 · 18 sets</div>
                </div>
                <span className="rounded-md border border-primary/50 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  PR
                </span>
              </div>
              <div className="mt-4 space-y-2 text-left text-sm">
                {mockupRows.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2"
                  >
                    <span className="font-semibold text-foreground">{row.name}</span>
                    <span className="flex items-center gap-2 tabular-nums text-muted-foreground">
                      {row.sets}
                      {row.pr && (
                        <span className="rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                          PR
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        LiftLog
      </footer>
    </div>
  )
}
