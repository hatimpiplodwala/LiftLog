import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AppLogo } from '@/components/ui/AppLogo'
import { Input } from '@/components/ui/Input'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start">
          <AppLogo size="md" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            LiftLog
          </span>
        </Link>

        <div className="glass-strong rounded-xl p-6 sm:p-7">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Welcome <span className="text-primary">back.</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick up where you left off.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Log in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account yet?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
