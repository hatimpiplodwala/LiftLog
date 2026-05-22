import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'

export function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <AppLogo size="md" />
          <span className="text-lg font-bold tracking-tight">LiftLog</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pt-16 pb-24 text-center sm:pt-24">
        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
          Free · Mobile-first · Built for lifters
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Track every lift.
          <br />
          <span className="text-brand">Crush every session.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-fg-muted sm:text-lg">
          A clean, no-nonsense workout logger. Log freeform sets, see your last performance,
          chart your volume, save templates, and share your best sessions.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button size="lg" fullWidth>Get started — it's free</Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" fullWidth>I already have an account</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-3">
          {[
            {
              title: 'Freeform logging',
              body: 'Add exercises and sets in any order. Every set saves instantly — crash-safe.',
            },
            {
              title: 'Previous performance',
              body: 'See your last set for every exercise right where you log the next one.',
            },
            {
              title: 'Volume over time',
              body: 'Weekly volume chart that actually tells you if you are progressing.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-fg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-fg-dim">
        LiftLog · Built for the gym
      </footer>
    </div>
  )
}
