import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@/components/layout/Icons'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { SetRow } from '@/components/workout/SetRow'
import { WorkoutNotes } from '@/components/workout/WorkoutNotes'
import { RestTimer, getStoredRestDuration } from '@/components/workout/RestTimer'
import {
  useWorkout,
  useWorkoutSets,
  useUpdateWorkout,
  useDeleteWorkout,
  useInsertSet,
  useUpdateSet,
  useDeleteSet,
} from '@/hooks/useWorkouts'
import {
  useExercises,
  useLastSetForExercise,
  useExercisePR,
  isSetPR,
  usePreviousSessionSets,
} from '@/hooks/useExercises'
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
  const [exerciseOrder, setExerciseOrder] = useState<string[]>([])
  const [seededFromTemplate, setSeededFromTemplate] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [restDuration, setRestDuration] = useState<number>(() => getStoredRestDuration())
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)

  function startRest() {
    setRestEndsAt(Date.now() + restDuration * 1000)
  }

  useEffect(() => {
    if (templateExercises && !seededFromTemplate) {
      setExerciseOrder((cur) => {
        const next = [...cur]
        for (const te of templateExercises) {
          if (!next.includes(te.exercise_id)) next.push(te.exercise_id)
        }
        return next
      })
      setSeededFromTemplate(true)
    }
  }, [templateExercises, seededFromTemplate])

  useEffect(() => {
    if (!sets || sets.length === 0) return
    setExerciseOrder((cur) => {
      const next = [...cur]
      for (const s of sets) {
        if (!next.includes(s.exercise_id)) next.push(s.exercise_id)
      }
      return next
    })
  }, [sets])

  useEffect(() => {
    if (workout?.finished_at) {
      navigate(`/workout/${workout.id}`, { replace: true })
    }
  }, [workout?.finished_at, workout?.id, navigate])

  const exMap = useMemo(
    () => new Map((exercises ?? []).map((e) => [e.id, e])),
    [exercises],
  )

  const orderedExerciseIds = exerciseOrder

  function moveExercise(exerciseId: string, dir: -1 | 1) {
    setExerciseOrder((cur) => {
      const i = cur.indexOf(exerciseId)
      if (i < 0) return cur
      const j = i + dir
      if (j < 0 || j >= cur.length) return cur
      const next = [...cur]
      const [it] = next.splice(i, 1)
      next.splice(j, 0, it)
      return next
    })
  }

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
    if (!exerciseOrder.includes(e.id)) {
      setExerciseOrder((p) => [...p, e.id])
    }
  }

  function removeExerciseFromPlan(exerciseId: string) {
    setExerciseOrder((p) => p.filter((x) => x !== exerciseId))
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-muted-foreground">Workout not found.</p>
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
    <div className="min-h-screen pb-32">
      <header className="glass-strong sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-3 sm:px-6">
          <button
            type="button"
            onClick={discard}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Discard"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-bold text-foreground">{workout.name}</div>
            <LiveDuration startedAt={workout.started_at} />
          </div>
          <Button size="sm" loading={finishing} onClick={finish}>
            Finish
          </Button>
        </div>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 pb-3 text-xs text-muted-foreground sm:px-6">
          <span className="font-semibold tabular-nums text-primary">{totalSets} sets</span>
          <span className="text-muted-foreground">·</span>
          <span className="flex-1 tabular-nums">
            {formatWeight(totalVolumeKg, units)} {units} volume
          </span>
          <span className="text-muted-foreground">{format(new Date(workout.started_at), 'MMM d, h:mm a')}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-6">
        <WorkoutNotes workoutId={workout.id} initialNotes={workout.notes} />

        {orderedExerciseIds.length === 0 && (
          <Card className="text-center">
            <p className="text-sm text-muted-foreground">
              No exercises yet. Tap "Add exercise" below to get started.
            </p>
          </Card>
        )}

        {orderedExerciseIds.map((eid, idx) => {
          const exercise = exMap.get(eid)
          if (!exercise) return null
          return (
            <ExerciseBlock
              key={eid}
              workoutId={workout.id}
              exercise={exercise}
              units={units}
              sets={setsByExercise.get(eid) ?? []}
              canMoveUp={idx > 0}
              canMoveDown={idx < orderedExerciseIds.length - 1}
              onMoveUp={() => moveExercise(eid, -1)}
              onMoveDown={() => moveExercise(eid, 1)}
              onRemoveEmpty={() => removeExerciseFromPlan(eid)}
              onSetLogged={startRest}
            />
          )
        })}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-transparent py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
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

      <RestTimer
        endsAt={restEndsAt}
        duration={restDuration}
        onDurationChange={setRestDuration}
        onDismiss={() => setRestEndsAt(null)}
        onExtend={(extra) =>
          setRestEndsAt((cur) => (cur != null ? cur + extra * 1000 : Date.now() + extra * 1000))
        }
      />
    </div>
  )
}

function formatPrevSet(
  s: { reps: number | null; weight_kg: number | null; duration_secs: number | null },
  type: 'strength' | 'bodyweight' | 'cardio',
  units: Units,
): string {
  if (type === 'cardio') {
    return s.duration_secs != null ? formatDuration(s.duration_secs) : '—'
  }
  if (type === 'bodyweight') {
    return s.reps != null ? `${s.reps} reps` : '—'
  }
  if (s.weight_kg != null) {
    return `${formatWeight(s.weight_kg, units)}${units} × ${s.reps ?? '?'}`
  }
  return s.reps != null ? `${s.reps} reps` : '—'
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  return <div className="text-xs text-muted-foreground tabular-nums">{formatDuration(secs)}</div>
}

function ExerciseBlock({
  workoutId,
  exercise,
  units,
  sets,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemoveEmpty,
  onSetLogged,
}: {
  workoutId: string
  exercise: Exercise
  units: Units
  sets: WorkoutSet[]
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemoveEmpty: () => void
  onSetLogged: () => void
}) {
  const insertSet = useInsertSet()
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const { data: lastSet } = useLastSetForExercise(exercise.id)
  const { data: pr } = useExercisePR(exercise.id)
  const { data: prevSession } = usePreviousSessionSets(exercise.id, workoutId)

  const hint =
    prevSession && prevSession.length > 0
      ? null
      : lastSet
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
    <section className="glass space-y-2 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{exercise.name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge variant="muted">{exercise.category}</Badge>
            {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            aria-label="Move up"
          >
            <ChevronUpIcon size={16} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            aria-label="Move down"
          >
            <ChevronDownIcon size={16} />
          </button>
          {sets.length === 0 && (
            <button
              type="button"
              onClick={onRemoveEmpty}
              className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
              aria-label="Remove exercise"
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {prevSession && prevSession.length > 0 && (
        <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Previous session
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
            {prevSession.map((ps, i) => (
              <span key={i}>
                <span>{i + 1}.</span>{' '}
                {formatPrevSet(ps, exercise.type, units)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {sets.map((s, i) => (
          <SetRow
            key={s.id}
            index={i + 1}
            exerciseType={exercise.type}
            units={units}
            existing={s}
            isPR={isSetPR(s, pr, exercise.type)}
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
              onSetLogged()
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to log set')
            }
          }}
        />
      </div>
    </section>
  )
}
