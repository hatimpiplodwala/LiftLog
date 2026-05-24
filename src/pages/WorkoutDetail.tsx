import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { PlusIcon, ShareIcon, TrashIcon } from '@/components/layout/Icons'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { SetRow } from '@/components/workout/SetRow'
import { WorkoutNotes } from '@/components/workout/WorkoutNotes'
import {
  useWorkout,
  useWorkoutSets,
  useDeleteWorkout,
  useUpdateWorkout,
  useInsertSet,
  useUpdateSet,
  useDeleteSet,
} from '@/hooks/useWorkouts'
import { useExercises, useExercisePR, isSetPR } from '@/hooks/useExercises'
import { useProfile } from '@/hooks/useProfile'
import { useCreateTemplate } from '@/hooks/useTemplates'
import { formatWeight, formatDuration, workoutDurationSecs } from '@/lib/utils'
import type { Exercise, WorkoutSet, Units } from '@/types/database.types'

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: workout, isLoading } = useWorkout(id)
  const { data: sets } = useWorkoutSets(id)
  const { data: exercises } = useExercises()
  const { data: profile } = useProfile()
  const deleteWorkout = useDeleteWorkout()
  const updateWorkout = useUpdateWorkout()
  const createTemplate = useCreateTemplate()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [extraIds, setExtraIds] = useState<string[]>([])
  const [shareOpen, setShareOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [sharing, setSharing] = useState(false)

  const units: Units = profile?.units ?? 'kg'

  const exMap = useMemo(
    () => new Map((exercises ?? []).map((e) => [e.id, e])),
    [exercises],
  )

  const orderedExerciseIds = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const s of sets ?? []) {
      if (!seen.has(s.exercise_id)) {
        seen.add(s.exercise_id)
        order.push(s.exercise_id)
      }
    }
    for (const eid of extraIds) {
      if (!seen.has(eid)) {
        seen.add(eid)
        order.push(eid)
      }
    }
    return order
  }, [sets, extraIds])

  const setsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>()
    for (const s of sets ?? []) {
      const arr = map.get(s.exercise_id) ?? []
      arr.push(s)
      map.set(s.exercise_id, arr)
    }
    return map
  }, [sets])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (!workout) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-muted-foreground">Workout not found.</p>
        <Link to="/history" className="mt-4 inline-block text-sm font-semibold text-primary">
          Back to history
        </Link>
      </div>
    )
  }

  const totalVolumeKg = (sets ?? []).reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  )
  const totalSets = (sets ?? []).length
  const durationSecs = workoutDurationSecs(workout.started_at, workout.finished_at)
  const isFinished = !!workout.finished_at

  async function onDelete() {
    if (!workout) return
    if (!confirm('Delete this workout? This cannot be undone.')) return
    await deleteWorkout.mutateAsync(workout.id)
    toast.success('Workout deleted')
    navigate('/history', { replace: true })
  }

  async function onShare() {
    if (!workout) return
    setSharing(true)
    try {
      let token = workout.share_token
      if (!token) {
        token = crypto.randomUUID()
        await updateWorkout.mutateAsync({
          id: workout.id,
          updates: { share_token: token },
        })
      }
      const url = `${window.location.origin}/share/${token}`
      await navigator.clipboard.writeText(url)
      setShareOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to share')
    } finally {
      setSharing(false)
    }
  }

  async function onSaveTemplate() {
    if (!templateName.trim()) {
      toast.error('Give your template a name')
      return
    }
    const ids = orderedExerciseIds
    if (ids.length === 0) {
      toast.error('No exercises to save')
      return
    }
    try {
      await createTemplate.mutateAsync({ name: templateName.trim(), exerciseIds: ids })
      toast.success('Template saved')
      setTemplateOpen(false)
      setTemplateName('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  return (
    <div>
      <PageHeader
        title={workout.name}
        subtitle={format(new Date(workout.started_at), 'EEE, MMM d · h:mm a')}
        back
        right={
          isFinished && (
            <button
              type="button"
              onClick={onShare}
              disabled={sharing}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
              aria-label="Share"
            >
              <ShareIcon size={18} />
            </button>
          )
        }
      />

      <div className="space-y-4 px-4 pb-10 sm:px-6">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Duration" value={formatDuration(durationSecs)} />
          <Stat label="Sets" value={String(totalSets)} />
          <Stat label="Volume" value={`${formatWeight(totalVolumeKg, units)} ${units}`} />
        </div>

        {!isFinished && (
          <Card className="border-primary/40 bg-primary/5">
            <p className="text-sm text-foreground">
              This workout is still in progress.{' '}
              <Link
                to={`/workout/${workout.id}/active`}
                className="font-semibold text-primary hover:underline"
              >
                Resume →
              </Link>
            </p>
          </Card>
        )}

        <WorkoutNotes workoutId={workout.id} initialNotes={workout.notes} />

        {orderedExerciseIds.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-muted-foreground">No exercises logged.</p>
          </Card>
        ) : (
          orderedExerciseIds.map((eid) => {
            const exercise = exMap.get(eid)
            if (!exercise) return null
            return (
              <ExerciseSection
                key={eid}
                workoutId={workout.id}
                exercise={exercise}
                units={units}
                sets={setsByExercise.get(eid) ?? []}
                onRemoveEmpty={() =>
                  setExtraIds((prev) => prev.filter((x) => x !== eid))
                }
              />
            )
          })
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-transparent py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          <PlusIcon size={18} /> Add exercise
        </button>

        {isFinished && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" onClick={() => setTemplateOpen(true)}>
              Save as template
            </Button>
            <Button variant="danger" onClick={onDelete}>
              <TrashIcon size={16} /> Delete
            </Button>
          </div>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(e) => {
          if (!orderedExerciseIds.includes(e.id)) {
            setExtraIds((prev) => [...prev, e.id])
          }
        }}
        excludeIds={orderedExerciseIds}
      />

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share link copied">
        <p className="text-sm text-muted-foreground">
          The public link to this workout has been copied to your clipboard.
        </p>
        <p className="mt-3 break-all rounded-md bg-secondary p-3 text-xs text-foreground">
          {workout.share_token
            ? `${window.location.origin}/share/${workout.share_token}`
            : ''}
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShareOpen(false)}>Done</Button>
        </div>
      </Modal>

      <BottomSheet
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Save as template"
      >
        <div className="space-y-4">
          <Input
            label="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Push Day A"
            autoFocus
          />
          <div className="text-xs text-muted-foreground">
            Saves {orderedExerciseIds.length} exercise
            {orderedExerciseIds.length === 1 ? '' : 's'}.
          </div>
          <Button fullWidth loading={createTemplate.isPending} onClick={onSaveTemplate}>
            Save template
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-3">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-extrabold tabular-nums text-foreground">{value}</div>
    </Card>
  )
}

function ExerciseSection({
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
  const { data: pr } = useExercisePR(exercise.id)
  const nextSetNumber = sets.length + 1

  return (
    <section className="glass space-y-2 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{exercise.name}</h3>
          <Badge variant="muted" className="mt-1">
            {exercise.category}
          </Badge>
        </div>
        {sets.length === 0 && (
          <button
            type="button"
            onClick={onRemoveEmpty}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
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
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Failed to add set')
            }
          }}
        />
      </div>
    </section>
  )
}
