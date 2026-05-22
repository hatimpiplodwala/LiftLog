import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    if (!data.session) {
      toast.success('Check your email to confirm your account')
      navigate('/login', { replace: true })
      return
    }
    toast.success('Welcome to LiftLog!')
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 self-start">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand font-extrabold text-black">
            L
          </div>
          <span className="text-lg font-bold tracking-tight">LiftLog</span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-fg-muted">Start tracking in under a minute.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Display name"
            type="text"
            name="username"
            autoComplete="nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 6 characters"
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
