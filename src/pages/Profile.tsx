import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'
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
                        ? 'bg-primary text-primary-foreground'
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

        <Button variant="secondary" fullWidth loading={signingOut} onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
