import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { formatDuration, workoutDurationSecs } from '@/lib/utils'
import type { Workout, WorkoutSet, Exercise } from '@/types/database.types'

function useSharedWorkout(token: string | undefined) {
  return useQuery({
    enabled: !!token,
    queryKey: ['shared-workout', token],
    queryFn: async () => {
      const { data: workout, error: e1 } = await supabase
        .from('workouts')
        .select('*')
        .eq('share_token', token!)
        .maybeSingle()
      if (e1) throw e1
      if (!workout) return null

      const { data: sets, error: e2 } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workout.id)
        .order('completed_at')
      if (e2) throw e2

      const exerciseIds = Array.from(new Set((sets ?? []).map((s) => s.exercise_id)))
      let exercises: Exercise[] = []
      if (exerciseIds.length > 0) {
        const { data: ex, error: e3 } = await supabase
          .from('exercises')
          .select('*')
          .in('id', exerciseIds)
        if (e3) throw e3
        exercises = (ex ?? []) as Exercise[]
      }

      return {
        workout: workout as Workout,
        sets: (sets ?? []) as WorkoutSet[],
        exercises,
      }
    },
  })
}

export function WorkoutShare() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = useSharedWorkout(token)

  const grouped = useMemo(() => {
    if (!data) return []
    const exMap = new Map(data.exercises.map((e) => [e.id, e]))
    const order: string[] = []
    const seen = new Set<string>()
    const setsByEx = new Map<string, WorkoutSet[]>()
    for (const s of data.sets) {
      if (!seen.has(s.exercise_id)) {
        seen.add(s.exercise_id)
        order.push(s.exercise_id)
      }
      const arr = setsByEx.get(s.exercise_id) ?? []
      arr.push(s)
      setsByEx.set(s.exercise_id, arr)
    }
    return order.map((id) => ({
      exercise: exMap.get(id),
      sets: setsByEx.get(id) ?? [],
    }))
  }, [data])

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand font-extrabold text-black">
              L
            </div>
            <span className="text-base font-bold tracking-tight">LiftLog</span>
          </Link>
          <Link to="/signup">
            <Button size="sm" variant="secondary">Sign up free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : isError || !data ? (
          <Card className="text-center">
            <p className="text-sm font-medium text-fg">Workout not found</p>
            <p className="mt-1 text-xs text-fg-muted">
              The share link may have been revoked or never existed.
            </p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand">
              Go to LiftLog →
            </Link>
          </Card>
        ) : (
          <SharedWorkoutView data={data} grouped={grouped} />
        )}
      </main>
    </div>
  )
}

function SharedWorkoutView({
  data,
  grouped,
}: {
  data: { workout: Workout; sets: WorkoutSet[]; exercises: Exercise[] }
  grouped: { exercise: Exercise | undefined; sets: WorkoutSet[] }[]
}) {
  const totalVolumeKg = data.sets.reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )
  const durationSecs = workoutDurationSecs(data.workout.started_at, data.workout.finished_at)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          Shared workout
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{data.workout.name}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {format(new Date(data.workout.started_at), 'EEEE, MMM d, yyyy · h:mm a')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Duration" value={formatDuration(durationSecs)} />
        <Stat label="Sets" value={String(data.sets.length)} />
        <Stat label="Volume" value={`${Math.round(totalVolumeKg).toLocaleString()} kg`} />
      </div>

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-fg-muted">No sets in this workout.</p>
          </Card>
        ) : (
          grouped.map(({ exercise, sets }, idx) => (
            <Card key={exercise?.id ?? idx} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{exercise?.name ?? 'Unknown'}</h3>
                {exercise && <Badge variant="muted">{exercise.category}</Badge>}
              </div>
              <div className="space-y-1">
                {sets.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2 text-sm"
                  >
                    <span className="text-xs font-semibold text-fg-dim tabular-nums">
                      Set {i + 1}
                    </span>
                    <span className="font-medium tabular-nums">{formatSet(s)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="border-brand/40 bg-brand-dim/15 text-center">
        <p className="text-sm font-semibold text-fg">Track your own workouts with LiftLog</p>
        <p className="mt-1 text-xs text-fg-muted">
          Freeform logging, previous-set hints, volume charts, and sharable summaries.
        </p>
        <Link to="/signup" className="mt-3 inline-block">
          <Button size="sm">Sign up free</Button>
        </Link>
      </Card>
    </div>
  )
}

function formatSet(s: WorkoutSet): string {
  if (s.duration_secs != null) return formatDuration(s.duration_secs)
  if (s.weight_kg != null && s.reps != null) return `${s.weight_kg} kg × ${s.reps}`
  if (s.reps != null) return `${s.reps} reps`
  return '—'
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-3 text-center">
      <div className="text-[11px] font-medium uppercase text-fg-dim">{label}</div>
      <div className="mt-1 text-base font-extrabold tabular-nums">{value}</div>
    </Card>
  )
}
