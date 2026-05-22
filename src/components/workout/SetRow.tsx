import { useState, useEffect } from 'react'
import { CheckIcon, TrashIcon } from '@/components/layout/Icons'
import { cn, fromKg, toKg } from '@/lib/utils'
import type { WorkoutSet, ExerciseType, Units } from '@/types/database.types'

interface Props {
  index: number
  exerciseType: ExerciseType
  units: Units
  existing?: WorkoutSet
  onSave: (values: { reps: number | null; weight_kg: number | null; duration_secs: number | null }) => void | Promise<void>
  onDelete?: () => void | Promise<void>
  busy?: boolean
}

export function SetRow({ index, exerciseType, units, existing, onSave, onDelete, busy }: Props) {
  const initialWeight =
    existing?.weight_kg != null ? String(fromKg(existing.weight_kg, units)) : ''
  const initialReps = existing?.reps != null ? String(existing.reps) : ''
  const initialDuration = existing?.duration_secs != null ? String(existing.duration_secs) : ''

  const [weight, setWeight] = useState(initialWeight)
  const [reps, setReps] = useState(initialReps)
  const [duration, setDuration] = useState(initialDuration)

  useEffect(() => {
    setWeight(initialWeight)
    setReps(initialReps)
    setDuration(initialDuration)
  }, [existing?.id, initialWeight, initialReps, initialDuration])

  const isCardio = exerciseType === 'cardio'
  const isBodyweight = exerciseType === 'bodyweight'
  const showWeight = !isCardio && !isBodyweight
  const showReps = !isCardio
  const showDuration = isCardio

  function save() {
    const w = weight ? Number(weight) : null
    const r = reps ? Number(reps) : null
    const d = duration ? Number(duration) : null
    onSave({
      reps: r,
      weight_kg: w != null ? toKg(w, units) : null,
      duration_secs: d,
    })
  }

  function commitIfChanged() {
    if (!existing) return
    if (weight !== initialWeight || reps !== initialReps || duration !== initialDuration) save()
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-2',
        existing ? 'bg-surface-2/60' : 'bg-transparent',
      )}
    >
      <span className="w-6 shrink-0 text-center text-xs font-semibold text-fg-dim tabular-nums">
        {index}
      </span>

      {showWeight && (
        <NumField
          value={weight}
          onChange={setWeight}
          onBlur={commitIfChanged}
          placeholder={units}
          suffix={units}
        />
      )}
      {showReps && (
        <NumField
          value={reps}
          onChange={setReps}
          onBlur={commitIfChanged}
          placeholder="reps"
          suffix="reps"
        />
      )}
      {showDuration && (
        <NumField
          value={duration}
          onChange={setDuration}
          onBlur={commitIfChanged}
          placeholder="sec"
          suffix="s"
        />
      )}

      {existing ? (
        onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-md p-2 text-fg-dim hover:bg-surface hover:text-danger disabled:opacity-50"
            aria-label="Delete set"
          >
            <TrashIcon size={16} />
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={save}
          disabled={
            busy ||
            (showReps && !reps) ||
            (showDuration && !duration)
          }
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-semibold text-black transition-all active:scale-[0.97] disabled:bg-surface-2 disabled:text-fg-dim"
        >
          <CheckIcon size={14} /> Log
        </button>
      )}
    </div>
  )
}

function NumField({
  value,
  onChange,
  onBlur,
  placeholder,
  suffix,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder: string
  suffix: string
}) {
  return (
    <div className="relative flex-1">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 pr-10 text-sm text-fg placeholder:text-fg-dim focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase text-fg-dim">
        {suffix}
      </span>
    </div>
  )
}
