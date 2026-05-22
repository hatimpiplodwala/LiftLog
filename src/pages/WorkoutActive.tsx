import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@/components/layout/Icons'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { SetRow } from '@/components/workout/SetRow'
import {
  useWorkout,
  useWorkoutSets,
  useUpdateWorkout,
  useDeleteWorkout,
  useInsertSet,
  useUpdateSet,
  useDeleteSet,
} from '@/hooks/useWorkouts'
import { useExercises, useLastSetForExercise } from '@/hooks/useExercises'
import { useProfile } from '@/hooks/useProfile'
import { useTemplateExercises } from '@/hooks/useTemplates'
import { formatWeight, formatDuration } from '@/lib/utils'
import type { Exercise, WorkoutSet, Units } from '@/types/database.types'

export function WorkoutActive() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId') ?? undefined

  const { data: workout, isLoading: wLoading } = useWorkout(id)
  const { data: sets, isLoading: sLoading } = useWorkoutSets(id)
  const { data: exercises } = useExercises()
  const { data: profile } = useProfile()
  const { data: templateExercises } = useTemplateExercises(templateId)
  const updateWorkout = useUpdateWorkout()
  const deleteWorkout = useDeleteWorkout()

  const units: Units = profile?.units ?? 'kg'

  const [pickerOpen, setPickerOpen] = useState(false)
  const [plannedIds, setPlannedIds] = useState<string[]>([])
  const [seededFromTemplate, setSeededFromTemplate] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (templateExercises && !seededFromTemplate) {
      setPlannedIds(templateExercises.map((te) => te.exercise_id))
      setSeededFromTemplate(true)
    }
  }, [templateExercises, seededFromTemplate])

  useEffect(() => {
    if (workout?.finished_at) {
      navigate(`/workout/${workout.id}`, { replace: true })
    }
  }, [workout?.finished_at, workout?.id, navigate])

  const exMap = useMemo(
    () => new Map((exercises ?? []).map((e) => [e.id, e])),
    [exercises],
  )

  const orderedExerciseIds = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const eid of plannedIds) {
      if (!seen.has(eid)) {
        seen.add(eid)
        order.push(eid)
      }
    }
    for (const s of sets ?? []) {
      if (!seen.has(s.exercise_id)) {
        seen.add(s.exercise_id)
        order.push(s.exercise_id)
      }
    }
    return order
  }, [plannedIds, sets])

  const setsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>()
    for (const s of sets ?? []) {
      const arr = map.get(s.exercise_id) ?? []
      arr.push(s)
      map.set(s.exercise_id, arr)
    }
    return map
  }, [sets])

  function addExercise(e: Exercise) {
    if (!plannedIds.includes(e.id) && !setsByExercise.has(e.id)) {
      setPlannedIds((p) => [...p, e.id])
    }
  }

  function removeExerciseFromPlan(exerciseId: string) {
    setPlannedIds((p) => p.filter((x) => x !== exerciseId))
  }

  async function finish() {
    if (!workout) return
    if ((sets ?? []).length === 0) {
      const ok = confirm('No sets logged. Discard this workout?')
      if (ok) {
        await deleteWorkout.mutateAsync(workout.id)
        toast.success('Workout discarded')
        navigate('/dashboard', { replace: true })
      }
      return
    }
    setFinishing(true)
    try {
      await updateWorkout.mutateAsync({
        id: workout.id,
        updates: { finished_at: new Date().toISOString() },
      })
      toast.success('Workout saved')
      navigate(`/workout/${workout.id}`, { replace: true })
    } catch (err) {
      setFinishing(false)
      toast.error(err instanceof Error ? err.message : 'Failed to finish')
    }
  }

  async function discard() {
    if (!workout) return
    const ok = confirm('Discard this workout? Logged sets will be lost.')
    if (!ok) return
    await deleteWorkout.mutateAsync(workout.id)
    toast.success('Workout discarded')
    navigate('/dashboard', { replace: true })
  }

  if (wLoading || sLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <p className="text-fg-muted">Workout not found.</p>
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    )
  }

  const totalSets = (sets ?? []).length
  const totalVolumeKg = (sets ?? []).reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )

  return (
    <div className="min-h-screen bg-bg pb-32">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-3 sm:px-6">
          <button
            type="button"
            onClick={discard}
            className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Discard"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold">{workout.name}</div>
            <LiveDuration startedAt={workout.started_at} />
          </div>
          <Button size="sm" loading={finishing} onClick={finish}>
            Finish
          </Button>
        </div>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 pb-3 text-xs text-fg-muted sm:px-6">
          <span>{totalSets} sets</span>
          <span>·</span>
          <span className="flex-1">
            {formatWeight(totalVolumeKg, units)} {units} volume
          </span>
          <span>{format(new Date(workout.started_at), 'MMM d, h:mm a')}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-6">
        {orderedExerciseIds.length === 0 && (
          <Card className="text-center">
            <p className="text-sm text-fg-muted">
              No exercises yet. Tap "Add exercise" below to get started.
            </p>
          </Card>
        )}

        {orderedExerciseIds.map((eid) => {
          const exercise = exMap.get(eid)
          if (!exercise) return null
          return (
            <ExerciseBlock
              key={eid}
              workoutId={workout.id}
              exercise={exercise}
              units={units}
              sets={setsByExercise.get(eid) ?? []}
              onRemoveEmpty={() => removeExerciseFromPlan(eid)}
            />
          )
        })}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-transparent py-4 text-sm font-semibold text-fg-muted hover:border-brand hover:text-brand"
        >
          <PlusIcon size={18} /> Add exercise
        </button>
      </main>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        excludeIds={orderedExerciseIds}
      />
    </div>
  )
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  return <div className="text-xs text-fg-muted tabular-nums">{formatDuration(secs)}</div>
}

