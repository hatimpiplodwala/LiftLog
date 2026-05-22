import { Link } from 'react-router-dom'
import { format, startOfWeek, isAfter, differenceInCalendarDays } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronRightIcon, PlusIcon } from '@/components/layout/Icons'
import { useProfile } from '@/hooks/useProfile'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useExercises } from '@/hooks/useExercises'
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
  const { data: profile } = useProfile()
  const units = profile?.units ?? 'kg'
  const { data: workouts, isLoading } = useWorkouts({ finishedOnly: true, limit: 30 })
  const { data: weekSets } = useWeeklySetsTotal()
  const { data: exercises } = useExercises()

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const workoutsThisWeek = (workouts ?? []).filter(
    (w) => w.finished_at && isAfter(new Date(w.finished_at), weekStart),
  )

  const weeklyVolumeKg = (weekSets ?? []).reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )
  const streak = computeStreak((workouts ?? []).map((w) => w.finished_at!).filter(Boolean))
  const recent = (workouts ?? []).slice(0, 3)
  const exMap = new Map((exercises ?? []).map((e) => [e.id, e.name]))

  return (
    <div>
      <PageHeader
        title={`Hey${profile?.username ? `, ${profile.username}` : ''}`}
        subtitle={format(new Date(), 'EEEE, MMM d')}
      />

      <div className="space-y-5 px-4 pb-8 sm:px-6">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="This week" value={String(workoutsThisWeek.length)} unit="workouts" />
          <Stat
            label="Volume"
            value={formatWeight(weeklyVolumeKg, units)}
            unit={units}
          />
          <Stat label="Streak" value={String(streak)} unit={streak === 1 ? 'day' : 'days'} />
        </div>

        <Link to="/workout/new" className="block">
          <Button size="lg" fullWidth>
            <PlusIcon size={20} /> Start workout
          </Button>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-fg-muted">Recent workouts</h2>
            <Link to="/history" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : recent.length === 0 ? (
            <Card className="text-center">
              <p className="text-sm text-fg-muted">No workouts yet. Tap "Start workout" above.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recent.map((w) => (
                <RecentWorkoutCard key={w.id} workout={w} exerciseNames={exMap} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="px-3 py-3">
      <div className="text-xs font-medium text-fg-dim">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold tabular-nums">{value}</span>
        <span className="text-xs text-fg-muted">{unit}</span>
      </div>
    </Card>
  )
}

function RecentWorkoutCard({
  workout,
  exerciseNames: _exerciseNames,
}: {
  workout: { id: string; name: string; started_at: string; finished_at: string | null }
  exerciseNames: Map<string, string>
}) {
  const date = new Date(workout.started_at)
  const today = new Date()
  const days = differenceInCalendarDays(today, date)
  const label =
    days === 0 ? 'Today' : days === 1 ? 'Yesterday' : format(date, 'EEE, MMM d')

  return (
    <Link to={`/workout/${workout.id}`}>
      <Card className="flex items-center justify-between hover:bg-surface-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{workout.name}</div>
          <div className="mt-0.5 text-xs text-fg-muted">
            {label} · {formatDuration(workoutDurationSecs(workout.started_at, workout.finished_at))}
          </div>
        </div>
        <ChevronRightIcon className="text-fg-dim" size={18} />
      </Card>
    </Link>
  )
}
