import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, startOfWeek, isAfter, differenceInCalendarDays } from 'date-fns'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChevronRightIcon, PlusIcon, RepeatIcon } from '@/components/layout/Icons'
import { HeatmapCalendar } from '@/components/ui/HeatmapCalendar'
import { useProfile } from '@/hooks/useProfile'
import { useWorkouts, useCreateWorkout, useFinishedAts } from '@/hooks/useWorkouts'
import { supabase, unwrap } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { formatWeight, formatDuration, workoutDurationSecs, errMessage } from '@/lib/utils'
import { computeStreak } from '@/lib/streak'

// Weekly volume, summed server-side from per-workout aggregates (get_workout_volume RPC).
function useWeeklyVolumeKg() {
  const { user } = useAuth()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return useQuery({
    enabled: !!user,
    queryKey: ['weekly-sets', user?.id, weekStart.toISOString()],
    queryFn: async (): Promise<number> => {
      const rows = await unwrap<{ volume_kg: number | string }[]>(
        supabase.rpc('get_workout_volume', { since: weekStart.toISOString() }),
      )
      return rows.reduce((sum, r) => sum + Number(r.volume_kg), 0)
    },
  })
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const units = profile?.units ?? 'kg'
  const { data: workouts, isLoading } = useWorkouts({ finishedOnly: true, limit: 12 })
  const { data: finishedAts } = useFinishedAts()
  const { data: weeklyVolumeKg = 0 } = useWeeklyVolumeKg()
  const createWorkout = useCreateWorkout()
  const [repeating, setRepeating] = useState(false)

  const lastWorkout = (workouts ?? [])[0]
  async function repeatLast() {
    if (!lastWorkout || repeating) return
    setRepeating(true)
    try {
      const name = `Session — ${format(new Date(), 'MMM d')}`
      const created = await createWorkout.mutateAsync({ name })
      navigate(`/workout/${created.id}/active?repeatFrom=${lastWorkout.id}`)
    } catch (err) {
      setRepeating(false)
      toast.error(errMessage(err, 'Failed to start workout'))
    }
  }

  const workoutsThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return (workouts ?? []).filter(
      (w) => w.finished_at && isAfter(new Date(w.finished_at), weekStart),
    )
  }, [workouts])

  const streak = useMemo(() => computeStreak(finishedAts ?? []), [finishedAts])
  const recent = useMemo(() => (workouts ?? []).slice(0, 3), [workouts])

  const greeting = profile?.username ? `Hey, ${profile.username}` : 'Hey, lifter'

  return (
    <div>
      <PageHeader title={greeting} subtitle={format(new Date(), 'EEEE, MMM d')} />

      <div className="px-4 pb-8 sm:px-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left — stats, actions, consistency */}
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="This week" value={String(workoutsThisWeek.length)} unit="workouts" />
              <Stat label="Volume" value={formatWeight(weeklyVolumeKg, units)} unit={units} />
              <Stat
                label="Streak"
                value={String(streak)}
                unit={streak === 1 ? 'day' : 'days'}
                highlight={streak > 0}
              />
            </div>

            <Link to="/workout/new" className="block">
              <Button size="lg" fullWidth>
                <PlusIcon size={20} /> Start workout
              </Button>
            </Link>

            {lastWorkout && (
              <Button
                size="md"
                variant="secondary"
                fullWidth
                loading={repeating}
                onClick={repeatLast}
              >
                <RepeatIcon size={16} /> Repeat last · {lastWorkout.name}
              </Button>
            )}

            <section>
              <SectionHeader title="Consistency" />
              <Card className="px-3 py-4">
                <HeatmapCalendar finishedAts={finishedAts ?? []} />
              </Card>
            </section>
          </div>

          {/* Right — recent workouts */}
          <section className="mt-5 lg:mt-0 lg:border-l lg:border-border lg:pl-8">
            <SectionHeader
              title="Recent workouts"
              count={recent.length || undefined}
              action={
                <Link to="/history" className="text-xs font-semibold text-primary hover:underline">
                  View all
                </Link>
              }
            />

            {isLoading ? (
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 px-4 py-3.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              message="No workouts yet"
              hint="Tap Start workout above to log your first session."
            />
          ) : (
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {recent.map((w) => (
                <RecentWorkoutRow key={w.id} workout={w} />
              ))}
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  )
}

function RecentWorkoutRow({
  workout,
}: {
  workout: { id: string; name: string; started_at: string; finished_at: string | null }
}) {
  const date = new Date(workout.started_at)
  const today = new Date()
  const days = differenceInCalendarDays(today, date)
  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : format(date, 'EEE, MMM d')

  return (
    <Link
      to={`/workout/${workout.id}`}
      className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-secondary/40"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{workout.name}</div>
        <div className="mt-0.5 font-data text-xs text-muted-foreground">
          {label} · {formatDuration(workoutDurationSecs(workout.started_at, workout.finished_at))}
        </div>
      </div>
      <ChevronRightIcon className="shrink-0 text-muted-foreground" size={18} />
    </Link>
  )
}
