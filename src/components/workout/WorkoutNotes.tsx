import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Textarea } from '@/components/ui/Textarea'
import { useUpdateWorkout } from '@/hooks/useWorkouts'
import { errMessage } from '@/lib/utils'

interface Props {
  workoutId: string
  initialNotes: string | null
}

export function WorkoutNotes({ workoutId, initialNotes }: Props) {
  const [value, setValue] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(initialNotes ?? '')
  const updateWorkout = useUpdateWorkout()

  useEffect(() => {
    setValue(initialNotes ?? '')
    setSaved(initialNotes ?? '')
  }, [workoutId, initialNotes])

  async function commit() {
    const next = value.trim()
    const current = saved.trim()
    if (next === current) return
    try {
      await updateWorkout.mutateAsync({
        id: workoutId,
        updates: { notes: next.length ? next : null },
      })
      setSaved(next)
    } catch (err) {
      toast.error(errMessage(err, 'Failed to save notes'))
    }
  }

  return (
    <div className="glass rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </h3>
        {updateWorkout.isPending && (
          <span className="text-[10px] font-semibold text-primary">Saving…</span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        placeholder="How did it feel? Any PRs, struggles, or tweaks for next time…"
        rows={3}
        maxLength={5000}
        className="resize-y"
      />
    </div>
  )
}
