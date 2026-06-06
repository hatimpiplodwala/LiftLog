import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useWorkout, useWorkoutSets } from '@/hooks/useWorkouts'
import { useExercises } from '@/hooks/useExercises'
import { useProfile } from '@/hooks/useProfile'
import { formatWeight, formatDuration, workoutDurationSecs } from '@/lib/utils'
import type { Exercise, WorkoutSet, Units } from '@/types/database.types'

function formatSet(s: WorkoutSet, type: Exercise['type'], units: Units): string {
  if (type === 'cardio') return s.duration_secs != null ? formatDuration(s.duration_secs) : '—'
  if (type === 'bodyweight') return s.reps != null ? `${s.reps} reps` : '—'
  if (s.weight_kg != null) return `${formatWeight(s.weight_kg, units)}${units} × ${s.reps ?? '?'}`
  return s.reps != null ? `${s.reps} reps` : '—'
}

// Read-only preview of a workout, shown in the History master-detail pane.
export function WorkoutSummaryPane({ workoutId }: { workoutId: string | null }) {
  const { data: profile } = useProfile()
  const units: Units = profile?.units ?? 'kg'
  const { data: workout, isLoading } = useWorkout(workoutId ?? undefined)
  const { data: sets } = useWorkoutSets(workoutId ?? undefined)
  const { data: exercises } = useExercises()

  const grouped = useMemo(() => {
    const exMap = new Map((exercises ?? []).map((e) => [e.id, e]))
    const order: string[] = []
    const seen = new Set<string>()
    const byEx = new Map<string, WorkoutSet[]>()
    for (const s of sets ?? []) {
      if (!seen.has(s.exercise_id)) {
        seen.add(s.exercise_id)
        order.push(s.exercise_id)
      }
      const arr = byEx.get(s.exercise_id) ?? []
      arr.push(s)
      byEx.set(s.exercise_id, arr)
    }
    return order.map((id) => ({ exercise: exMap.get(id), sets: byEx.get(id) ?? [] }))
  }, [sets, exercises])

  if (!workoutId) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
        Select a workout to preview it here.
      </div>
    )
  }

  if (isLoading || !workout) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const totalSets = (sets ?? []).length
  const totalVolumeKg = (sets ?? []).reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )
  const durationSecs = workoutDurationSecs(workout.started_at, workout.finished_at)

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          {workout.name}
        </h2>
        <p className="mt-0.5 font-data text-xs text-muted-foreground">
          {format(new Date(workout.started_at), 'EEE, MMM d, yyyy · h:mm a')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
        {[
          { label: 'Duration', value: formatDuration(durationSecs) },
          { label: 'Sets', value: String(totalSets) },
          { label: 'Volume', value: `${formatWeight(totalVolumeKg, units)} ${units}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </div>
            <div className="font-data mt-1 truncate text-sm font-semibold text-foreground">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No sets in this workout.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ exercise, sets: exSets }, idx) => (
            <div
              key={exercise?.id ?? idx}
              className="overflow-hidden rounded-md border border-border bg-card"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <h3 className="truncate text-sm font-bold text-foreground">
                  {exercise?.name ?? 'Unknown'}
                </h3>
                {exercise && <Badge variant="muted">{exercise.category}</Badge>}
              </div>
              <ul className="divide-y divide-border">
                {exSets.map((s, i) => (
                  <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-data text-xs font-semibold text-muted-foreground">
                      Set {i + 1}
                    </span>
                    <span className="font-data text-foreground">
                      {exercise ? formatSet(s, exercise.type, units) : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Link
        to={`/workout/${workout.id}`}
        className="inline-block text-sm font-semibold text-primary hover:underline"
      >
        Open full workout
      </Link>
    </div>
  )
}
