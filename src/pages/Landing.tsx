import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'

const mockupRows = [
  { name: 'Bench Press', sets: '100kg × 5', pr: true },
  { name: 'Overhead Press', sets: '60kg × 8' },
  { name: 'Incline DB Press', sets: '32kg × 10' },
]

const features = [
  {
    no: '01',
    title: 'Fast logging',
    body: 'Start a workout and log sets in seconds. Previous weights and reps are pre-filled so you always know what to beat.',
  },
  {
    no: '02',
    title: 'Automatic PRs',
    body: 'Every set is checked against your history. New personal records are flagged the moment you log them.',
  },
  {
    no: '03',
    title: 'Progress over time',
    body: 'Volume, per-exercise trends, muscle balance, and a consistency streak — the full picture, no spreadsheets.',
  },
]

export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <AppLogo size="md" />
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              LiftLog
            </span>
          </div>
          <Link
            to="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-28 lg:pt-16">
        {/* Left — copy */}
        <div className="max-w-xl">
          <p className="animate-fade-up text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Free · Mobile-first · Built for lifters
          </p>

          <h1
            className="mt-5 animate-fade-up font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.5rem]"
            style={{ animationDelay: '60ms' }}
          >
            Lift heavier.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-deep bg-clip-text text-transparent">
              Track smarter.
            </span>
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
        </div>

        {/* Right — live log panel */}
        <div
          className="w-full animate-fade-up lg:justify-self-end"
          style={{ animationDelay: '300ms' }}
        >
          <div className="glass mx-auto w-full max-w-md rounded-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <span className="font-display text-sm font-bold tracking-tight text-foreground">
                Push Day · Tue
              </span>
              <span className="font-data text-xs text-muted-foreground">42:18 · 18 sets</span>
            </div>
            <ul className="divide-y divide-border">
              {mockupRows.map((row, i) => (
                <li
                  key={row.name}
                  className="flex animate-fade-up items-center justify-between px-4 py-3 sm:px-5"
                  style={{ animationDelay: `${360 + i * 80}ms` }}
                >
                  <span className="text-sm font-medium text-foreground">{row.name}</span>
                  <span className="flex items-center gap-2.5">
                    <span className="font-data text-sm text-muted-foreground">{row.sets}</span>
                    {row.pr && (
                      <span
                        className="animate-pop rounded-sm bg-accent px-1.5 py-0.5 font-data text-[10px] font-semibold uppercase tracking-wider text-accent-foreground"
                        style={{ animationDelay: '640ms' }}
                      >
                        PR
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total volume
              </span>
              <span className="font-data text-sm font-semibold text-foreground">8,420 kg</span>
            </div>
          </div>
        </div>
      </main>

      {/* Feature ledger */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything you need. Nothing you don't.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.no} className="bg-card p-6 sm:p-7">
                <span className="font-data text-xs font-semibold tracking-wider text-primary">
                  {f.no}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              Ready to log your first session?
            </p>
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" fullWidth>
                Start training — it's free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        LiftLog
      </footer>
    </div>
  )
}
