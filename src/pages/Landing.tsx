import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'

const highlights = ['Fast logging', 'Automatic PRs', 'Progress over time']

const mockupRows = [
  { name: 'Bench Press', sets: '100kg × 5', pr: true },
  { name: 'Overhead Press', sets: '60kg × 8' },
  { name: 'Incline DB Press', sets: '32kg × 10' },
]

export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between border-b border-border px-5 sm:px-8">
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

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:pt-8">
        {/* Left — copy */}
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Free · Mobile-first · Built for lifters
          </p>

          <h1
            className="mt-5 animate-fade-up font-display text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '60ms' }}
          >
            Lift heavier.
            <br />
            <span className="text-primary">Track smarter.</span>
          </h1>

          <p
            className="mt-6 max-w-md animate-fade-up text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            Log every set, track every PR, and watch your progress over time. A focused
            workout log that stays out of your way.
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row"
            style={{ animationDelay: '180ms' }}
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" fullWidth>
                Start training — it's free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" fullWidth>
                I already have an account
              </Button>
            </Link>
          </div>

          <ul
            className="mt-10 flex animate-fade-up flex-col divide-y divide-border border-y border-border text-sm sm:max-w-md"
            style={{ animationDelay: '240ms' }}
          >
            {highlights.map((h) => (
              <li key={h} className="py-3 text-muted-foreground">
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — log panel */}
        <div
          className="w-full animate-fade-up lg:justify-self-end"
          style={{ animationDelay: '300ms' }}
        >
          <div className="mx-auto w-full max-w-md border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <span className="font-display text-sm font-bold tracking-tight text-foreground">
                Push Day · Tue
              </span>
              <span className="font-data text-xs text-muted-foreground">42:18 · 18 sets</span>
            </div>
            <ul className="divide-y divide-border">
              {mockupRows.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between px-4 py-3 sm:px-5"
                >
                  <span className="text-sm font-medium text-foreground">{row.name}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="font-data text-sm text-muted-foreground">{row.sets}</span>
                    {row.pr && (
                      <span className="font-data text-[10px] font-semibold uppercase tracking-wider text-primary">
                        PR
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        LiftLog
      </footer>
    </div>
  )
}
