import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { AppLogo } from '@/components/ui/AppLogo'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { formatDuration, workoutDurationSecs } from '@/lib/utils'
import type { WorkoutSet, Exercise } from '@/types/database.types'

// Shape returned by the get_shared_workout RPC — user_id, notes, share_token intentionally excluded.
interface SharedWorkout {
  id: string
  name: string
  started_at: string
  finished_at: string | null
}
type SharedSet = Omit<WorkoutSet, 'workout_id'>

function useSharedWorkout(token: string | undefined) {
  return useQuery({
    enabled: !!token,
    queryKey: ['shared-workout', token],
    queryFn: async () => {
      const { data: payload, error: e1 } = await supabase.rpc('get_shared_workout', {
        token,
      })
      if (e1) throw e1
      if (!payload) return null
      const { workout, sets } = payload as { workout: SharedWorkout; sets: SharedSet[] }

      const exerciseIds = Array.from(new Set(sets.map((s) => s.exercise_id)))
      let exercises: Exercise[] = []
      if (exerciseIds.length > 0) {
        const { data: ex, error: e2 } = await supabase
          .from('exercises')
          .select('id, name, category, type')
          .in('id', exerciseIds)
        if (e2) throw e2
        exercises = (ex ?? []) as Exercise[]
      }

      return { workout, sets, exercises }
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
    const setsByEx = new Map<string, SharedSet[]>()
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="text-base font-bold tracking-tight text-foreground">LiftLog</span>
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
            <p className="text-sm font-medium text-foreground">Workout not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The share link may have been revoked or never existed.
            </p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
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
  data: { workout: SharedWorkout; sets: SharedSet[]; exercises: Exercise[] }
  grouped: { exercise: Exercise | undefined; sets: SharedSet[] }[]
}) {
  const totalVolumeKg = data.sets.reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )
  const durationSecs = workoutDurationSecs(data.workout.started_at, data.workout.finished_at)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Shared workout</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          {data.workout.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">No sets in this workout.</p>
          </Card>
        ) : (
          grouped.map(({ exercise, sets }, idx) => (
            <div
              key={exercise?.id ?? idx}
              className="overflow-hidden rounded-md border border-border bg-card"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h3 className="text-sm font-bold text-foreground">{exercise?.name ?? 'Unknown'}</h3>
                {exercise && <Badge variant="muted">{exercise.category}</Badge>}
              </div>
              <ul className="divide-y divide-border">
                {sets.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span className="font-data text-xs font-semibold text-muted-foreground">
                      Set {i + 1}
                    </span>
                    <span className="font-data font-medium text-foreground">{formatSet(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <Card className="border-primary/40 bg-primary/5 text-center">
        <p className="text-sm font-semibold text-foreground">
          Track your own workouts with LiftLog
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Freeform logging, previous-set hints, volume charts, and sharable summaries.
        </p>
        <Link to="/signup" className="mt-3 inline-block">
          <Button size="sm">Sign up free</Button>
        </Link>
      </Card>
    </div>
  )
}

function formatSet(s: SharedSet): string {
  if (s.duration_secs != null) return formatDuration(s.duration_secs)
  if (s.weight_kg != null && s.reps != null) return `${s.weight_kg} kg × ${s.reps}`
  if (s.reps != null) return `${s.reps} reps`
  return '—'
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-3 text-center">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="font-data mt-1 text-base font-semibold text-foreground">{value}</div>
    </Card>
  )
}
