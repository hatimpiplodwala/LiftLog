import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { TrashIcon } from '@/components/layout/Icons'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import {
  useBodyWeights,
  useInsertBodyWeight,
  useDeleteBodyWeight,
} from '@/hooks/useBodyWeight'
import { cn, fromKg, toKg } from '@/lib/utils'
import type { Units } from '@/types/database.types'

export function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [username, setUsername] = useState('')
  const [units, setUnits] = useState<Units>('kg')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setUnits(profile.units)
    }
  }, [profile])

  const dirty = !!profile && username.trim() !== (profile.username ?? '')

  async function onSave() {
    if (!dirty) return
    try {
      await updateProfile.mutateAsync({ username: username.trim() || null })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function onPickUnits(u: Units) {
    if (!profile || u === units) return
    const prev = units
    setUnits(u)
    try {
      await updateProfile.mutateAsync({ units: u })
    } catch (err) {
      setUnits(prev)
      toast.error(err instanceof Error ? err.message : 'Failed to save units')
    }
  }

  async function onSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Account & preferences" />

      <div className="space-y-4 px-4 pb-10 sm:px-6">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase text-muted-foreground">
                Signed in as
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-foreground">
                {user?.email}
              </div>
            </div>
            {profile && (
              <div className="flex shrink-0 gap-1 rounded-md bg-secondary p-1">
                {(['kg', 'lbs'] as Units[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onPickUnits(u)}
                    disabled={updateProfile.isPending}
                    className={cn(
                      'rounded-sm px-3 py-1 text-xs font-bold uppercase transition-colors disabled:opacity-60',
                      units === u
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <Card className="space-y-4">
            <Input
              label="Display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
            />
            <Button
              fullWidth
              disabled={!dirty}
              loading={updateProfile.isPending}
              onClick={onSave}
            >
              Save changes
            </Button>
          </Card>
        )}

        <BodyWeightSection units={units} />

        <Button variant="secondary" fullWidth loading={signingOut} onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function BodyWeightSection({ units }: { units: Units }) {
  const { data: logs, isLoading } = useBodyWeights()
  const insertLog = useInsertBodyWeight()
  const deleteLog = useDeleteBodyWeight()
  const [input, setInput] = useState('')

  const latest = useMemo(() => (logs && logs.length > 0 ? logs[0] : null), [logs])

  async function onLog() {
    const trimmed = input.trim()
    if (!trimmed) return
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid weight')
      return
    }
    try {
      await insertLog.mutateAsync({ weight_kg: toKg(value, units) })
      setInput('')
      toast.success('Body weight logged')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log')
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteLog.mutateAsync(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase text-muted-foreground">
            Body weight
          </div>
          {latest ? (
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold tabular-nums text-foreground">
                {fromKg(latest.weight_kg, units)}
              </span>
              <span className="text-xs text-muted-foreground">{units}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                · {format(new Date(latest.logged_at), 'MMM d')}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">No entries yet</div>
          )}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Input
          label={`New entry (${units})`}
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={units === 'kg' ? '70' : '155'}
          className="flex-1"
        />
        <Button
          size="md"
          loading={insertLog.isPending}
          disabled={!input.trim()}
          onClick={onLog}
        >
          Log
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-3">
          <Spinner />
        </div>
      ) : logs && logs.length > 0 ? (
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </div>
          <ul className="divide-y divide-border/60">
            {logs.slice(0, 5).map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 py-1.5 text-sm"
              >
                <span className="tabular-nums text-foreground">
                  {fromKg(l.weight_kg, units)} {units}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {format(new Date(l.logged_at), 'MMM d, yyyy')}
                  <button
                    type="button"
                    onClick={() => onDelete(l.id)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <TrashIcon size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