function ExerciseBlock({
  workoutId,
  exercise,
  units,
  sets,
  onRemoveEmpty,
}: {
  workoutId: string
  exercise: Exercise
  units: Units
  sets: WorkoutSet[]
  onRemoveEmpty: () => void
}) {
  const insertSet = useInsertSet()
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const { data: lastSet } = useLastSetForExercise(exercise.id)

  const hint = lastSet
    ? lastSet.duration_secs != null
      ? `Last: ${formatDuration(lastSet.duration_secs)}`
      : lastSet.weight_kg != null
        ? `Last: ${formatWeight(lastSet.weight_kg, units)}${units} × ${lastSet.reps ?? '?'}`
        : lastSet.reps != null
          ? `Last: ${lastSet.reps} reps`
          : null
    : null

  const nextSetNumber = sets.length + 1

  return (
    <section className="space-y-2 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold">{exercise.name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant="muted">{exercise.category}</Badge>
            {hint && <span className="text-[11px] text-fg-dim">{hint}</span>}
          </div>
        </div>
        {sets.length === 0 && (
          <button
            type="button"
            onClick={onRemoveEmpty}
            className="rounded-md p-2 text-fg-dim hover:bg-surface-2 hover:text-danger"
            aria-label="Remove exercise"
          >
            <TrashIcon size={16} />
          </button>
        )}
      </div>

      <div className="space-y-1">
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            index={i + 1}
            exerciseType={exercise.type}
            units={units}
            existing={s}
            onSave={async (v) => {
              try {
                await updateSet.mutateAsync({ id: s.id, workout_id: workoutId, updates: v })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to save')
              }
            }}
            onDelete={async () => {
              try {
                await deleteSet.mutateAsync({ id: s.id, workout_id: workoutId })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to delete')
              }
            }}
            busy={deleteSet.isPending}
          />
        ))}
        <SetRow
          key={`new-${sets.length}`}
          index={nextSetNumber}
          exerciseType={exercise.type}
          units={units}
          busy={insertSet.isPending}
          onSave={async (v) => {
            try {
              await insertSet.mutateAsync({
                workout_id: workoutId,
                exercise_id: exercise.id,
                set_number: nextSetNumber,
                ...v,
              })
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to log set')
            }
          }}
        />
      </div>
    </section>
  )
}
