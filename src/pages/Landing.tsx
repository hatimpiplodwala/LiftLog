import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'

const features = [
  {
    title: 'Fast set logging',
    body: 'Freeform sets save the moment you tap. No menus, no friction.',
  },
  {
    title: 'Personal records',
    body: 'Every all-time max is marked automatically as you train.',
  },
  {
    title: 'Progress charts',
    body: 'Weekly volume and per-exercise trends, kept simple.',
  },
  {
    title: 'Rest timer',
    body: 'Auto-starts after each set with audio and vibration cues.',
  },
  {
    title: 'Templates & notes',
    body: 'Reuse your favourite splits and jot how each session felt.',
  },
  {
    title: 'Shareable workouts',
    body: 'Publish any session to a public link in one click.',
  },
]

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
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

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-12 text-center sm:px-8 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Free · Mobile-first · Built for lifters
        </span>

        <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          Lift heavier.
          <br />
          <span className="text-primary">Track smarter.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Log every set, track every PR, and watch your progress over time. A focused
          workout tracker that stays out of your way.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        <div className="mt-20 mx-auto max-w-2xl">
          <div className="glass-strong relative rounded-xl p-4 sm:p-6">
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
                {[
                  { name: 'Bench Press', sets: '100kg × 5', pr: true },
                  { name: 'Overhead Press', sets: '60kg × 8' },
                  { name: 'Incline DB Press', sets: '32kg × 10' },
                ].map((row) => (
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

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-lg p-5 transition-colors hover:border-primary/40"
            >
              <h3 className="font-display text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-xl glass-strong p-8 sm:p-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your next PR is <span className="text-primary">one tap away.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Free forever for the core app. No ads, no nonsense.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" fullWidth>
                Create your free account
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border py-6 text-center text-xs text-muted-foreground">
        LiftLog
      </footer>
    </div>
  )
}
