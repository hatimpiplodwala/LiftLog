import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format, startOfWeek, isAfter, differenceInCalendarDays } from 'date-fns'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { ChevronRightIcon, PlusIcon, RepeatIcon } from '@/components/layout/Icons'
import { HeatmapCalendar } from '@/components/ui/HeatmapCalendar'
import { useProfile } from '@/hooks/useProfile'
import { useWorkouts, useCreateWorkout, useFinishedAts } from '@/hooks/useWorkouts'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { formatWeight, formatDuration, workoutDurationSecs } from '@/lib/utils'

function useWeeklySetsTotal() {
  const { user } = useAuth()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return useQuery({
    enabled: !!user,
    queryKey: ['weekly-sets', user?.id, weekStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .gte('workouts.finished_at', weekStart.toISOString())
      if (error) throw error
      return data as Array<{ reps: number | null; weight_kg: number | null }>
    },
  })
}

// Local-tz date keys so a workout at 23:30 counts today, not tomorrow. Must match HeatmapCalendar.
function computeStreak(finishedAts: string[]): number {
  if (finishedAts.length === 0) return 0
  const dateSet = new Set(finishedAts.map((d) => format(new Date(d), 'yyyy-MM-dd')))
  let streak = 0
  let cursor = new Date()
  if (!dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = new Date(cursor.getTime() - 86400_000)
    if (!dateSet.has(format(cursor, 'yyyy-MM-dd'))) return 0
  }
  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = new Date(cursor.getTime() - 86400_000)
  }
  return streak
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const units = profile?.units ?? 'kg'
  const { data: workouts, isLoading } = useWorkouts({ finishedOnly: true, limit: 12 })
  const { data: finishedAts } = useFinishedAts()
  const { data: weekSets } = useWeeklySetsTotal()
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
      toast.error(err instanceof Error ? err.message : 'Failed to start workout')
    }
  }

  const workoutsThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return (workouts ?? []).filter(
      (w) => w.finished_at && isAfter(new Date(w.finished_at), weekStart),
    )
  }, [workouts])

  const weeklyVolumeKg = useMemo(
    () => (weekSets ?? []).reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0),
    [weekSets],
  )
  const streak = useMemo(() => computeStreak(finishedAts ?? []), [finishedAts])
  const recent = useMemo(() => (workouts ?? []).slice(0, 3), [workouts])

  const greeting = profile?.username ? `Hey, ${profile.username}` : 'Hey, lifter'

  return (
    <div>
      <PageHeader title={greeting} subtitle={format(new Date(), 'EEEE, MMM d')} />

      <div className="space-y-5 px-4 pb-8 sm:px-6">
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
          <h2 className="mb-3 px-1 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Consistency
          </h2>
          <Card className="px-3 py-4">
            <HeatmapCalendar finishedAts={finishedAts ?? []} />
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Recent workouts
            </h2>
            <Link to="/history" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Card className="text-center">
              <p className="text-sm text-muted-foreground">
                No workouts yet. Tap "Start workout" above.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recent.map((w) => (
                <RecentWorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function RecentWorkoutCard({
  workout,
}: {
  workout: { id: string; name: string; started_at: string; finished_at: string | null }
}) {
  const date = new Date(workout.started_at)
  const today = new Date()
  const days = differenceInCalendarDays(today, date)
  const label = days === 0 ? 'Today' : days === 1 ? 'Yesterday' : format(date, 'EEE, MMM d')

  return (
    <Link to={`/workout/${workout.id}`}>
      <Card className="flex items-center justify-between transition-colors hover:border-primary/40">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{workout.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {label} · {formatDuration(workoutDurationSecs(workout.started_at, workout.finished_at))}
          </div>
        </div>
        <ChevronRightIcon className="text-muted-foreground" size={18} />
      </Card>
    </Link>
  )
}
